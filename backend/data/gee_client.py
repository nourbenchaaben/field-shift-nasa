from __future__ import annotations

from typing import Any


def load_gee(lat: float, lon: float, y0: int, y1: int) -> dict[str, Any]:
    """Load optional Earth Engine data without importing ee for POWER-only runs."""
    from legacy_prototype.nasa_features import get_features
    return get_features(lat, lon, y0, y1)
