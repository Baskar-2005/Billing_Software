import express, { type Application } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Application = express();
const isProd = process.env.NODE_ENV === "production";

// Trust the first proxy (required on Vercel / any reverse-proxy host) so that
// req.secure reflects the original HTTPS connection, not the internal HTTP hop.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS — in production restrict to the deployed frontend URL
// Strip any trailing slash — browsers send origins without one, so a mismatch causes CORS failure
const allowedOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/\/+$/, "")
  : true;
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session — backed by PostgreSQL so sessions persist across serverless restarts
const PgStore = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET ?? "easyway-pos-dev-secret";

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // Cross-domain setup (FRONTEND_URL set) always needs SameSite=None + Secure
      // so the browser sends the cookie on cross-origin requests from the frontend.
      // We key off FRONTEND_URL rather than NODE_ENV because Vercel may not
      // automatically inject NODE_ENV=production into the serverless runtime.
      secure: !!process.env.FRONTEND_URL || isProd,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: (process.env.FRONTEND_URL || isProd) ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
