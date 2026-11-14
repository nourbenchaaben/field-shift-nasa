from __future__ import annotations

import logging
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .data.climate import get_climate_profile
from .data.meteomatics_client import build_profile as build_meteomatics_profile
from .data.power_client import MONTHS, doy_to_text
from .engine.crops import CROPS, ROTATIONS
from .engine.scenarios import select_wet_climate
from .engine.scoring import explain, score_rotation, status

app = FastAPI(title="Rotation Compass API", version="1.0.0")
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    lat: float = Field(36.73, ge=-90, le=90)
    lon: float = Field(9.18, ge=-180, le=180)
    years: int = Field(10, ge=5, le=20)
    use_gee: bool = True
    use_meteomatics: bool = False
    slope_deg: float | None = Field(None, ge=0, le=90)
    weights: dict[str, float] = Field(
        default={"soil": 7, "water": 8, "erosion": 5, "income": 0}
    )
    scenario: str = "normal"
    replay_year: int | None = None
    rain_change_pct: int = Field(0, ge=-40, le=20)
    custom_rotation: list[str] = ["Durum wheat", "Fava bean", "Barley + vetch"]


def _risk_calendar(profile, gee):
    rows = {}
    ndvi = gee.get("ndvi_clim", {}) if gee else {}
    for label, values, yellow, red, lower in [
        ("frost", profile["frost_clim"], 0.2, 1.0, False),
        ("heavy_rain", profile["heavy_clim"], 0.3, 1.0, False),
        ("dry_soil", profile["wet_clim"], 0.45, 0.30, True),
    ]:
        levels = []
        for value in values:
            if value is None:
                levels.append("none")
            elif (value <= red if lower else value >= red):
                levels.append("red")
            elif (value <= yellow if lower else value >= yellow):
                levels.append("yellow")
            else:
                levels.append("green")
        rows[label] = levels
    if ndvi:
        rows["bare_field"] = [
            "none" if _ndvi(ndvi, month) is None else
            "red" if _ndvi(ndvi, month) <= 0.25 else
            "yellow" if _ndvi(ndvi, month) <= 0.35 else "green"
            for month in range(1, 13)
        ]
    return {"months": MONTHS, "rows": rows}


def _ndvi(ndvi, month):
    return ndvi.get(str(month), ndvi.get(month))


def _monthly_gee_values(gee, key):
    values = (gee or {}).get(key, {})
    return [values.get(str(month), values.get(month)) for month in range(1, 13)]


def _exposed_heavy_rain_months(heavy_rain_days, ndvi):
    if not ndvi:
        return []
    return [
        MONTHS[month - 1]
        for month in range(1, 13)
        if ndvi[month - 1] is not None
        and ndvi[month - 1] < 0.25
        and heavy_rain_days[month - 1] > 0.2
    ]


def _contract_risk_calendar(profile, gee, scenario, slope):
    ndvi = _monthly_gee_values(gee, "ndvi_clim")
    wet = profile["wet_clim"]
    heavy = profile["heavy_clim"]
    temperatures = profile["monthly_temp_c"]
    months = []
    for index, month in enumerate(MONTHS):
        drought = round(float(np.clip((1 - (wet[index] or 0)) * 100, 0, 100)))
        erosion = round(float(np.clip(heavy[index] * 45 * (1 + slope / 20), 0, 100)))
        heat = round(float(np.clip(((temperatures[index] or 0) - 18) * 6, 0, 100)))
        pest = 0
        values = {
            "Moisture deficit": drought,
            "Runoff & slope erosion": erosion,
            "Thermal stress": heat,
            "Pest pressure": pest,
        }
        dominant, dominant_value = max(values.items(), key=lambda item: item[1])
        months.append({
            "month": month,
            "drought_risk": drought,
            "erosion_risk": erosion,
            "heat_risk": heat,
            "pest_risk": pest,
            "dominant_hazard": dominant if dominant_value >= 45 else "Low risk",
        })
    peak = sorted(months, key=lambda item: max(
        item["drought_risk"], item["erosion_risk"], item["heat_risk"]
    ), reverse=True)[:3]
    return {
        "scenario": scenario,
        "peak_risk_months": [item["month"] for item in peak],
        "months": months,
        "raw": _risk_calendar(profile, gee),
    }


def _checklist():
    return [
        {"id": "soil-test", "priority": "High", "timing": "Before sowing",
         "action": "Check soil salinity and pH", "reason": "Confirms crop suitability and fertilizer needs."},
        {"id": "seed-market", "priority": "Medium", "timing": "Before purchase",
         "action": "Confirm local seed availability, prices, and buyers",
         "reason": "Validates the economic assumptions in the rotation comparison."},
        {"id": "disease-history", "priority": "Medium", "timing": "Before rotation approval",
         "action": "Review disease history for this field",
         "reason": "Local disease pressure can change the best rotation."},
        {"id": "sowing-date", "priority": "High", "timing": "Before autumn rains",
         "action": "Confirm sowing dates with the local extension office",
         "reason": "Rain onset is regional and should be checked against field conditions."},
    ]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/crops")
