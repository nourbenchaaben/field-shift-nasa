from __future__ import annotations

import io
import os
from functools import lru_cache
from typing import Any

import pandas as pd
import requests

BASE_URL = "https://api.meteomatics.com"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _credentials() -> tuple[str | None, str | None]:
    return os.environ.get("METEOMATICS_USER"), os.environ.get("METEOMATICS_PWD")


@lru_cache(maxsize=32)
def fetch_series(
    parameters: tuple[str, ...],
    start: str,
    end: str,
    step: str,
    lat: float,
    lon: float,
) -> pd.DataFrame:
    user, password = _credentials()
    if not user or not password:
        raise RuntimeError(
            "Meteomatics credentials are missing. Set METEOMATICS_USER and METEOMATICS_PWD."
        )
    url = f"{BASE_URL}/{start}--{end}:{step}/{','.join(parameters)}/{lat:.4f},{lon:.4f}/csv"
    response = requests.get(url, auth=(user, password), timeout=90)
    response.raise_for_status()
    frame = pd.read_csv(io.StringIO(response.text), sep=";")
    frame["validdate"] = pd.to_datetime(frame["validdate"], utc=True).dt.tz_localize(None)
    return frame.set_index("validdate")


def _daily_series(
    parameter: str,
    year: int,
    lat: float,
    lon: float,
) -> pd.Series:
    frame = fetch_series(
        (parameter,),
        f"{year}-01-01T00:00:00Z",
        f"{year}-12-31T00:00:00Z",
        "P1D",
        round(lat, 4),
        round(lon, 4),
    )
    return frame.iloc[:, 0]


def build_profile(lat: float, lon: float, power_frame: pd.DataFrame) -> dict[str, Any]:
    years = sorted({int(year) for year in power_frame.index.year})
    if not years:
        raise ValueError("NASA POWER returned no dated observations.")
    comparison_year = years[-1]
    rain = power_frame.loc[power_frame.index.year == comparison_year, "PRECTOTCORR"]
    et = _daily_series("evapotranspiration_24h:mm", comparison_year, lat, lon)
    et_monthly = et.groupby(et.index.month).sum().reindex(range(1, 13))
    rain_monthly = rain.groupby(rain.index.month).sum().reindex(range(1, 13))
    balance = rain_monthly - et_monthly

    now = pd.Timestamp.now(tz="UTC")
    today = now.strftime("%Y-%m-%d")
    yesterday = (now - pd.Timedelta(days=1)).strftime("%Y-%m-%d")
    similar = fetch_series(
        ("most_similar_year:y",),
        f"{yesterday}T00:00:00Z",
        f"{today}T00:00:00Z",
        "P1D",
        round(lat, 4),
        round(lon, 4),
    )
    gdd = _daily_series("growing_degree_days_accumulated:gdd", now.year, lat, lon)

    def values(series: pd.Series) -> list[float | None]:
        return [round(float(value), 2) if pd.notna(value) else None for value in series.tolist()]

    return {
        "source": "Meteomatics",
        "rain_source": "NASA POWER",
        "comparison_year": comparison_year,
        "water_balance": {
            "months": MONTHS,
            "rain_mm": values(rain_monthly),
            "reference_et_mm": values(et_monthly),
            "balance_mm": values(balance),
            "drier_than_rain_months": [
                MONTHS[index - 1]
                for index, value in balance.items()
                if pd.notna(value) and value < 0
            ],
        },
        "most_similar_year": int(similar.iloc[-1, 0]) if not similar.empty else None,
        "growing_degree_days": {
            "year": now.year,
            "current": round(float(gdd.iloc[-1]), 2) if not gdd.empty else None,
            "daily": [
                {"date": timestamp.strftime("%Y-%m-%d"), "gdd": round(float(value), 2)}
                for timestamp, value in gdd.items()
                if pd.notna(value)
            ],
        },
    }


def empty_profile(error: str) -> dict[str, Any]:
    return {
        "source": "Meteomatics",
        "available": False,
        "error": error,
    }
