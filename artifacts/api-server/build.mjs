import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm, copyFile } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// Packages that can't be bundled (native modules, dynamic path traversal, etc.)
const external = [
  "*.node",
  "sharp",
  "better-sqlite3",
  "sqlite3",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
  "re2",
  "farmhash",
  "xxhash-addon",
  "bufferutil",
  "utf-8-validate",
  "ssh2",
  "cpu-features",
  "dtrace-provider",
  "isolated-vm",
  "lightningcss",
  "pg-native",
  "oracledb",
  "mongodb-client-encryption",
  "nodemailer",
  "handlebars",
  "knex",
  "typeorm",
  "protobufjs",
  "onnxruntime-node",
  "@tensorflow/*",
  "@prisma/client",
  "@mikro-orm/*",
  "@grpc/*",
  "@swc/*",
  "@aws-sdk/*",
  "@azure/*",
  "@opentelemetry/*",
  "@google-cloud/*",
  "@google/*",
  "googleapis",
  "firebase-admin",
  "@parcel/watcher",
  "@sentry/profiling-node",
  "@tree-sitter/*",
  "aws-sdk",
  "classic-level",
  "dd-trace",
  "ffi-napi",
  "grpc",
  "hiredis",
  "kerberos",
  "leveldown",
  "miniflare",
  "mysql2",
  "newrelic",
  "odbc",
  "piscina",
  "realm",
  "ref-napi",
  "rocksdb",
  "sass-embedded",
  "sequelize",
  "serialport",
  "snappy",
  "tinypool",
  "usb",
  "workerd",
  "wrangler",
  "zeromq",
  "zeromq-prebuilt",
  "playwright",
  "puppeteer",
  "puppeteer-core",
  "electron",
];

// CJS-in-ESM compatibility banner
const banner = {
  js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
  `,
};

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  // ── 1. Local dev / Replit server (includes pino-pretty worker) ──────────
  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external,
    sourcemap: "linked",
    plugins: [
      // pino relies on workers to handle logging; the plugin handles it
      esbuildPluginPino({ transports: ["pino-pretty"] }),
    ],
    banner,
  });

  // connect-pg-simple reads table.sql at runtime to create the session table.
  // esbuild doesn't copy non-JS assets, so we do it manually here.
  const tableSqlSrc = path.resolve(
    artifactDir,
    "../../node_modules/.pnpm/connect-pg-simple@10.0.0/node_modules/connect-pg-simple/table.sql"
  );
  await copyFile(tableSqlSrc, path.join(distDir, "table.sql"));

  // ── 2. Vercel serverless function (no pino-pretty; JSON logs in prod) ───
  // Output goes to api/index.mjs so Vercel picks it up as a pre-built function
  // without any TypeScript compilation (avoids ncc composite-project issues).
  // Must use outdir (not outfile) because esbuildPluginPino adds extra entries.
  const apiDir = path.resolve(artifactDir, "api");
  await esbuild({
    // Named entry: { in: "...", out: "index" } → api/index.mjs
    entryPoints: [{ in: path.resolve(artifactDir, "src/vercel.ts"), out: "index" }],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: apiDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    external,
    sourcemap: false,
    plugins: [
      // No pino-pretty transport in production — pino logs JSON to stdout
      esbuildPluginPino({ transports: [] }),
    ],
    banner,
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
