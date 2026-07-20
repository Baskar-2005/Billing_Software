import { Router, type IRouter } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  res.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const inserted = await db.insert(categoriesTable).values(parsed.data).returning();
  const c = inserted[0];
  res.status(201).json({ id: c.id, name: c.name, color: c.color, icon: c.icon, createdAt: c.createdAt.toISOString() });
});

router.put("/categories/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = UpdateCategoryParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const bodyParsed = UpdateCategoryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const updated = await db.update(categoriesTable).set(bodyParsed.data).where(eq(categoriesTable.id, id)).returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  const c = updated[0];
  res.json({ id: c.id, name: c.name, color: c.color, icon: c.icon, createdAt: c.createdAt.toISOString() });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = DeleteCategoryParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.json({ success: true, message: "Category deleted" });
});

export default router;
