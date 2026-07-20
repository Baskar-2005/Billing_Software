import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { 
  useGetReportSummary, 
  useListBills, 
  getGetReportSummaryQueryKey,
  getListBillsQueryKey
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Receipt, TrendingUp, ShoppingBag, CreditCard, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function StatCard({ title, value, icon: Icon, delay }: { title: string, value: string, icon: any, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetReportSummary({
    period: "today"
  }, {
    query: { queryKey: getGetReportSummaryQueryKey({ period: "today" }) }
  });

  const { data: recentBills, isLoading: loadingBills } = useListBills({
    limit: 5
  }, {
    query: { queryKey: getListBillsQueryKey({ limit: 5 }) }
  });

  return (
    <AppLayout>
      <TopBar />
      
      <div className="p-4 flex flex-col gap-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/billing" className="col-span-2">
            <Button className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md shadow-primary/20 text-lg font-semibold gap-2">
              <Plus className="w-6 h-6" />
              New Bill
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            title="Today's Revenue" 
            value={loadingSummary ? "..." : `₹${summary?.totalRevenue?.toFixed(2) || "0.00"}`}
            icon={CreditCard}
            delay={0.1}
          />
          <StatCard 
            title="Today's Orders" 
            value={loadingSummary ? "..." : `${summary?.totalOrders || 0}`}
            icon={Receipt}
            delay={0.2}
          />
          <StatCard 
            title="Average Bill" 
            value={loadingSummary ? "..." : `₹${summary?.averageBill?.toFixed(2) || "0.00"}`}
            icon={TrendingUp}
            delay={0.3}
          />
          <StatCard 
            title="Best Item" 
            value={loadingSummary ? "..." : summary?.bestSellingItem || "None"}
            icon={ShoppingBag}
            delay={0.4}
          />
        </div>

        {/* Recent Bills */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Bills</h2>
            <Link href="/bills" className="text-sm font-medium text-primary hover:underline">
              See all
            </Link>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {loadingBills ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !recentBills || recentBills.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Receipt className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">No bills yet</p>
                <p className="text-sm text-muted-foreground mt-1">Your recent transactions will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {recentBills.map((bill, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={bill.id}
                  >
                    <Link href={`/receipt/${bill.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{bill.billNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(bill.createdAt), "hh:mm a")} • {bill.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{bill.total.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{bill.paymentMethod}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
