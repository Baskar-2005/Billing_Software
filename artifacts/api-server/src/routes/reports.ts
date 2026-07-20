import { Router, type IRouter } from "express";
import { db, billsTable } from "@workspace/db";
import { gte, lte, and, sql } from "drizzle-orm";
import {
  GetReportSummaryQueryParams,
  GetTopProductsQueryParams,
  GetPaymentMethodStatsQueryParams,
  GetPeakHoursQueryParams,
  GetRevenueTrendQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getDateRange(period?: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  }

  switch (period) {
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    default: {
      // today
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  }
}

function getPreviousRange(period?: string, start?: Date, end?: Date): { start: Date; end: Date } {
  const diff = (end!.getTime() - start!.getTime());
  const prevEnd = new Date(start!.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diff);
  return { start: prevStart, end: prevEnd };
}

router.get("/reports/summary", async (req, res): Promise<void> => {
  const paramsParsed = GetReportSummaryQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period, params.startDate, params.endDate);
  const { start: prevStart, end: prevEnd } = getPreviousRange(params.period, start, end);

  const conditions = [gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)];
  const prevConditions = [gte(billsTable.createdAt, prevStart), lte(billsTable.createdAt, prevEnd)];

  const bills = await db.select().from(billsTable).where(and(...conditions));
  const prevBills = await db.select().from(billsTable).where(and(...prevConditions));

  const totalRevenue = bills.reduce((sum, b) => sum + parseFloat(b.total), 0);
  const totalOrders = bills.length;
  const averageBill = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDiscount = bills.reduce((sum, b) => sum + parseFloat(b.discount ?? "0"), 0);
  const totalTax = bills.reduce((sum, b) => sum + parseFloat(b.tax ?? "0"), 0);

  const prevRevenue = prevBills.reduce((sum, b) => sum + parseFloat(b.total), 0);
  const prevOrders = prevBills.length;

  const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : null;

  // Find best selling item
  const itemCounts: Record<string, number> = {};
  bills.forEach((b) => {
    const items = b.items as any[];
    items.forEach((item) => {
      itemCounts[item.productName] = (itemCounts[item.productName] ?? 0) + item.quantity;
    });
  });
  const bestSellingItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    averageBill: Math.round(averageBill * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    bestSellingItem,
    revenueGrowth: revenueGrowth != null ? Math.round(revenueGrowth * 10) / 10 : null,
    ordersGrowth: ordersGrowth != null ? Math.round(ordersGrowth * 10) / 10 : null,
  });
});

router.get("/reports/top-products", async (req, res): Promise<void> => {
  const paramsParsed = GetTopProductsQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period, params.startDate, params.endDate);
  const limit = params.limit ?? 10;

  const bills = await db.select().from(billsTable).where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const productMap: Record<number, { productId: number; productName: string; quantitySold: number; revenue: number }> = {};
  bills.forEach((b) => {
    const items = b.items as any[];
    items.forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = { productId: item.productId, productName: item.productName, quantitySold: 0, revenue: 0 };
      }
      productMap[item.productId].quantitySold += item.quantity;
      productMap[item.productId].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100, image: null }));

  res.json(topProducts);
});

router.get("/reports/payment-methods", async (req, res): Promise<void> => {
  const paramsParsed = GetPaymentMethodStatsQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period, params.startDate, params.endDate);

  const bills = await db.select().from(billsTable).where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const methodMap: Record<string, { count: number; amount: number }> = {};
  bills.forEach((b) => {
    const method = b.paymentMethod;
    if (!methodMap[method]) methodMap[method] = { count: 0, amount: 0 };
    methodMap[method].count++;
    methodMap[method].amount += parseFloat(b.total);
  });

  const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.total), 0);

  const stats = Object.entries(methodMap).map(([method, { count, amount }]) => ({
    method,
    count,
    amount: Math.round(amount * 100) / 100,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 1000) / 10 : 0,
  }));

  res.json(stats);
});

router.get("/reports/peak-hours", async (req, res): Promise<void> => {
  const paramsParsed = GetPeakHoursQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period, params.startDate, params.endDate);

  const bills = await db.select().from(billsTable).where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const hourMap: Record<number, { orders: number; revenue: number }> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = { orders: 0, revenue: 0 };

  bills.forEach((b) => {
    const hour = b.createdAt.getHours();
    hourMap[hour].orders++;
    hourMap[hour].revenue += parseFloat(b.total);
  });

  const result = Object.entries(hourMap).map(([hour, { orders, revenue }]) => ({
    hour: parseInt(hour),
    orders,
    revenue: Math.round(revenue * 100) / 100,
  }));

  res.json(result);
});

router.get("/reports/revenue-trend", async (req, res): Promise<void> => {
  const paramsParsed = GetRevenueTrendQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period ?? "week", params.startDate, params.endDate);

  const bills = await db.select().from(billsTable).where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const dayMap: Record<string, { revenue: number; orders: number }> = {};

  // Build all dates in range
  const current = new Date(start);
  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    dayMap[key] = { revenue: 0, orders: 0 };
    current.setDate(current.getDate() + 1);
  }

  bills.forEach((b) => {
    const key = b.createdAt.toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].revenue += parseFloat(b.total);
      dayMap[key].orders++;
    }
  });

  const result = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
      orders,
    }));

  res.json(result);
});

export default router;
