# Deploying EasyWay POS to Vercel

Two separate Vercel projects are required — one for the **API backend** and one for the **React frontend**. Both are deployed from the same GitHub repository using different root directories.

---

## Prerequisites

1. Push this repo to GitHub.
2. Have a **PostgreSQL database** accessible from the internet.  
   Good options: [Neon](https://neon.tech) (free tier), [Supabase](https://supabase.com), or [Railway](https://railway.app).  
   Copy the connection string — you'll need it as `DATABASE_URL`.

---

## 1 — Deploy the API Backend

### Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo.
2. **Root Directory**: `artifacts/api-server`
3. **Framework**: Other
4. **Install Command** (override):
   ```
   cd ../.. && pnpm install --frozen-lockfile
   ```
5. **Build Command** (override):
   ```
   cd ../.. && pnpm run typecheck:libs
   ```
6. **Output Directory**: leave empty
7. Click **Deploy**.

### Set environment variables (Settings → Environment Variables)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `SESSION_SECRET` | A long random string (e.g. run `openssl rand -hex 32`) |
| `FRONTEND_URL` | The frontend Vercel URL you'll get in step 2 (add after frontend is deployed) |
| `NODE_ENV` | `production` |

> **Note:** After the first deploy, Vercel will auto-create a `user_sessions` table in your database for storing login sessions.

---

## 2 — Deploy the React Frontend

### Create a second Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) → Import the **same** GitHub repo.
2. **Root Directory**: `artifacts/easyway-pos`
3. **Framework**: Vite
4. **Install Command** (override):
   ```
   cd ../.. && pnpm install --frozen-lockfile
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
3. Set `FRONTEND_URL` to the frontend URL.
4. **Redeploy** the backend (Deployments → ⋯ → Redeploy).

This ensures the API allows cross-origin requests from the frontend and issues `SameSite=none` cookies correctly.

---

## 4 — Verify

1. Open the frontend URL in your browser.
2. Log in with PIN **123456**.
3. Create a test bill to verify the full round-trip works.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Login always fails | Check `SESSION_SECRET` and `DATABASE_URL` are set on the backend; ensure `FRONTEND_URL` matches the actual frontend domain |
| API calls return CORS error | Confirm `FRONTEND_URL` on the backend is the exact origin (no trailing slash) |
| `user_sessions` table error | Run `pnpm --filter @workspace/db run push` against your production database, or let the app create it automatically on first request |
| Products have no images | Images are served from the frontend's `/products/` path — they're included in the Vite build output automatically |

---

## Local development (unchanged)

```bash
pnpm install
pnpm run typecheck:libs
# Terminal 1
pnpm --filter @workspace/api-server run dev
# Terminal 2
pnpm --filter @workspace/easyway-pos run dev
```
