import { pgTable, serial, text, numeric, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  items: json("items").notNull().$type<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>>(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  cashAmount: numeric("cash_amount", { precision: 10, scale: 2 }),
  upiAmount: numeric("upi_amount", { precision: 10, scale: 2 }),
  cardAmount: numeric("card_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  customerName: text("customer_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBillSchema = createInsertSchema(billsTable).omit({ id: true, createdAt: true });
export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof billsTable.$inferSelect;
