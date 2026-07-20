/**
 * Vercel serverless entry point.
 *
 * @vercel/node calls this module and passes (req, res) directly to the
 * Express app — no extra adapter needed.
 */
import app from "../src/app.js";

export default app;
