from __future__ import annotations

import numpy as np


def select_wet_climate(profile, scenario: str, replay_year: int | None, rain_change_pct: float):
    if scenario == "bad_year" and replay_year is not None:
        values = profile["wet_by_year"].get(str(replay_year))
        if values:
            wet = np.array([value if value is not None else 0.0 for value in values])
            return wet * (1 + rain_change_pct / 100)
    values = profile["wet_clim"]
    return np.array([value if value is not None else 0.0 for value in values]) * (1 + rain_change_pct / 100)
