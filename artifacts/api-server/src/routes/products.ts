import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  GetProductParams,
  ToggleFavoriteParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: any, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    image: p.image ?? null,
    isFavorite: p.isFavorite,
    stock: p.stock ?? null,
    barcode: p.barcode ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const paramsParsed = ListProductsQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};

  const conditions = [];
  if (params.search) {
    conditions.push(ilike(productsTable.name, `%${params.search}%`));
  }
  if (params.categoryId !== undefined) {
    conditions.push(eq(productsTable.categoryId, Number(params.categoryId)));
  }
  if (params.favorites === true || params.favorites === "true" as any) {
    conditions.push(eq(productsTable.isFavorite, true));
  }

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      price: productsTable.price,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      image: productsTable.image,
      isFavorite: productsTable.isFavorite,
      stock: productsTable.stock,
      barcode: productsTable.barcode,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${productsTable.isFavorite} DESC`, productsTable.name);

  res.json(products.map((p) => formatProduct(p, p.categoryName)));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { categoryId, ...rest } = parsed.data;
  const inserted = await db.insert(productsTable).values({
    ...rest,
    price: String(rest.price),
    categoryId: categoryId ?? null,
  }).returning();

  let categoryName: string | null = null;
  if (inserted[0].categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, inserted[0].categoryId));
    categoryName = cats[0]?.name ?? null;
  }
  res.status(201).json(formatProduct(inserted[0], categoryName));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = GetProductParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      price: productsTable.price,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      image: productsTable.image,
      isFavorite: productsTable.isFavorite,
      stock: productsTable.stock,
      barcode: productsTable.barcode,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, id));

  if (!rows[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(rows[0], rows[0].categoryName));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = UpdateProductParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const bodyParsed = UpdateProductBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const { price, categoryId, ...rest } = bodyParsed.data;
  const updates: any = { ...rest };
  if (price !== undefined) updates.price = String(price);
  if (categoryId !== undefined) updates.categoryId = categoryId;

  const updated = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  let categoryName: string | null = null;
  if (updated[0].categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated[0].categoryId));
    categoryName = cats[0]?.name ?? null;
  }
  res.json(formatProduct(updated[0], categoryName));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = DeleteProductParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true, message: "Product deleted" });
});

router.patch("/products/:id/favorite", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = ToggleFavoriteParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const current = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!current[0]) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const updated = await db
    .update(productsTable)
    .set({ isFavorite: !current[0].isFavorite })
    .where(eq(productsTable.id, id))
    .returning();
  let categoryName: string | null = null;
  if (updated[0].categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, updated[0].categoryId));
    categoryName = cats[0]?.name ?? null;
  }
  res.json(formatProduct(updated[0], categoryName));
});

export default router;
