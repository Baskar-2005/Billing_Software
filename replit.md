# EasyWay POS

A premium, mobile-first Progressive Web App (PWA) for tea shop billing. Create bills in under 10 seconds.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/easyway-pos run dev` — run the frontend (managed by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing secret

## Default Login
- PIN: **1234**
- Shop name: **Chai Corner**

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Framer Motion, Lucide Icons, Poppins font
- API: Express 5 + express-session
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — DB schema (categories, products, bills, settings)
- `artifacts/api-server/src/routes/` — route handlers (auth, categories, products, bills, reports, settings)
- `artifacts/easyway-pos/src/` — React frontend (pages, components, hooks)

## Architecture decisions

- Session-based auth with PIN login — simple and fast for POS use-case
- All bill items stored as JSONB in the bills table for flexibility
- Tax rate fetched from settings at bill creation time
- Reports computed on-the-fly from the bills table (no separate analytics DB)
- PWA manifest + service worker for installability and offline support

## Product

- **Login**: PIN pad (default: 1234), dark mode toggle, remember me
- **Home**: Today's stats, recent bills, quick actions
- **Billing**: Product grid, real-time cart, payment methods (cash/UPI/card/split), success animation
- **Products**: CRUD with categories, favorites, search, image support
- **Reports**: Revenue trends, top products, payment breakdown, peak hours (recharts)
- **Settings**: Shop info, tax/GST config, receipt customization, PIN change
- **Sales History**: Full bill timeline with search and filter
- **Receipt**: Printable thermal-style receipt with share support

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing any `lib/*` schema, then check artifact typecheck
- After OpenAPI spec changes, run codegen before restarting the API server
- Session cookie is HTTP-only; frontend auth state is managed via `GET /api/auth/status`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