def crops():
    return CROPS


def _validate_weights(weights: dict[str, float]) -> None:
    expected = {"soil", "water", "erosion", "income"}
    if set(weights) != expected:
        raise HTTPException(status_code=422, detail="weights must contain soil, water, erosion, and income")
    if any(value < 0 or value > 10 for value in weights.values()):
        raise HTTPException(status_code=422, detail="weights must be between 0 and 10")
    if sum(weights.values()) <= 0:
        raise HTTPException(status_code=422, detail="at least one priority weight must be greater than zero")


def _canonical_scenario(value: str) -> str:
    aliases = {
        "drought": "bad_year",
        "heatwave": "bad_year",
        "wet": "normal",
    }
    scenario = aliases.get(value, value)
    if scenario not in {"normal", "bad_year"}:
        raise HTTPException(status_code=422, detail="scenario must be normal or bad_year")
    return scenario


def _canonical_crop(value: str) -> str | None:
    aliases = {
        "Durum Wheat": "Durum wheat",
        "Chickpeas": "Chickpea",
        "Fava Beans": "Fava bean",
        "Winter Barley": "Barley + vetch",
        "Barley": "Barley + vetch",
        "Grain Sorghum": "Oats",
        "Oilseed Sunflower": "Rapeseed / Colza",
        "Winter Canola": "Rapeseed / Colza",
        "Red Lentils": "Lentil",
        "Alfalfa Forage": "Alfalfa",
        "Crimson Clover Cover": "Fava bean",
    }
    return aliases.get(value, value if value in CROPS else None)


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    _validate_weights(request.weights)
    scenario = _canonical_scenario(request.scenario)
    custom_rotation = [_canonical_crop(crop) for crop in request.custom_rotation]
    if len(custom_rotation) != 3 or any(crop is None for crop in custom_rotation):
        unknown = [original for original, canonical in zip(request.custom_rotation, custom_rotation) if canonical is None]
        raise HTTPException(status_code=422, detail=f"Unknown crop(s) in custom_rotation: {unknown}")
    gee_fallback_reason = None
    try:
        profile = get_climate_profile(request.lat, request.lon, request.years, request.use_gee)
    except Exception as gee_error:
        logger.warning("Earth Engine unavailable; falling back to NASA POWER: %s", gee_error)
        gee_fallback_reason = str(gee_error)
        try:
            profile = get_climate_profile(request.lat, request.lon, request.years, False)
        except Exception as error:
            raise HTTPException(status_code=502, detail=f"Climate data unavailable: {error}") from error
    meteomatics = None
    if request.use_meteomatics:
        try:
            meteomatics = {
                "available": True,
                **build_meteomatics_profile(request.lat, request.lon, profile["frame"]),
            }
        except Exception as error:
            meteomatics = {
                "available": False,
                "source": "Meteomatics",
                "error": str(error),
            }

    rain = profile["rain_by_year"]
    rain_values = np.array(list(rain.values()), dtype=float)
    mean_rain = float(np.mean(rain_values))
    cv = float(np.std(rain_values) / mean_rain) if mean_rain else 0
    slope = request.slope_deg if request.slope_deg is not None else (profile["gee"] or {}).get("slope_deg", 5)
    wet = np.clip(select_wet_climate(profile, scenario, request.replay_year, request.rain_change_pct), 0, 1)
    rotations = []
    for rotation_id, (name, crop_list) in ROTATIONS.items():
        score, parts = score_rotation(crop_list, wet, profile["heavy_clim"], slope, request.weights)
        rotations.append({"rotation_id": rotation_id, "id": rotation_id, "name": name, "crops": crop_list,
                          "total_score": score, "status_color": status(score), "status": status(score),
                          "explain_text": explain(parts), "explanation": explain(parts),
                          "breakdown": {key: round(value, 3) for key, value in parts.items()}})
    score, parts = score_rotation(custom_rotation, wet, profile["heavy_clim"], slope, request.weights)
    rotations.append({"rotation_id": "custom", "id": "custom", "name": "Custom rotation",
                          "crops": custom_rotation, "total_score": score,
                          "status_color": status(score), "status": status(score),
                          "explain_text": explain(parts), "explanation": explain(parts),
                          "breakdown": {key: round(value, 3) for key, value in parts.items()}})
    rotations.sort(key=lambda item: item["total_score"], reverse=True)
    onset = profile["autumn_onset"]
    onset_values = list(onset.values())
    best = rotations[0]
    best_parts = best["breakdown"]
    ndvi = _monthly_gee_values(profile["gee"], "ndvi_clim")
    exposed_months = _exposed_heavy_rain_months(profile["heavy_clim"], ndvi)
    bare_days = len(exposed_months) * 30
    risk_calendar = _contract_risk_calendar(profile, profile["gee"], scenario, slope)
    return {
        "region_validated": 30 <= request.lat <= 38 and 7 <= request.lon <= 12,
        "kpis": {
            "soil_health_index": round(best_parts["soil"] * 100),
            "water_savings_pct": round(best_parts["water"] * 100),
            "erosion_reduction_pct": round(best_parts["erosion"] * 100),
            "yield_stability_pct": round(best_parts["water"] * 100),
            "expected_yield_gain_pct": 0,
            "som_gain_pct": 0,
            "nitrogen_balance_kg_ha": 0,
            "sustainability_score": round(best["total_score"] * 10),
            "avg_rain_mm": round(mean_rain),
            "driest_year": int(min(rain, key=rain.get)),
            "driest_year_mm": round(min(rain_values)),
            "heavy_rain_days_yr": round(sum(profile["heavy_clim"]), 1),
            "slope_deg": round(float(slope), 1),
        },
        "confidence": {
            "overall_score": 70 if profile["gee"] else 55,
            "level": "Moderate" if len(rain) >= 5 else "Low",
            "data_source": "NASA POWER" + (" + Google Earth Engine" if profile["gee"] else ""),
            "gee_enabled": profile["gee"] is not None,
            "satellite_coverage_pct": 100 if profile["gee"] else 60,
            "calibration_note": "Crop values are generic and require local agronomist validation.",
            "sources_used": ["NASA POWER"] + (["SMAP", "MODIS", "SRTM"] if profile["gee"] else []),
            "fallback_reason": gee_fallback_reason,
        },
        "meteomatics": meteomatics,
        "rotations": [
            {
                "rank": index + 1,
                "name": item["name"],
                "sequence": item["crops"],
                "composite_score": round(item["total_score"] * 10),
                "soil_score": round(item["breakdown"]["soil"] * 100),
                "water_score": round(item["breakdown"]["water"] * 100),
                "erosion_score": round(item["breakdown"]["erosion"] * 100),
                "income_score": round(item["breakdown"]["income"] * 100),
                "avg_yield_t_ha": 0,
                "water_use_mm": 0,
                "rationale": item["explain_text"],
                "rotation_id": item["rotation_id"],
                "total_score": item["total_score"],
                "status_color": item["status_color"],
                "breakdown": item["breakdown"],
            }
            for index, item in enumerate(rotations)
        ],
        "monthly_telemetry": {
            "months": MONTHS,
            "monthly_rain_mm": profile["monthly_rain_mm"],
            "monthly_soil_moisture": profile["wet_clim"],
            "monthly_ndvi": _monthly_gee_values(profile["gee"], "ndvi_clim"),
            "monthly_temp_c": profile["monthly_temp_c"],
            "monthly_temp_min_c": profile["monthly_temp_min_c"],
        },
        "bare_field_clock": {
            "bare_days_per_year": bare_days,
            "baseline_bare_days": bare_days,
            "cover_pct": round((1 - bare_days / 365) * 100),
            "high_risk_months": exposed_months,
            "erosion_risk_level": "Elevated" if exposed_months else "Low",
            "summary": "NDVI is unavailable without Earth Engine." if not ndvi else
                "Months with low canopy cover and heavy rain overlap.",
            "months": MONTHS,
            "heavy_rain_days": profile["heavy_clim"],
            "ndvi": _monthly_gee_values(profile["gee"], "ndvi_clim"),
            "exposed_heavy_rain_months": _exposed_heavy_rain_months(
                profile["heavy_clim"], _monthly_gee_values(profile["gee"], "ndvi_clim")
            ),
        },
        "sowing_window": {"primary_crop": custom_rotation[0],
                          "optimal_start": doy_to_text(min(onset_values)) if onset_values else "",
                          "optimal_end": doy_to_text(max(onset_values)) if onset_values else "",
                          "soil_moisture_trigger_pct": 45,
                          "surface_temp_window_c": "10-20°C",
                          "advisory": "Confirm the window with local agronomists.",
                          "median_date": doy_to_text(np.median(onset_values)) if onset_values else None,
                          "earliest_date": doy_to_text(min(onset_values)) if onset_values else None,
                          "latest_date": doy_to_text(max(onset_values)) if onset_values else None,
                          "spread_days": int(max(onset_values) - min(onset_values)) if onset_values else 0,
                          "yearly_doy": onset},
        "risk_calendar": risk_calendar,
        "agronomist_checklist": _checklist(),
        "caveats": ["Coarse satellite pixels (SMAP ~9 km, POWER ~50 km) may not match a single field.",
                    "Crop responses use generic regional assumptions; verify with local extension services."],
    }
