import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/auth/status", async (req, res): Promise<void> => {
  const session = (req as any).session;
  if (session?.authenticated) {
    const rows = await db.select().from(settingsTable).limit(1);
    const shopName = rows[0]?.shopName ?? null;
    res.json({ authenticated: true, shopName });
  } else {
    res.json({ authenticated: false, shopName: null });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db.select().from(settingsTable).limit(1);
  let settings = rows[0];

  if (!settings) {
    // Auto-create default settings on first login
    const inserted = await db.insert(settingsTable).values({}).returning();
    settings = inserted[0];
  }

  if (parsed.data.pin !== settings.pin) {
    res.status(401).json({ error: "Invalid PIN" });
    return;
  }

  (req as any).session.authenticated = true;

  // Explicitly save before responding — in serverless the async DB write must
  // complete before the client makes the next request or the session won't exist.
  await new Promise<void>((resolve, reject) => {
    (req as any).session.save((err: unknown) => (err ? reject(err) : resolve()));
  });

  res.json({ authenticated: true, shopName: settings.shopName });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  (req as any).session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

export default router;
