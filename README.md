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

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```
