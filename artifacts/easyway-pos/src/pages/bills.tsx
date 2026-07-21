import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { useListBills, useDeleteBill, getListBillsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { format, subDays, addDays } from "date-fns";
import {
  Search, FileText, Trash2, Calendar, Loader2, Eye,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = ["all", "cash", "upi", "card", "split"] as const;
type PaymentFilter = typeof PAYMENT_METHODS[number];

export default function Bills() {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const queryClient = useQueryClient();

  const startDate = dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined;
  const endDate   = dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined;

  const queryParams = {
    search: search || undefined,
    paymentMethod: paymentFilter !== "all" ? paymentFilter : undefined,
    startDate,
    endDate,
  };

  const { data: bills, isLoading } = useListBills(queryParams, {
    query: { queryKey: getListBillsQueryKey(queryParams) },
  });

  const deleteBill = useDeleteBill();

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this bill? This will affect your reports.")) {
      deleteBill.mutate({ id }, {
        onSuccess: () => {
          toast.success("Bill deleted successfully");
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        },
        onError: () => {
          toast.error("Failed to delete bill");
        },
      });
    }
  };

  const navigateDate = (dir: -1 | 1) => {
    setDateFilter(d => d ? (dir === -1 ? subDays(d, 1) : addDays(d, 1)) : new Date());
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setDateFilter(null);
  };

  const hasFilters = search || paymentFilter !== "all" || dateFilter;

  return (
    <AppLayout>
      <TopBar title="Sales History" />

      <div className="p-4 flex flex-col gap-4">
        {/* ── Sticky filter bar ── */}
        <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-2 pb-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by bill number..."
              className="pl-9 bg-card border-border rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Payment method pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentFilter(m)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors",
                  paymentFilter === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "all" ? "All Methods" : m.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-8 rounded-lg border text-sm font-medium transition-colors",
                  dateFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  {dateFilter ? format(dateFilter, "dd MMM yyyy") : "All Dates"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarPicker
                  mode="single"
                  selected={dateFilter ?? undefined}
                  onSelect={(d) => { setDateFilter(d ?? null); setCalOpen(false); }}
                />
              </PopoverContent>
            </Popover>

            <button
              onClick={() => navigateDate(1)}
              disabled={dateFilter ? addDays(dateFilter, 1) > new Date() : true}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 h-8 rounded-lg text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Bill list ── */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !bills || bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-3xl border border-border mt-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">No bills found</h3>
            <p className="text-muted-foreground text-sm">
              {hasFilters ? "Try changing your filters." : "Your completed sales will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            <AnimatePresence>
              {bills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-3 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{bill.billNumber}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">₹{bill.total.toFixed(2)}</p>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground mt-1">
                        {bill.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground border-t border-border pt-3 mt-1">
                    <span className="flex-1 truncate">
                      {bill.items.length} item{bill.items.length !== 1 ? "s" : ""}: {bill.items.map((i) => i.productName).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-1">
                    <Link href={`/receipt/${bill.id}`}>
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-semibold gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View Receipt
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 px-2 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(bill.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
