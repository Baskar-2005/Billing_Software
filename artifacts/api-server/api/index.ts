// Vercel serverless entry point — re-exports the Express app as the default handler.
// @vercel/node wraps it automatically; no app.listen() needed.
export { default } from "../src/app.js";
