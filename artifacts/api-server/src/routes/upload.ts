import { Router, type IRouter } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const router: IRouter = Router();

// Memory storage — files never touch the serverless filesystem
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  // Provide ws as the WebSocket transport so Node.js 20 doesn't throw a
  // "native WebSocket not found" error (only needed for realtime; storage
  // uses HTTP but the client initialises the realtime module eagerly).
  return createClient(url, key, {
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// POST /api/upload/product-image
// Accepts: multipart/form-data with field name "image"
// Returns: { url: string }
router.post(
  "/upload/product-image",
  upload.single("image"),
  async (req, res): Promise<void> => {
    // Must be logged in
    if (!(req as any).session?.authenticated) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    try {
      const supabase = getSupabase();

      const ext = (req.file.originalname.split(".").pop() ?? "jpg").toLowerCase();
      const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filename);

      res.json({ url: data.publicUrl });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      res.status(500).json({ error: message });
    }
  }
);

export default router;
