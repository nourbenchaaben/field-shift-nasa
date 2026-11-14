# Rotation Compass

The original Streamlit prototype is archived in [legacy_prototype/](./legacy_prototype/). The organized application is split into:

- `backend/data`: NASA POWER and optional Earth Engine clients.
- `backend/engine`: crop catalog, scoring, and scenarios.
- `backend/main.py`: FastAPI contract (`GET /api/health`, `GET /api/crops`, `POST /api/analyze`).
- `frontend`: Vite React dashboard.
- `shared/contract.json`: shared request/response contract.

The data developer's Streamlit `app_final.py` remains a reference implementation.
Its farmer-entered crop metadata and extra criteria are not imported directly because
the production interface is the FastAPI contract above. Compatible climate behavior
is implemented in the API, including bad-year rainfall sensitivity and exposed
bare-field storm months.

Run the API from the project root:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

Meteomatics is an optional enrichment layer; NASA POWER remains the
authoritative source for rainfall and rotation scoring. Configure credentials
outside the repository and send `"use_meteomatics": true` to `/api/analyze`:

```powershell
$env:METEOMATICS_USER = "your_username"
$env:METEOMATICS_PWD = "your_password"
```

The response includes `meteomatics.water_balance`. Its `rain_mm` values come
from NASA POWER and its `reference_et_mm` values come from Meteomatics.
Missing credentials or unavailable Meteomatics parameters are reported in
`meteomatics.error`; the NASA response still succeeds.

Earth Engine is optional. Install the backend requirements, run
`earthengine authenticate`, set `$env:GEE_PROJECT` to a Google Cloud project
with Earth Engine enabled, and send `"use_gee": true`. With `slope_deg: null`,
SRTM supplies the automatic slope; a numeric `slope_deg` remains a manual
override. SMAP supplies water wetness and MODIS supplies NDVI/bare-field risk.

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```
