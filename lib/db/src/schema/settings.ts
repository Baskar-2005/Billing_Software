import { pgTable, serial, text, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name").notNull().default("My Tea Shop"),
  shopAddress: text("shop_address"),
  shopPhone: text("shop_phone"),
  shopLogo: text("shop_logo"),
  currency: text("currency").notNull().default("INR"),
  currencySymbol: text("currency_symbol").notNull().default("₹"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("5"),
  taxEnabled: boolean("tax_enabled").notNull().default(true),
  gstNumber: text("gst_number"),
  receiptFooter: text("receipt_footer").default("Thank you for your visit!"),
  pin: text("pin").notNull().default("123456"),
  darkMode: boolean("dark_mode").notNull().default(false),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
