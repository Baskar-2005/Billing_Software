import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// In production (Vercel) the frontend and backend are on different domains.
// Set VITE_API_URL in the Vercel frontend project's environment variables to
// point at the deployed backend URL (e.g. https://easyway-pos-api.vercel.app).
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration is non-critical
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
