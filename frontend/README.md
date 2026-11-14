# Tadawol — AI & Satellite Smart Crop Rotation Platform

Modern React + TypeScript + Vite web application for **Tadawol**, combining NASA satellite telemetry (SMAP, MODIS, NDVI), local farm metrics, interactive Leaflet field mapping, AI-assisted 4-zone (`S1–S4`) crop rotation planning with farmer-in-the-loop approval, and multi-year regenerative forecasting.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

To build for production:

```bash
npm run build
npm run preview
```

## Connecting Your Backend API (`contract.json`)

The frontend shares the exact `contract.json` request/response schema:

- Reference contract: `src/contracts/contract.json`
- TypeScript contract types: `src/api/tadawolContract.ts`
- API client & fallback simulator: `src/api/tadawolClient.ts`

### Option A — Environment Variable
Create a `.env` file in the project root:

```env
VITE_TADAWOL_API_URL=http://localhost:8000/api/analyze
```

This is also the default when `VITE_TADAWOL_API_URL` is not set.

### Option B — Live In-App Connector
Once signed in, click **API Contract** in the top navigation bar to inspect/copy the live `request` & `response` JSON payloads or paste any backend `POST` endpoint URL to test live integration immediately.
