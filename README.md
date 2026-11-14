# Rotation Compass

The original Streamlit prototype is archived in [legacy_prototype/](./legacy_prototype/). The organized application is split into:

- `backend/data`: NASA POWER and optional Earth Engine clients.
- `backend/engine`: crop catalog, scoring, and scenarios.
- `backend/main.py`: FastAPI contract (`GET /api/health`, `GET /api/crops`, `POST /api/analyze`).
- `frontend`: Vite React dashboard.
- `shared/contract.json`: shared request/response contract.

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
