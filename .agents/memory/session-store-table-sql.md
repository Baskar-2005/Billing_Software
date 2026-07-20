---
name: Session store table.sql
description: connect-pg-simple reads table.sql at runtime; esbuild doesn't copy it — must be done manually in build.mjs.
---

# connect-pg-simple table.sql must be copied in build

## The rule
After esbuild runs, copy `table.sql` from `connect-pg-simple`'s package dir into `dist/`. Without it the session store fails to initialize, which breaks all session-dependent routes with 500 errors.

**Why:** esbuild only bundles JS. `connect-pg-simple` uses `fs.readFile` to load `table.sql` at runtime (to CREATE TABLE if missing). The file path is relative to the built output, so it must be in `dist/`.

**How to apply:** In `artifacts/api-server/build.mjs`, after the esbuild call:
```js
await copyFile(
  path.resolve(artifactDir, "../../node_modules/.pnpm/connect-pg-simple@10.0.0/node_modules/connect-pg-simple/table.sql"),
  path.join(distDir, "table.sql")
);
```
Also set `createTableIfMissing: false` in app.ts once the table is created (avoids duplicate-constraint errors on restarts).

The session table is named `"session"` (connect-pg-simple default), not `"user_sessions"`.
