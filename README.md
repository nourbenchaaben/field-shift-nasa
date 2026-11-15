# Rotation Compass

The original Streamlit prototype is archived in [legacy_prototype/](./legacy_prototype/). The organized application is split into:

- `backend/data`: NASA POWER, optional Earth Engine clients, and the SQLite crop catalog.
- `backend/engine`: crop catalog defaults, scoring, agronomic indicators, and scenarios.
- `backend/main.py`: FastAPI contract (`GET /api/health`, `GET /api/crops`, `POST /api/analyze`).
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

Earth Engine is preferred automatically. Install the backend requirements, run
`earthengine authenticate`, and set `$env:GEE_PROJECT` to a Google Cloud project
with Earth Engine enabled. The frontend no longer asks the user to select a
source: the backend tries Earth Engine first and falls back to NASA POWER if
Earth Engine is unavailable. The response reports the actual source and
`confidence.fallback_reason` when fallback occurs. With `slope_deg: null`, SRTM
supplies the automatic slope; a numeric `slope_deg` remains a manual override.
SMAP supplies water wetness and MODIS supplies NDVI/bare-field risk.

The backend also exposes `POST /api/advisor/chat`. It first uses GitHub Models
when `GITHUB_TOKEN` is configured, then Azure OpenAI when
`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and
`AZURE_OPENAI_DEPLOYMENT` are configured, then OpenAI when `OPENAI_API_KEY` is
configured. If no provider is available, the endpoint returns a
deterministic NASA-aware fallback; the response identifies the provider and
fallback status. Secrets must remain in backend environment variables and must
never be placed in the React application.

```powershell
$env:GITHUB_TOKEN = "github_pat_your_token"
$env:GITHUB_MODELS_MODEL = "openai/gpt-4o-mini"



The advisor receives only a bounded farm context, the computed active rotation,
and selected NASA indicators. It explains backend results but does not replace
the transparent rotation scoring engine.

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```
