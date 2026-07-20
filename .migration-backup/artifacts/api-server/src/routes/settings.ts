import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatSettings(s: any) {
  return {
    shopName: s.shopName,
    shopAddress: s.shopAddress ?? null,
    shopPhone: s.shopPhone ?? null,
    shopLogo: s.shopLogo ?? null,
    currency: s.currency,
    currencySymbol: s.currencySymbol,
    taxRate: parseFloat(s.taxRate),
    taxEnabled: s.taxEnabled,
    gstNumber: s.gstNumber ?? null,
    receiptFooter: s.receiptFooter ?? null,
    pin: s.pin,
    darkMode: s.darkMode,
    soundEnabled: s.soundEnabled,
  };
}

router.get("/settings", async (req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable).limit(1);
  if (!rows[0]) {
    // Auto-create defaults
    const inserted = await db.insert(settingsTable).values({}).returning();
    res.json(formatSettings(inserted[0]));
    return;
  }
  res.json(formatSettings(rows[0]));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db.select().from(settingsTable).limit(1);
  const updates: any = { ...parsed.data };
  if (updates.taxRate !== undefined) updates.taxRate = String(updates.taxRate);

  if (!rows[0]) {
    const inserted = await db.insert(settingsTable).values(updates).returning();
    res.json(formatSettings(inserted[0]));
    return;
  }

  const updated = await db.update(settingsTable).set(updates).returning();
  res.json(formatSettings(updated[0]));
});

export default router;
