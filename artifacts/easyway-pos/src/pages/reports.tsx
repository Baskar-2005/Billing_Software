import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { 
  useGetReportSummary, 
  useGetTopProducts, 
  useGetPaymentMethodStats, 
  useGetPeakHours, 
  useGetRevenueTrend,
  GetReportSummaryPeriod
} from "@workspace/api-client-react";
import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, Percent, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Reports() {
  const [period, setPeriod] = useState<GetReportSummaryPeriod>("today");

  const { data: summary, isLoading: loadingSummary } = useGetReportSummary({ period });
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProducts({ period, limit: 5 });
  const { data: paymentStats, isLoading: loadingPayments } = useGetPaymentMethodStats({ period });
  const { data: peakHours, isLoading: loadingHours } = useGetPeakHours({ period });
  const { data: revenueTrend, isLoading: loadingTrend } = useGetRevenueTrend({ period: period === "today" ? "week" : period });

  const periods: { value: GetReportSummaryPeriod, label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const COLORS = ['#0F766E', '#14B8A6', '#F59E0B', '#64748B', '#ef4444'];

  return (
    <AppLayout>
      <TopBar title="Reports" />
      
      <div className="p-4 flex flex-col gap-6 pb-24">
        {/* Period Selector */}
        <div className="flex bg-card p-1 rounded-2xl border border-border shadow-sm">
          {periods.map(p => (
            <button
              key={p.value}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
                period === p.value 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loadingSummary ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Revenue</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">₹{summary?.totalRevenue.toFixed(2)}</h3>
                {summary?.revenueGrowth !== null && summary?.revenueGrowth !== undefined && (
                  <p className={cn("text-xs flex items-center mt-1 font-medium", summary.revenueGrowth >= 0 ? "text-emerald-500" : "text-destructive")}>
                    {summary.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(summary.revenueGrowth).toFixed(1)}% vs prev
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-sm font-medium">Orders</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{summary?.totalOrders}</h3>
                {summary?.ordersGrowth !== null && summary?.ordersGrowth !== undefined && (
                  <p className={cn("text-xs flex items-center mt-1 font-medium", summary.ordersGrowth >= 0 ? "text-emerald-500" : "text-destructive")}>
                    {summary.ordersGrowth >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(summary.ordersGrowth).toFixed(1)}% vs prev
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-2 bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Average Bill <Info className="w-3 h-3" />
                  </p>
                  <h3 className="text-xl font-bold text-foreground mt-1">₹{summary?.averageBill.toFixed(2)}</h3>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    Total Discount <Percent className="w-3 h-3" />
                  </p>
                  <h3 className="text-xl font-bold text-foreground mt-1">₹{summary?.totalDiscount.toFixed(2)}</h3>
                </div>
              </motion.div>
            </div>

            {/* Revenue Trend */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-4">Revenue Trend</h3>
              <div className="h-[200px] w-full">
                {loadingTrend ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : revenueTrend && revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return period === 'today' || period === 'week' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.getDate().toString();
                        }}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        width={40}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "hsl(var(--secondary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Products & Payment Methods Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Top Products */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4">Top Products</h3>
                <div className="space-y-3">
                  {loadingProducts ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : topProducts && topProducts.length > 0 ? (
                    topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{p.productName}</p>
                          <p className="text-xs text-muted-foreground">{p.quantitySold} sold</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">₹{p.revenue.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">No data</div>
                  )}
                </div>
              </motion.div>

              {/* Payment Methods */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-4">Payment Methods</h3>
                <div className="h-[180px] w-full relative">
                  {loadingPayments ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentStats && paymentStats.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="amount"
                            stroke="none"
                          >
                            {paymentStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-foreground">
                          ₹{paymentStats.reduce((a, b) => a + b.amount, 0).toFixed(0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No data
                    </div>
                  )}
                </div>
                {paymentStats && paymentStats.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {paymentStats.map((stat, i) => (
                      <div key={stat.method} className="flex items-center gap-1.5 text-xs font-medium">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="capitalize">{stat.method} ({stat.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
