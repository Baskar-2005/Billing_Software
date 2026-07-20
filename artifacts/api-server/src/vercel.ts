// Vercel serverless entry point — exports the Express app as the default handler.
// Vercel's @vercel/node runtime wraps it automatically; no app.listen() needed.
import app from "./app.js";

export default app;
