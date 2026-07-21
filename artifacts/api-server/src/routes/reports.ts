import { Router, type IRouter } from "express";
import { db, billsTable } from "@workspace/db";
import { gte, lte, and } from "drizzle-orm";
import {
  GetReportSummaryQueryParams,
  GetTopProductsQueryParams,
  GetPaymentMethodStatsQueryParams,
  GetPeakHoursQueryParams,
  GetRevenueTrendQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── IST helpers (UTC+5:30) ───────────────────────────────────────────────────
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // 5 h 30 m

/** Shift a UTC Date into IST so that getUTC* methods return IST wall-clock values */
function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET_MS);
}

/** YYYY-MM-DD string for a UTC timestamp, expressed in IST */
function istDateKey(utcDate: Date): string {
  const d = toIST(utcDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** IST hour (0-23) for a UTC timestamp */
function istHour(utcDate: Date): number {
  return toIST(utcDate).getUTCHours();
}

/**
 * Given an IST year/month/day, return the UTC epoch for IST midnight (start)
 * and IST 23:59:59.999 (end).
 */
function istDayBounds(y: number, m: number, d: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(y, m, d, 0, 0, 0, 0) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m, d, 23, 59, 59, 999) - IST_OFFSET_MS),
  };
}

/** Return today's start/end in UTC such that IST midnight is the boundary */
function istTodayBounds(): { start: Date; end: Date } {
  const ist = toIST(new Date());
  return istDayBounds(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
}

// ─── Date range builder ───────────────────────────────────────────────────────

function getDateRange(
  period?: string,
  startDate?: string,
  endDate?: string
): { start: Date; end: Date } {
  if (startDate && endDate) {
    // Treat the date strings as IST calendar dates (YYYY-MM-DD)
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    return {
      start: istDayBounds(sy, sm - 1, sd).start,
      end: istDayBounds(ey, em - 1, ed).end,
    };
  }

  const { start: todayStart, end: todayEnd } = istTodayBounds();

  switch (period) {
    case "week": {
      // Last 7 days inclusive (today + 6 previous days), all in IST
      const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { start: weekStart, end: todayEnd };
    }
    case "month": {
      // 1st of the current month in IST through end of today
      const ist = toIST(new Date());
      return {
        start: istDayBounds(ist.getUTCFullYear(), ist.getUTCMonth(), 1).start,
        end: todayEnd,
      };
    }
    default:
      // today in IST
      return { start: todayStart, end: todayEnd };
  }
}

function getPreviousRange(start: Date, end: Date): { start: Date; end: Date } {
  const diff = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diff);
  return { start: prevStart, end: prevEnd };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/reports/summary", async (req, res): Promise<void> => {
  const paramsParsed = GetReportSummaryQueryParams.safeParse(req.query);
  const params = paramsParsed.success ? paramsParsed.data : {};
  const { start, end } = getDateRange(params.period, params.startDate, params.endDate);
  const { start: prevStart, end: prevEnd } = getPreviousRange(start, end);

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const prevBills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, prevStart), lte(billsTable.createdAt, prevEnd)));

  const totalRevenue = bills.reduce((sum, b) => sum + parseFloat(b.total), 0);
  const totalOrders = bills.length;
  const averageBill = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalDiscount = bills.reduce((sum, b) => sum + parseFloat(b.discount ?? "0"), 0);
  const totalTax = bills.reduce((sum, b) => sum + parseFloat(b.tax ?? "0"), 0);

  const prevRevenue = prevBills.reduce((sum, b) => sum + parseFloat(b.total), 0);
  const prevOrders = prevBills.length;

  const revenueGrowth =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const ordersGrowth =
    prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : null;

  const itemCounts: Record<string, number> = {};
  bills.forEach((b) => {
    (b.items as any[]).forEach((item) => {
      itemCounts[item.productName] = (itemCounts[item.productName] ?? 0) + item.quantity;
    });
  });
  const bestSellingItem =
    Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

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

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const productMap: Record<
    number,
    { productId: number; productName: string; quantitySold: number; revenue: number }
  > = {};
  bills.forEach((b) => {
    (b.items as any[]).forEach((item) => {
      if (!productMap[item.productId]) {
        productMap[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          quantitySold: 0,
          revenue: 0,
        };
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

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

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

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const hourMap: Record<number, { orders: number; revenue: number }> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = { orders: 0, revenue: 0 };

  bills.forEach((b) => {
    // Use IST hour so midnight IST bills land in hour 0, not hour 18 (UTC)
    const hour = istHour(b.createdAt);
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

  const bills = await db
    .select()
    .from(billsTable)
    .where(and(gte(billsTable.createdAt, start), lte(billsTable.createdAt, end)));

  const dayMap: Record<string, { revenue: number; orders: number }> = {};

  // Build all IST dates in range
  const current = new Date(start);
  while (current <= end) {
    const key = istDateKey(current);
    if (!dayMap[key]) dayMap[key] = { revenue: 0, orders: 0 };
    current.setUTCDate(current.getUTCDate() + 1);
  }

  bills.forEach((b) => {
    // Group by IST calendar date, not UTC date
    const key = istDateKey(b.createdAt);
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
