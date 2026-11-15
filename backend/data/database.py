from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

from ..engine.crops import CROPS

DEFAULT_DB_PATH = Path(
    os.getenv("TADAWOL_DB_PATH", str(Path(__file__).resolve().parents[2] / "data" / "tadawol.sqlite3"))
)


def _connection() -> sqlite3.Connection:
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DEFAULT_DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with _connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS crops (
                name TEXT PRIMARY KEY,
                water_need INTEGER NOT NULL,
                nitrogen_fix REAL NOT NULL,
                market_score INTEGER NOT NULL,
                forage_score INTEGER NOT NULL,
                base_yield_t_ha REAL NOT NULL,
                water_use_mm REAL NOT NULL,
                price_eur_t REAL NOT NULL,
                cover_months TEXT NOT NULL,
                sensitive_months TEXT NOT NULL
            )
            """
        )
        for name, crop in CROPS.items():
            connection.execute(
                """
                INSERT INTO crops (
                    name, water_need, nitrogen_fix, market_score, forage_score,
                    base_yield_t_ha, water_use_mm, price_eur_t, cover_months, sensitive_months
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    water_need=excluded.water_need,
                    nitrogen_fix=excluded.nitrogen_fix,
                    market_score=excluded.market_score,
                    forage_score=excluded.forage_score,
                    base_yield_t_ha=excluded.base_yield_t_ha,
                    water_use_mm=excluded.water_use_mm,
                    price_eur_t=excluded.price_eur_t,
                    cover_months=excluded.cover_months,
                    sensitive_months=excluded.sensitive_months
                """,
                (
                    name,
                    crop["water"],
                    crop["n_fix"],
                    crop["market"],
                    crop["forage"],
                    crop["base_yield_t_ha"],
                    crop["water_use_mm"],
                    crop["price_eur_t"],
                    json.dumps(crop["cover"]),
                    json.dumps(crop["sens"]),
                ),
            )


def list_crops() -> list[dict[str, Any]]:
    initialize_database()
    with _connection() as connection:
        rows = connection.execute("SELECT * FROM crops ORDER BY name").fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["cover_months"] = json.loads(item["cover_months"])
        item["sensitive_months"] = json.loads(item["sensitive_months"])
        result.append(item)
    return result
