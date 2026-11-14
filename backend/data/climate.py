from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np

from .gee_client import load_gee
from .power_client import MONTHS, build_power_profile, load_power


def get_climate_profile(lat: float, lon: float, years: int, use_gee: bool = False) -> dict[str, Any]:
    latest = datetime.now().year - 1
    frame = load_power(round(lat, 4), round(lon, 4), latest - years + 1, latest)
    profile = build_power_profile(frame)
    gee: dict[str, Any] | None = None
    if use_gee:
        gee = load_gee(lat, lon, latest - years + 1, latest)
        profile["wet_clim"] = [
            gee.get("smap_clim", {}).get(str(month), gee.get("smap_clim", {}).get(month))
            for month in range(1, 13)
        ]
    profile["gee"] = gee
    profile["frame"] = frame
    profile["months"] = MONTHS
    return profile
