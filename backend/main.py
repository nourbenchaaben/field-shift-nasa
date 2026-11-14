from __future__ import annotations

from typing import Any, Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .data.climate import get_climate_profile
from .data.power_client import MONTHS, doy_to_text
from .engine.crops import CROPS, ROTATIONS
from .engine.scenarios import select_wet_climate
from .engine.scoring import explain, score_rotation, status

app = FastAPI(title="Rotation Compass API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


class AnalyzeRequest(BaseModel):
    lat: float = Field(36.73, ge=-90, le=90)
    lon: float = Field(9.18, ge=-180, le=180)
    years: int = Field(10, ge=5, le=20)
    use_gee: bool = False
    slope_deg: float | None = Field(5, ge=0, le=90)
    weights: dict[str, float] = {"soil": 7, "water": 8, "erosion": 5, "income": 0}
    scenario: Literal["normal", "bad_year"] = "normal"
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
            "red" if ndvi.get(str(month), 1) <= 0.25 else "yellow" if ndvi.get(str(month), 1) <= 0.35 else "green"
            for month in range(1, 13)
        ]
    return {"months": MONTHS, "rows": rows}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/crops")
def crops():
    return CROPS


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    try:
        profile = get_climate_profile(request.lat, request.lon, request.years, request.use_gee)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Climate data unavailable: {error}") from error

    rain = profile["rain_by_year"]
    rain_values = np.array(list(rain.values()), dtype=float)
    mean_rain = float(np.mean(rain_values))
    cv = float(np.std(rain_values) / mean_rain) if mean_rain else 0
    slope = request.slope_deg if request.slope_deg is not None else (profile["gee"] or {}).get("slope_deg", 0)
    wet = np.clip(select_wet_climate(profile, request.scenario, request.replay_year, request.rain_change_pct), 0, 1)
    rotations = []
    for rotation_id, (name, crop_list) in ROTATIONS.items():
        score, parts = score_rotation(crop_list, wet, profile["heavy_clim"], slope, request.weights)
        rotations.append({"rotation_id": rotation_id, "id": rotation_id, "name": name, "crops": crop_list,
                          "total_score": score, "status_color": status(score), "status": status(score),
                          "explain_text": explain(parts), "explanation": explain(parts),
                          "breakdown": {key: round(value, 3) for key, value in parts.items()}})
    if len(request.custom_rotation) != 3 or any(crop not in CROPS for crop in request.custom_rotation):
        raise HTTPException(status_code=422, detail="custom_rotation must contain three known crops")
    score, parts = score_rotation(request.custom_rotation, wet, profile["heavy_clim"], slope, request.weights)
    rotations.append({"rotation_id": "custom", "id": "custom", "name": "Custom rotation",
                          "crops": request.custom_rotation, "total_score": score,
                          "status_color": status(score), "status": status(score),
                          "explain_text": explain(parts), "explanation": explain(parts),
                          "breakdown": {key: round(value, 3) for key, value in parts.items()}})
    rotations.sort(key=lambda item: item["total_score"], reverse=True)
    onset = profile["autumn_onset"]
    onset_values = list(onset.values())
    return {
        "region_validated": 30 <= request.lat <= 38 and 7 <= request.lon <= 12,
        "kpis": {"avg_rain_mm": round(mean_rain), "driest_year": min(rain, key=rain.get),
                 "driest_year_mm": round(min(rain_values)), "heavy_rain_days_yr": round(sum(profile["heavy_clim"]), 1),
                 "slope_deg": round(float(slope), 1)},
        "confidence": {"level": "low" if len(rain) < 5 else "medium",
                       "label": "Rainfall very variable" if cv > 0.3 else "Satellite data good, crop table generic",
                       "sources_used": ["NASA POWER"] + (["SMAP", "MODIS", "SRTM"] if request.use_gee else [])},
        "rotations": rotations,
        "monthly_telemetry": {
            "months": MONTHS,
            "monthly_rain_mm": profile["monthly_rain_mm"],
            "monthly_soil_moisture": profile["wet_clim"],
            "monthly_ndvi": [(profile["gee"] or {}).get("ndvi_clim", {}).get(str(m)) for m in range(1, 13)],
            "monthly_temp_c": profile["monthly_temp_c"],
            "monthly_temp_min_c": profile["monthly_temp_min_c"],
        },
        "bare_field_clock": {"months": MONTHS, "heavy_rain_days": profile["heavy_clim"],
                             "ndvi": [(profile["gee"] or {}).get("ndvi_clim", {}).get(str(m)) for m in range(1, 13)],
                             "exposed_heavy_rain_months": []},
        "sowing_window": {"median_date": doy_to_text(np.median(onset_values)) if onset_values else None,
                          "earliest_date": doy_to_text(min(onset_values)) if onset_values else None,
                          "latest_date": doy_to_text(max(onset_values)) if onset_values else None,
                          "spread_days": int(max(onset_values) - min(onset_values)) if onset_values else 0,
                          "yearly_doy": onset},
        "risk_calendar": _risk_calendar(profile, profile["gee"]),
        "agronomist_checklist": ["Soil salinity and pH of this field", "Local seed availability and prices",
                                 "Local buyers / market price for the new crop",
                                 "Disease history (chickpea blight, fava chocolate spot)",
                                 "Sowing dates recommended by the local extension office"],
        "caveats": ["Coarse satellite pixels (SMAP ~9 km, POWER ~50 km) may not match a single field.",
                    "Crop responses use generic regional assumptions; verify with local extension services."],
    }
