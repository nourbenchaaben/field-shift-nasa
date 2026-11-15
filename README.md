# Rotation Compass

The original Streamlit prototype is archived in [legacy_prototype/](./legacy_prototype/). The organized application is split into:

- `backend/data`: NASA POWER, optional Earth Engine clients, and the SQLite crop catalog.
- `backend/engine`: crop catalog defaults, scoring, agronomic indicators, and scenarios.
- `backend/main.py`: FastAPI endpoints (`GET /api/health`, `GET /api/crops`, `GET /api/nasa/power`, `POST /api/analyze`).
- `frontend`: Vite React dashboard.
- `shared/contract.json`: shared request/response contract.

The data developer's Streamlit `app_final.py` remains a reference implementation.
Its farmer-entered crop metadata and extra criteria are not imported directly because
the production interface is the FastAPI contract above. Compatible climate behavior
is implemented in the API, including bad-year rainfall sensitivity and exposed
bare-field storm months.

The backend initializes `data/tadawol.sqlite3` on startup and seeds the crop
catalog from `backend/engine/crops.py`. The database stores water use, baseline
yield, market value, nitrogen fixation, forage value, and seasonal cover
metadata. `GET /api/crops` reads from this catalog.

The dashboard loads NASA POWER climatology and rolling daily observations through
the backend `GET /api/nasa/power` proxy. This keeps browser requests on one backend
data path and lets the dashboard display the observation date and unavailable data
explicitly. Optional SMAP, MODIS NDVI, and SRTM layers require authenticated Earth
Engine access and are labeled unavailable until that integration returns real data.

`POST /api/analyze` validates farmer priority weights and crop names, applies
the selected climate scenario and NASA/Earth Engine indicators, scores the
candidate rotations, and returns exactly three ranked strategies. Each
strategy includes transparent soil, water, erosion, and income components plus
average yield, water use, nitrogen balance, soil-organic-matter gain, and
expected-yield indicators.

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

Earth Engine is preferred automatically for satellite layers. Install the backend
requirements, run `earthengine authenticate`, and set `GEE_PROJECT` in the
project-root `.env` file to a Google Cloud project with Earth Engine enabled
(or set `$env:GEE_PROJECT` in the same PowerShell session before starting the
backend). A Groq/LLM API key is not an Earth Engine credential. The frontend no longer asks the user to select a
source: the backend tries Earth Engine first and falls back to NASA POWER if
Earth Engine is unavailable. The response reports the actual source and
`confidence.fallback_reason` when fallback occurs. With `slope_deg: null`, SRTM
supplies the automatic slope; a numeric `slope_deg` remains a manual override.
SMAP supplies water wetness and MODIS supplies NDVI/bare-field risk. The
dashboard loads these through `GET /api/nasa/satellites`; its cache is stored
inside the repository so launching Uvicorn from a different working directory
does not disable cached observations. After changing `.env`, restart Uvicorn.

The backend also exposes `POST /api/advisor/chat` through Groq's OpenAI-compatible
chat completions API. For local development, configure the key in the project-root
`.env` file. The endpoint returns HTTP 503 if the key is missing or the provider
cannot answer. Keep secrets out of source control and the React application.

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Set `LLM_API_KEY`, `LLM_BASE_URL`, and `ADVISOR_MODEL` in `.env`. The `.env`
file is ignored by Git. Use a Groq API key and never commit or share it.

The advisor receives only a bounded farm context, the computed active rotation,
and selected NASA indicators. It explains backend results but does not replace
the transparent rotation scoring engine.

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```
