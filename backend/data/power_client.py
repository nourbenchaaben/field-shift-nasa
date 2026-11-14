from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
import requests

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


@lru_cache(maxsize=32)
def load_power(lat: float, lon: float, y0: int, y1: int) -> pd.DataFrame:
    response = requests.get(
        "https://power.larc.nasa.gov/api/temporal/daily/point",
        params={
            "parameters": "T2M,T2M_MIN,PRECTOTCORR,GWETROOT",
            "community": "AG", "latitude": lat, "longitude": lon,
            "start": f"{y0}0101", "end": f"{y1}1231", "format": "JSON",
        },
        timeout=120,
    )
    response.raise_for_status()
    frame = pd.DataFrame(response.json()["properties"]["parameter"])
    frame.index = pd.to_datetime(frame.index, format="%Y%m%d")
    return frame.replace(-999, np.nan)


def autumn_onset(frame: pd.DataFrame) -> pd.Series:
    result: dict[int, int] = {}
    for year in sorted(set(frame.index.year)):
        rain = frame.loc[f"{year}-09-01":f"{year}-12-31", "PRECTOTCORR"]
        hits = rain.rolling(3).sum()
        hits = hits[hits >= 20]
        if not hits.empty:
            result[year] = int(hits.index[0].day_of_year)
    return pd.Series(result, dtype=float)


def doy_to_text(day_of_year: float | int) -> str:
    return (pd.Timestamp("2023-01-01") + pd.Timedelta(days=int(day_of_year) - 1)).strftime("%d %b")


def series_values(series: pd.Series) -> list[float]:
    return [round(float(value), 4) if pd.notna(value) else None for value in series.tolist()]


def build_power_profile(frame: pd.DataFrame) -> dict[str, Any]:
    years = sorted(set(frame.index.year))
    count = max(len(years), 1)
    rain_by_year = frame["PRECTOTCORR"].groupby(frame.index.year).sum()
    heavy = (frame["PRECTOTCORR"] >= 20).groupby(frame.index.month).sum() / count
    wet = frame["GWETROOT"].groupby(frame.index.month).mean()
    monthly_rain = frame["PRECTOTCORR"].groupby(frame.index.month).sum() / count
    monthly_temp = frame["T2M"].groupby(frame.index.month).mean()
    monthly_temp_min = frame["T2M_MIN"].groupby(frame.index.month).mean()
    onset = autumn_onset(frame)
    frost = ((frame["T2M_MIN"] < 0).groupby(frame.index.month).sum() / count)
    return {
        "years": years,
        "rain_by_year": {str(int(k)): round(float(v), 2) for k, v in rain_by_year.items()},
        "wet_by_year": {
            str(year): series_values(frame.loc[frame.index.year == year, "GWETROOT"]
                                     .groupby(frame.loc[frame.index.year == year].index.month).mean().reindex(range(1, 13)))
            for year in years
        },
        "heavy_clim": series_values(heavy.reindex(range(1, 13)).fillna(0)),
        "monthly_rain_mm": series_values(monthly_rain.reindex(range(1, 13)).fillna(0)),
        "wet_clim": series_values(wet.reindex(range(1, 13))),
        "monthly_temp_c": series_values(monthly_temp.reindex(range(1, 13))),
        "monthly_temp_min_c": series_values(monthly_temp_min.reindex(range(1, 13))),
        "frost_clim": series_values(frost.reindex(range(1, 13)).fillna(0)),
        "autumn_onset": {str(int(k)): int(v) for k, v in onset.items()},
    }
