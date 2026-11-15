from __future__ import annotations

from typing import Mapping

import numpy as np

from .crops import CROPS


def erosion_component(crops, heavy_clim, slope_deg: float) -> float:
    total = max(sum(heavy_clim), 1e-9)
    exposed = []
    for crop in crops:
        cover = CROPS[crop]["cover"]
        exposed.append(sum(heavy_clim[month - 1] for month in range(1, 13) if month not in cover) / total)
    multiplier = 1 + min(max(slope_deg, 0), 20) / 20
    return float(np.clip(1 - np.mean(exposed) * multiplier / 2, 0, 1))


def score_rotation(crops, wet_clim, heavy_clim, slope_deg: float, weights: Mapping[str, float]):
    items = [CROPS[crop] for crop in crops]
    diversity = (len(set(crops)) - 1) / 2
    soil = 0.6 * float(np.mean([item["n_fix"] for item in items])) + 0.4 * diversity
    erosion = erosion_component(crops, heavy_clim, slope_deg)
    risks = []
    for item in items:
        wet = float(np.nanmean([wet_clim[month - 1] for month in item["sens"]]))
        mismatch = float(np.clip((0.45 - wet) / 0.45, 0, 1)) if not np.isnan(wet) else 0.5
        risks.append(mismatch * (0.5 + 0.5 * item["water"] / 3))
    water = 1 - float(np.mean(risks))
    income = float(np.mean([(item["market"] + item["forage"]) / 6 for item in items]))
    parts = {
        "soil": float(np.clip(soil, 0, 1)),
        "erosion": float(np.clip(erosion, 0, 1)),
        "water": float(np.clip(water, 0, 1)),
        "income": float(np.clip(income, 0, 1)),
    }
    total = sum(weights.get(key, 0) * value for key, value in parts.items()) / max(sum(weights.values()), 1e-9)
    return round(10 * total, 1), parts


def rotation_indicators(crops, parts, baseline_yield_t_ha: float = 3.0):
    items = [CROPS[crop] for crop in crops]
    average_yield = float(np.mean([item["base_yield_t_ha"] for item in items]))
    water_use = float(np.mean([item["water_use_mm"] for item in items]))
    nitrogen = float(np.mean([item["n_fix"] for item in items]) * 80)
    yield_gain = float(np.clip((average_yield / baseline_yield_t_ha - 1) * 100 + parts["soil"] * 8, -20, 40))
    som_gain = float(np.clip(parts["soil"] * 4.5, 0, 5))
    return {
        "avg_yield_t_ha": round(average_yield, 2),
        "water_use_mm": round(water_use, 1),
        "nitrogen_balance_kg_ha": round(nitrogen, 1),
        "expected_yield_gain_pct": round(yield_gain, 1),
        "som_gain_pct": round(som_gain, 2),
        "water_savings_pct": round((1 - water_use / 500) * 100, 1),
    }


def explain(parts) -> str:
    labels = {"soil": "soil health / nitrogen", "erosion": "erosion protection",
              "water": "water safety", "income": "income / forage"}
    return f"Strongest: {labels[max(parts, key=parts.get)]}. Weakest: {labels[min(parts, key=parts.get)]}."


def status(score: float) -> str:
    return "green" if score >= 6 else "yellow" if score >= 4 else "red"
