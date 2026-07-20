# Deploying EasyWay POS to Vercel

Two separate Vercel projects are required — one for the **API backend** and one for the **React frontend**. Both import from the same GitHub repository.

---

## Prerequisites

1. Push this repo to GitHub.
2. Your Supabase PostgreSQL database is already set up and the schema has been pushed (`pnpm --filter @workspace/db run push`).

---

## 1 — Deploy the API Backend

### Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your GitHub repo.
2. **Root Directory**: `artifacts/api-server`
3. **Framework Preset**: Other
4. Leave **Install Command**, **Build Command**, and **Output Directory** as default — they are set in `vercel.json` already.
5. Click **Deploy**.

> The `artifacts/api-server/vercel.json` already contains the correct `installCommand` (`npm install -g pnpm@10 && cd ../.. && pnpm install --no-frozen-lockfile`) and `buildCommand`.

### Set environment variables (Settings → Environment Variables)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase pooler connection string (see note below) |
| `SESSION_SECRET` | A long random string — run `openssl rand -hex 32` to generate one |
| `FRONTEND_URL` | The frontend Vercel URL (add after step 2; redeploy backend after setting) |
| `NODE_ENV` | `production` |

> **DATABASE_URL note:** Use the **Transaction pooler** URL from Supabase (Settings → Database → Connection string → Transaction mode, port 6543).  
> Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`  
> If your password contains `@`, encode it as `%40` in the URL.  
> The direct `db.[project].supabase.co` host is **not reachable** from Vercel — always use the pooler.

---

## 2 — Deploy the React Frontend

### Create a second Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → Import the **same** GitHub repo.
2. **Root Directory**: `artifacts/easyway-pos`
3. **Framework Preset**: Vite
4. **Install Command** (override):
   ```
   npm install -g pnpm@10 && cd ../.. && pnpm install --no-frozen-lockfile
   ```
5. **Build Command** (override):
   ```
   cd ../.. && pnpm run typecheck:libs && cd artifacts/easyway-pos && pnpm exec vite build --config vite.config.vercel.ts
   ```
6. **Output Directory**: `dist`
7. Click **Deploy**.

### Set environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | The backend Vercel URL from step 1 (e.g. `https://easyway-pos-api.vercel.app`) |

---

## 3 — Cross-link the two projects

After both are deployed:

1. Copy the **frontend URL** (e.g. `https://easyway-pos.vercel.app`).
2. Go to the **backend** project → Settings → Environment Variables.
3. Set `FRONTEND_URL` to the frontend URL (no trailing slash).
4. **Redeploy** the backend (Deployments → ⋯ → Redeploy).

This ensures the API allows CORS requests from the frontend and issues `SameSite=none` cookies correctly (required for cross-domain sessions).

---

## 4 — Verify

1. Open the frontend URL in your browser.
2. Log in with PIN **123456**.
3. Create a test bill to verify the full round-trip works.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with "Cannot find package" | Check that the install command runs from the repo root (`cd ../..`) |
| Login always fails | Verify `SESSION_SECRET` and `DATABASE_URL` are set on the backend; check `FRONTEND_URL` matches the exact frontend origin |
| API calls return CORS error | Confirm `FRONTEND_URL` on the backend is the exact origin with no trailing slash |
| Database connection error on Vercel | Use the Supabase pooler URL (port 6543), not the direct host. Encode special chars in password. |
| Session not persisting | The `session` table must exist in your DB — it was created during setup but verify with `SELECT * FROM session LIMIT 1` in Supabase SQL editor |
