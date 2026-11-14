"""
nasa_features.py - pulls NASA Earth observations for ONE field through Google Earth Engine
and caches the result in ./cache so the app (and your live demo) never waits twice.

Datasets used:
  MODIS MOD13Q1  -> NDVI (vegetation / bare periods)
  SMAP L4        -> root-zone soil moisture
  GPM IMERG      -> monthly rainfall (satellite)
  SRTM           -> elevation + slope (erosion risk)

!! Catalog IDs / band names / versions change. Before running, search each dataset name in
   https://developers.google.com/earth-engine/datasets and fix the constants below if needed.
"""
import json
import os

import ee
import pandas as pd

PROJECT = os.environ.get("GEE_PROJECT", "your-gee-project-id")
CACHE_DIR = "cache"

NDVI_ID, NDVI_BAND = "MODIS/061/MOD13Q1", "NDVI"
SMAP_ID, SMAP_BAND = "NASA/SMAP/SPL4SMGP/007", "sm_rootzone"
IMERG_ID, IMERG_BAND = "NASA/GPM_L3/IMERG_V07", "precipitation"   # mm/hr, 30-min steps
SRTM_ID = "USGS/SRTMGL1_003"


def init():
    try:
        ee.Initialize(project=PROJECT)
    except Exception:
        ee.Authenticate()
        ee.Initialize(project=PROJECT)


def _monthly(col_id, band, area, scale, y0, y1, how="mean", factor=1.0):
    """One value per month (server-side loop = fast). Returns a pandas Series."""
    n_months = (y1 - y0 + 1) * 12
    start = ee.Date.fromYMD(y0, 1, 1)

    def per_month(i):
        d0 = start.advance(i, "month")
        col = ee.ImageCollection(col_id).filterDate(d0, d0.advance(1, "month")).select(band)
        img = col.sum() if how == "sum" else col.mean()
        v = img.reduceRegion(ee.Reducer.mean(), area, scale).get(band)
        return ee.Feature(None, {"date": d0.format("YYYY-MM-dd"), "v": v})

    fc = ee.FeatureCollection(ee.List.sequence(0, n_months - 1).map(per_month))
    fc = fc.filter(ee.Filter.notNull(["v"]))
    rows = [f["properties"] for f in fc.getInfo()["features"]]
    s = pd.DataFrame(rows)
    s["date"] = pd.to_datetime(s["date"])
    return (s.set_index("date")["v"] * factor).sort_index()


def get_features(lat, lon, y0=2018, y1=2024, buffer_m=1000):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, f"{lat:.3f}_{lon:.3f}_{y0}_{y1}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)

    init()
    area = ee.Geometry.Point([lon, lat]).buffer(buffer_m)

    ndvi = _monthly(NDVI_ID, NDVI_BAND, area, 250, y0, y1, "mean", 0.0001)
    smap = _monthly(SMAP_ID, SMAP_BAND, area, 11000, y0, y1, "mean")
    imerg = _monthly(IMERG_ID, IMERG_BAND, area, 10000, y0, y1, "sum", 0.5)  # mm/hr * 0.5 h

    srtm = ee.Image(SRTM_ID)
    slope = ee.Terrain.slope(srtm).reduceRegion(ee.Reducer.mean(), area, 30).get("slope").getInfo()
    elev = srtm.reduceRegion(ee.Reducer.mean(), area, 30).get("elevation").getInfo()

    def clim(s):
        return {int(m): round(float(v), 4) for m, v in s.groupby(s.index.month).mean().items()}

    def monthly_dict(s):
        return {str(d.date()): round(float(v), 4) for d, v in s.items()}

    out = {
        "ndvi_clim": clim(ndvi),
        "smap_clim": clim(smap),
        "smap_monthly": monthly_dict(smap),
        "imerg_clim": clim(imerg),
        "slope_deg": round(float(slope or 0), 2),
        "elevation_m": round(float(elev or 0), 1),
    }
    with open(path, "w") as f:
        json.dump(out, f)
    return out


if __name__ == "__main__":
    feats = get_features(36.73, 9.18)
    print(json.dumps(feats, indent=2)[:1500])
