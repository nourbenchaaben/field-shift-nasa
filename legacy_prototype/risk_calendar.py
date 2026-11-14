"""
risk_calendar.py - a month-by-month field risk calendar built ONLY from NASA data.
No crop assumptions are used here, so nothing in it depends on a hand-filled table.

Used from app_v2.py:  render_risk_calendar(df, n_years, heavy_clim, wet_clim, feats)
"""
import pandas as pd
import streamlit as st

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Adjustable starting thresholds (our choices, shown to the user below the table)
FROST_YELLOW, FROST_RED = 0.2, 1.0     # frost days per year in that month
HEAVY_YELLOW, HEAVY_RED = 0.3, 1.0     # heavy-rain days (>= 20 mm) per year in that month
WET_YELLOW, WET_RED = 0.45, 0.30       # soil wetness (0-1): LOWER is worse
NDVI_YELLOW, NDVI_RED = 0.35, 0.25     # NDVI: LOWER = more bare soil


def _level(value, yellow, red, lower_is_worse=False):
    if value is None or pd.isna(value):
        return "⚪"
    if lower_is_worse:
        return "🔴" if value <= red else "🟡" if value <= yellow else "🟢"
    return "🔴" if value >= red else "🟡" if value >= yellow else "🟢"


def render_risk_calendar(df, n_years, heavy_clim, wet_clim, feats=None):
    st.subheader("📅 Field risk calendar")
    st.caption("Built only from NASA data (POWER, plus SMAP and MODIS when Earth Engine is on). "
               "No crop assumptions are used on this page.")

    months = range(1, 13)
    frost = ((df["T2M_MIN"] < 0).groupby(df.index.month).sum() / n_years).reindex(months).fillna(0)
    heavy = heavy_clim.reindex(months).fillna(0)
    wet = wet_clim.reindex(months)
    ndvi = {int(k): v for k, v in feats["ndvi_clim"].items()} if feats else {}

    rows = {
        "❄️ Frost": [_level(frost[m], FROST_YELLOW, FROST_RED) for m in months],
        "⛈️ Heavy rain": [_level(heavy[m], HEAVY_YELLOW, HEAVY_RED) for m in months],
        "🏜️ Dry soil": [_level(wet[m], WET_YELLOW, WET_RED, lower_is_worse=True) for m in months],
    }
    if ndvi:
        rows["🟫 Bare field"] = [_level(ndvi.get(m), NDVI_YELLOW, NDVI_RED, lower_is_worse=True)
                                 for m in months]
    risk = pd.DataFrame(rows, index=MONTHS).T
    st.table(risk)

    reds = (risk == "🔴").sum()
    worst = [m for m, c in reds.items() if c >= 2]
    if worst:
        st.warning("Months where two or more risks overlap: " + ", ".join(worst)
                   + ". These are the months to plan around first.")
    else:
        st.success("No month has two red risks at the same time.")

    if not ndvi:
        st.info("Turn on Earth Engine in the sidebar to add the 'Bare field' row (MODIS NDVI).")

    with st.expander("How to read this / thresholds"):
        st.markdown(
            f"- 🟢 low, 🟡 medium, 🔴 high, ⚪ no data\n"
            f"- Frost: days with minimum temperature below 0 C per year (🟡 >= {FROST_YELLOW}, 🔴 >= {FROST_RED})\n"
            f"- Heavy rain: days with >= 20 mm per year (🟡 >= {HEAVY_YELLOW}, 🔴 >= {HEAVY_RED})\n"
            f"- Dry soil: root-zone wetness 0-1 (🟡 <= {WET_YELLOW}, 🔴 <= {WET_RED})\n"
            f"- Bare field: MODIS NDVI (🟡 <= {NDVI_YELLOW}, 🔴 <= {NDVI_RED})\n\n"
            "Thresholds are our adjustable starting choices, not official limits. "
            "A local agronomist should confirm what matters for each crop."
        )