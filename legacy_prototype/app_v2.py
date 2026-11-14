"""
Rotation Compass v2 - NASA POWER + (optional) Earth Engine features
Run with:  streamlit run app_v2.py
Works WITHOUT Earth Engine (falls back to POWER + manual slope), so your demo never dies.
"""
import numpy as np
import pandas as pd
import requests
import streamlit as st
from risk_calendar import render_risk_calendar
from geopy.geocoders import Nominatim
import folium
from streamlit_folium import st_folium



st.set_page_config(page_title="Rotation Compass", page_icon="🧭", layout="wide")
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# ----------------------------------------------------------------------
# DATA
# ----------------------------------------------------------------------
@st.cache_data(show_spinner="Downloading NASA POWER data...")
def load_power(lat, lon, y0, y1):
    r = requests.get(
        "https://power.larc.nasa.gov/api/temporal/daily/point",
        params={"parameters": "T2M,T2M_MIN,PRECTOTCORR,GWETROOT", "community": "AG",
                "latitude": lat, "longitude": lon, "start": f"{y0}0101", "end": f"{y1}1231",
                "format": "JSON"},
        timeout=120,
    )
    r.raise_for_status()
    df = pd.DataFrame(r.json()["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    return df.replace(-999, np.nan)


@st.cache_data(show_spinner="Reading NASA satellites via Earth Engine (first time is slow)...")
def load_gee(lat, lon):
    from nasa_features import get_features
    return get_features(lat, lon)


def autumn_onset(df):
    """First day after 1 Sep when 3-day rain >= 20 mm = 'real autumn rains' (day of year)."""
    out = {}
    for y in sorted(set(df.index.year)):
        d = df.loc[f"{y}-09-01":f"{y}-12-31", "PRECTOTCORR"].rolling(3).sum()
        hit = d[d >= 20]
        if len(hit):
            out[y] = hit.index[0].day_of_year
    return pd.Series(out, dtype=float)


def doy_to_text(doy):
    return (pd.Timestamp("2023-01-01") + pd.Timedelta(days=int(doy) - 1)).strftime("%d %b")

@st.cache_data(show_spinner=False)
def geocode(place):
    """Place name -> (lat, lon, address). Returns None if not found."""
    try:
        geo = Nominatim(user_agent="rotation-compass-hackathon")
        loc = geo.geocode(place)
        return (loc.latitude, loc.longitude, loc.address) if loc else None
    except Exception:
        return None
    

# ----------------------------------------------------------------------
# CROP TABLE (generic - validate with local experts!)
# cover = months when the crop actually covers the soil
# ----------------------------------------------------------------------
CROPS = {
    "Durum wheat":    dict(water=2, n_fix=0.0, market=3, forage=0, sens=[3, 4], cover=[12, 1, 2, 3, 4, 5]),
    "Fava bean":      dict(water=2, n_fix=1.0, market=2, forage=1, sens=[2, 3], cover=[12, 1, 2, 3, 4]),
    "Barley + vetch": dict(water=1, n_fix=0.6, market=2, forage=3, sens=[3],    cover=[11, 12, 1, 2, 3, 4, 5]),
    "Chickpea":       dict(water=1, n_fix=1.0, market=2, forage=0, sens=[4, 5], cover=[3, 4, 5, 6]),
}
ROTATIONS = {
    "A - Existing: Wheat > Wheat > Wheat":   ["Durum wheat"] * 3,
    "B - Wheat > Fava bean > Wheat":         ["Durum wheat", "Fava bean", "Durum wheat"],
    "C - Wheat > Barley+Vetch > Wheat":      ["Durum wheat", "Barley + vetch", "Durum wheat"],
    "D - Wheat > Chickpea > Barley+Vetch":   ["Durum wheat", "Chickpea", "Barley + vetch"],
}


# ----------------------------------------------------------------------
# SCORING
# ----------------------------------------------------------------------
def erosion_component(crops, heavy_clim, slope_deg):
    """Bare-Field Clock: heavy-rain days that fall in months the crop does NOT cover the soil."""
    total = max(heavy_clim.sum(), 1e-9)
    exposed = []
    for c in crops:
        cov = CROPS[c]["cover"]
        exposed.append(sum(heavy_clim.get(m, 0) for m in range(1, 13) if m not in cov) / total)
    slope_mult = 1 + min(slope_deg, 20) / 20          # flat = 1, steep = 2
    return float(np.clip(1 - np.mean(exposed) * slope_mult / 2, 0, 1))


def score_rotation(crops, wet, heavy_clim, slope_deg, weights):
    items = [CROPS[c] for c in crops]
    diversity = (len(set(crops)) - 1) / 2
    soil = 0.6 * np.mean([i["n_fix"] for i in items]) + 0.4 * diversity
    erosion = erosion_component(crops, heavy_clim, slope_deg)

    risks = []                                         # water-stage mismatch
    for i in items:
        w = wet.reindex(i["sens"]).mean()
        mismatch = float(np.clip((0.45 - w) / 0.45, 0, 1)) if pd.notna(w) else 0.5
        risks.append(mismatch * (0.5 + 0.5 * i["water"] / 3))
    water = 1 - np.mean(risks)

    income = np.mean([(i["market"] + i["forage"]) / 6 for i in items])
    parts = dict(soil=soil, erosion=erosion, water=water, income=income)
    total = sum(weights[k] * parts[k] for k in parts) / max(sum(weights.values()), 1e-9)
    return round(10 * total, 1), parts


def light(s):
    return "🟢" if s >= 6 else "🟡" if s >= 4 else "🔴"


def explain(parts):
    n = {"soil": "soil health / nitrogen", "erosion": "erosion protection",
         "water": "water safety", "income": "income / forage"}
    return f"Strongest: {n[max(parts, key=parts.get)]}. Weakest: {n[min(parts, key=parts.get)]}."


# ----------------------------------------------------------------------
# UI
# ----------------------------------------------------------------------
st.title("🧭 Rotation Compass")
st.caption("Supports farmer judgment. It does not replace local agricultural expertise.")

with st.sidebar:
    st.header("📍 Your field")
    place = st.text_input("🔎 Search your farm location", "Béja, Tunisia")
    found = geocode(place)
    if found:
        lat0, lon0, address = found
        st.success(address)
    else:
        lat0, lon0 = 36.73, 9.18
        st.error("Place not found, using Béja")

    # a new search resets the pin; a map click (below) overrides it
    if st.session_state.get("last_search") != place:
        st.session_state["last_search"] = place
        st.session_state["pin"] = (lat0, lon0)
    lat, lon = st.session_state.get("pin", (lat0, lon0))
    st.caption(f"Using: {lat:.4f}, {lon:.4f}")
    years = st.slider("Years of history (POWER)", 5, 20, 10)
    use_gee = st.checkbox("Use NASA satellites via Earth Engine", value=False,
                          help="Needs a Google Earth Engine project. Off = POWER only.")

    st.header("🎯 Priorities")
    weights = dict(
        soil=st.slider("Improve soil", 0, 10, 7),
        water=st.slider("Save water / avoid drought", 0, 10, 8),
        erosion=st.slider("Reduce erosion", 0, 10, 5),
        income=st.slider("Income / forage (your own judgment)", 0, 10, 0),
    )

    st.header("🔮 What-if")
    rain_change = st.slider("Rainfall change (%)", -40, 20, 0,
                            help="Sensitivity test, NOT a climate forecast.")

# Render location-dependent UI only after the sidebar resolves the selected location.
with st.expander("🗺️ Click the map to pick your exact field"):
    m = folium.Map(location=[lat, lon], zoom_start=10)
    folium.Marker([lat, lon]).add_to(m)
    out = st_folium(m, height=350, width=700, key="map")
    if out and out.get("last_clicked"):
        new = (round(out["last_clicked"]["lat"], 4), round(out["last_clicked"]["lng"], 4))
        if new != st.session_state.get("pin"):
            st.session_state["pin"] = new
            st.rerun()

# rough box around Tunisia: warn outside the region the crop table was built for
if not (30 <= lat <= 38 and 7 <= lon <= 12):
    st.warning("Climate data is global, but the crop recommendations are only "
               "validated for Tunisia. Treat results for this location with extra care.")
    


# Use the most recent complete calendar year; NASA POWER may not have the
# current year's daily data finalized yet.
latest_complete_year = pd.Timestamp.now().year - 1
df = load_power(lat, lon, latest_complete_year - years + 1, latest_complete_year)
rain_year = df["PRECTOTCORR"].groupby(df.index.year).sum()
n_years = len(rain_year)
heavy_clim = (df["PRECTOTCORR"] >= 20).groupby(df.index.month).sum() / n_years   # heavy days/yr
power_wet_clim = df["GWETROOT"].groupby(df.index.month).mean()

feats, gee_ok = None, False
if use_gee:
    try:
        feats = load_gee(lat, lon)
        gee_ok = True
    except Exception as e:
        st.warning(f"Earth Engine not available ({e}). Using NASA POWER only.")

slope = feats["slope_deg"] if gee_ok else st.sidebar.slider("Field slope (degrees)", 0, 25, 5)

# soil wetness source: SMAP if available, else POWER
if gee_ok:
    sm = pd.Series({pd.Timestamp(k): v for k, v in feats["smap_monthly"].items()})
    sm_norm = (sm / sm.quantile(0.95)).clip(0, 1)
    wet_clim = sm_norm.groupby(sm_norm.index.month).mean()
    wet_source = "SMAP (satellite)"
    wet_by_year = lambda y: sm_norm[sm_norm.index.year == y].groupby(sm_norm[sm_norm.index.year == y].index.month).mean()
    available_years = sorted(set(sm_norm.index.year))
else:
    wet_clim = power_wet_clim
    wet_source = "NASA POWER (model)"
    wet_by_year = lambda y: df[df.index.year == y]["GWETROOT"].groupby(df[df.index.year == y].index.month).mean()
    available_years = sorted(rain_year.index)

adj = 1 + rain_change / 100

c1, c2, c3, c4 = st.columns(4)
c1.metric("Avg rain / year", f"{rain_year.mean():.0f} mm")
c2.metric("Driest year", f"{rain_year.idxmin()}", f"{rain_year.min():.0f} mm")
c3.metric("Heavy-rain days / yr", f"{heavy_clim.sum():.1f}")
c4.metric("Slope", f"{slope:.1f}°")

tab1, tab2, tab3, tab4, tab_risk = st.tabs(["🏆 Compare rotations", "⏰ Bare-Field Clock",
                                            "🌧️ Sowing window", "🔬 Data & method", "📅 Risk calendar"])

# ---------------- TAB 1
with tab1:
    scenario = st.radio("Scenario", ["Normal year", "Bad-year replay"], horizontal=True)
    if scenario == "Bad-year replay":
        pool = {y: rain_year[y] for y in available_years if y in rain_year.index}
        worst = min(pool, key=pool.get)
        year = st.selectbox("Replay year", available_years, index=available_years.index(worst))
        st.info(f"{year}: {rain_year.get(year, float('nan')):.0f} mm of rain "
                f"(average {rain_year.mean():.0f} mm).")
        wet_used = wet_by_year(year)
    else:
        wet_used = wet_clim
    wet_used = (wet_used * adj).clip(0, 1)

    results = []
    for name, crops in ROTATIONS.items():
        s, parts = score_rotation(crops, wet_used, heavy_clim, slope, weights)
        results.append((name, s, parts))
    results.sort(key=lambda x: x[1], reverse=True)

    cv = rain_year.std() / rain_year.mean()
    conf = ("🔴 Low (short record)" if n_years < 5 else
            "🟡 Medium (rainfall very variable)" if cv > 0.3 else
            "🟡 Medium (satellite data good, crop table generic)")
    if gee_ok:
        conf += " | SMAP + MODIS + SRTM used"

    for name, s, parts in results:
        with st.container(border=True):
            a, b = st.columns([1, 3])
            a.metric(f"{light(s)} Score", f"{s} / 10")
            b.markdown(f"**{name}**")
            b.write(explain(parts))
            b.progress(min(max(s / 10, 0), 1))
            b.caption(f"Soil {parts['soil']:.2f} | Erosion {parts['erosion']:.2f} | "
                      f"Water {parts['water']:.2f} | Income {parts['income']:.2f} - Confidence: {conf}")

        st.caption("Field conditions (rain, soil moisture, frost, slope) come from NASA data. "
               "How each crop responds to them uses general crop assumptions (crop_table.csv) "
               "that a local expert should confirm. These are starting points, not measurements.")
        
    sheet = ("ASK YOUR LOCAL AGRONOMIST\n"
             "[ ] Soil salinity and pH of this field\n"
             "[ ] Local seed availability and prices\n"
             "[ ] Local buyers / market price for the new crop\n"
             "[ ] Disease history (chickpea blight, fava chocolate spot)\n"
             "[ ] Sowing dates recommended by the local extension office")
    st.code(sheet)
    st.download_button("Download checklist", sheet, file_name="expert_checklist.txt")

# ---------------- TAB 2
with tab2:
    st.subheader("When is the soil unprotected AND storms arrive?")
    clock = pd.DataFrame({"Heavy-rain days per year (>=20 mm)": heavy_clim.reindex(range(1, 13)).values},
                         index=MONTHS)
    if gee_ok:
        # keys are ints on a fresh run and strings when read back from the JSON cache
        clock["NDVI (greenness)"] = [feats["ndvi_clim"].get(str(m), feats["ndvi_clim"].get(m)) for m in range(1, 13)]
    st.bar_chart(clock[["Heavy-rain days per year (>=20 mm)"]])
    if gee_ok:
        st.line_chart(clock[["NDVI (greenness)"]])
        bare = [m for m in range(1, 13)
                if (clock["NDVI (greenness)"].iloc[m - 1] or 1) < 0.25 and heavy_clim.get(m, 0) > 0.2]
        if bare:
            st.warning("Satellite says the field is bare in heavy-rain months: "
                       + ", ".join(MONTHS[m - 1] for m in bare)
                       + ". A cover crop or short-cycle crop could fill this window.")
        else:
            st.success("No overlap between bare months and heavy-rain months found.")
    else:
        st.info("Turn on Earth Engine in the sidebar to see MODIS NDVI and find real bare-field months.")

# ---------------- TAB 3
with tab3:
    st.subheader("When do the autumn rains really start?")
    onset = autumn_onset(df)
    if len(onset):
        st.write(f"Typical start (median): **{doy_to_text(onset.median())}**. "
                 f"Earliest: **{doy_to_text(onset.min())}**, latest: **{doy_to_text(onset.max())}**.")
        st.bar_chart(onset.rename("Day of year"))
        spread = onset.max() - onset.min()
        st.caption(f"Spread: {spread:.0f} days. A wide spread means sowing early is a gamble; "
                   "ask local experts how this fits each crop's recommended sowing date.")
    else:
        st.info("No clear autumn onset found in this period.")

# ---------------- TAB 4
with tab4:
    st.markdown(f"""
| Layer | Source | Used for |
|---|---|---|
| Temperature, rain, soil wetness | NASA POWER (daily) | Heavy-rain days, dry months, autumn onset, frost |
| Soil moisture | {wet_source} | Water-stage mismatch score |
| Vegetation / bare periods | MODIS NDVI {'(active)' if gee_ok else '(off)'} | Bare-Field Clock |
| Terrain | SRTM {'(active)' if gee_ok else '(manual slope)'} | Erosion risk multiplier |
| Crop table | Hand-built, generic | Water need, nitrogen, cover months, market |

**Limits:** coarse satellite pixels (SMAP ~9 km, POWER ~50 km) may not match one field; the crop table is generic;
scores are transparent rules, not trained AI; local validation (soil tests, extension office) is required.
""")

# ---------------- RISK CALENDAR
with tab_risk:
    render_risk_calendar(df, n_years, heavy_clim, wet_clim, feats if gee_ok else None)