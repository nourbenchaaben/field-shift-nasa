# Free demo deployment

Use Cloudflare Pages for the Vite frontend and Render for the FastAPI backend.
The Render blueprint is in `render.yaml`.

## 1. Push the project to GitHub

Commit and push the project, including `render.yaml`. Do not commit `.env` or API
keys. The root `.gitignore` already excludes `.env`.

## 2. Deploy the API on Render

In Render, choose **New → Blueprint**, connect this repository, and deploy the
`tadawol-api` service from `render.yaml`. Set the requested `LLM_API_KEY` value
in Render's secret environment settings. After deployment, verify:

```text
https://YOUR-API.onrender.com/api/health
```

It should return `{"status":"ok"}`.

## 3. Deploy the frontend on Cloudflare Pages

Create a Pages project from the same repository and set:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Build environment variable: `VITE_TADAWOL_API_URL=https://YOUR-API.onrender.com/api/analyze`

Replace `YOUR-API` with the Render service hostname. Trigger a new deployment
after saving the build variable.

## 4. Allow the Pages domain in the API

Copy the deployed Pages origin (for example,
`https://tadawol.pages.dev`). Add it to the Render service's `CORS_ORIGINS`
environment variable, then redeploy the API. The backend reads this variable
along with the localhost development origins.

## 5. Check the deployment

Open the Pages website, sign into the demo account from the login page, then
use **NASA Sync**. Check the browser Network panel for requests to the Render
API. The backend also exposes `/api/ai-status` and `/api/ai-chat`; keep the
Groq key only in Render's `LLM_API_KEY` setting.

## Free-tier behavior and data

Render's free web service sleeps after inactivity and can take around a minute
to wake. Its local filesystem is temporary. Farmer accounts are stored in the
browser's local storage, not in a shared cloud database. NASA POWER requests do
not require Earth Engine credentials. Hosted SMAP, MODIS, and SRTM need separate
Earth Engine credentials configured for the Render environment.
