# EasyWay POS

A point-of-sale web app for tea shops — PIN-protected login, product/category management, billing, and sales reports.

## Run & Operate

- `pnpm --filter @workspace/easyway-pos run dev` — run the React frontend (Vite)
- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to Supabase (dev only; run via `cd lib/db && ./node_modules/.bin/drizzle-kit push --config ./drizzle.config.ts` if the pnpm script fails)

## Required secrets

- `DATABASE_URL` — Supabase **pooler** connection string (Transaction mode, port 6543). Must use the pooler — the direct `db.*` host is not reachable from Replit.
  Format: `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`
  Special chars in password must be URL-encoded (e.g. `@` → `%40`).
- `SESSION_SECRET` — already set

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React + Vite (`artifacts/easyway-pos`)
- API: Express 5 (`artifacts/api-server`)
- DB: PostgreSQL (Supabase) + Drizzle ORM
- Sessions: express-session + connect-pg-simple (requires a `session` table — created on first setup)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle table definitions (source of truth for DB schema)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/easyway-pos/src/pages/` — React page components
- `artifacts/easyway-pos/src/components/` — Shared UI components

## Default login

PIN: `123456` (stored in `settings` table, changeable via Settings page)

## Gotchas

- Supabase direct host (`db.*.supabase.co`) is blocked on Replit — always use the pooler URL.
- `@` in a Postgres password must be URL-encoded as `%40` in the connection string.
- The `session` table must exist before the API starts (created manually on first setup with `CREATE TABLE IF NOT EXISTS "session" ...`).
- `pnpm --filter @workspace/db run push` may fail due to drizzle-kit path issues; use `cd lib/db && ./node_modules/.bin/drizzle-kit push --config ./drizzle.config.ts` directly.
- The `.migration-backup/` directory is a snapshot from migration and can be ignored.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
