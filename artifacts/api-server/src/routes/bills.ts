import { Router, type IRouter } from "express";
import { db, billsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, desc } from "drizzle-orm";
import {
  CreateBillBody,
  GetBillParams,
  DeleteBillParams,
  ListBillsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateBillNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `BILL-${date}-${random}`;
}

function formatBill(b: any) {
  return {
    id: b.id,
    billNumber: b.billNumber,
    items: b.items,
    subtotal: parseFloat(b.subtotal),
    discount: parseFloat(b.discount ?? "0"),
    tax: parseFloat(b.tax ?? "0"),
    total: parseFloat(b.total),
    paymentMethod: b.paymentMethod,
    cashAmount: b.cashAmount != null ? parseFloat(b.cashAmount) : null,
    upiAmount: b.upiAmount != null ? parseFloat(b.upiAmount) : null,
    cardAmount: b.cardAmount != null ? parseFloat(b.cardAmount) : null,
    notes: b.notes ?? null,
    customerName: b.customerName ?? null,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  };
}

router.get("/bills", async (req, res): Promise<void> => {
  const paramsParsed = ListBillsQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};

  const conditions = [];
  if (params.search) {
    conditions.push(ilike(billsTable.billNumber, `%${params.search}%`));
  }
  if (params.paymentMethod) {
    conditions.push(eq(billsTable.paymentMethod, params.paymentMethod));
  }
  if (params.startDate) {
    conditions.push(gte(billsTable.createdAt, new Date(params.startDate)));
  }
  if (params.endDate) {
    const end = new Date(params.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(billsTable.createdAt, end));
  }

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const bills = await db
    .select()
    .from(billsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(billsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(bills.map(formatBill));
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { items, discount = 0, notes, customerName, paymentMethod, cashAmount, upiAmount, cardAmount } = parsed.data;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = discount ?? 0;

  // Get tax rate from settings
  let taxRate = 0;
  try {
    const { settingsTable } = await import("@workspace/db");
    const settingsRows = await db.select().from(settingsTable).limit(1);
    if (settingsRows[0]?.taxEnabled) {
      taxRate = parseFloat(settingsRows[0].taxRate ?? "0");
    }
  } catch {
    // ignore
  }

  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const billItems = items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.unitPrice * item.quantity,
  }));

  const inserted = await db.insert(billsTable).values({
    billNumber: generateBillNumber(),
    items: billItems,
    subtotal: String(subtotal.toFixed(2)),
    discount: String(discountAmount.toFixed(2)),
    tax: String(taxAmount.toFixed(2)),
    total: String(total.toFixed(2)),
    paymentMethod,
    cashAmount: cashAmount != null ? String(cashAmount) : null,
    upiAmount: upiAmount != null ? String(upiAmount) : null,
    cardAmount: cardAmount != null ? String(cardAmount) : null,
    notes: notes ?? null,
    customerName: customerName ?? null,
  }).returning();

  res.status(201).json(formatBill(inserted[0]));
});

router.get("/bills/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = GetBillParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const rows = await db.select().from(billsTable).where(eq(billsTable.id, id));
  if (!rows[0]) {
    res.status(404).json({ error: "Bill not found" });
    return;
  }
  res.json(formatBill(rows[0]));
});

router.delete("/bills/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const paramParsed = DeleteBillParams.safeParse({ id });
  if (!paramParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(billsTable).where(eq(billsTable.id, id));
  res.json({ success: true, message: "Bill deleted" });
});

export default router;
