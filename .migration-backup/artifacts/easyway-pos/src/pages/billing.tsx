import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { 
  useListProducts, 
  useListCategories,
  useCreateBill,
  getListProductsQueryKey,
  getListCategoriesQueryKey,
  BillItemInput,
  BillInputPaymentMethod
} from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SearchX, Star, Plus, Minus, Trash2, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem extends BillItemInput {
  id: string;
}

export default function Billing() {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<BillInputPaymentMethod>("cash");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successTotal, setSuccessTotal] = useState(0);
  const [cartExpanded, setCartExpanded] = useState(false);

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const { data: products } = useListProducts(
    { search: search || undefined, categoryId: activeCategoryId || undefined },
    { query: { queryKey: getListProductsQueryKey({ search: search || undefined, categoryId: activeCategoryId || undefined }) } }
  );

  const createBill = useCreateBill();

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount);

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: Math.random().toString(),
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: 1
      }];
    });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod("cash");
    setCartExpanded(false);
  };

  const handleCompleteBill = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    createBill.mutate({
      data: {
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentMethod,
        discount: discount > 0 ? discount : undefined,
        cashAmount: paymentMethod === "cash" ? total : undefined,
        upiAmount: paymentMethod === "upi" ? total : undefined,
        cardAmount: paymentMethod === "card" ? total : undefined,
      }
    }, {
      onSuccess: (res) => {
        setSuccessTotal(res.total);
        setIsSuccess(true);
        clearCart();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => setIsSuccess(false), 2500);
      },
      onError: (err) => {
        toast.error("Failed to create bill: " + ((err as any)?.error || "Unknown error"));
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-primary flex flex-col items-center justify-center text-primary-foreground">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white/20 p-6 rounded-full mb-8 backdrop-blur-md"
        >
          <CheckCircle2 className="w-24 h-24 text-white" />
        </motion.div>
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-4xl font-bold mb-2">
          Bill Created!
        </motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl opacity-90 font-medium">
          ₹{successTotal.toFixed(2)}
        </motion.p>
      </div>
    );
  }

  return (
    <AppLayout>
      <TopBar title="New Bill" />
      
      {/* Full-height flex column that never overflows — cart is part of the flow */}
      <div className="flex flex-col h-[calc(100dvh-56px-64px)] overflow-hidden">

        {/* ── Products Section (takes remaining space, scrolls internally) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-background">
          {/* Sticky search + category bar */}
          <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-background/90 backdrop-blur-md px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-9 bg-card border-border rounded-xl h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
              <button
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategoryId === null 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card text-foreground border border-border hover:bg-muted"
                )}
                onClick={() => setActiveCategoryId(null)}
              >All</button>
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategoryId === cat.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card text-foreground border border-border hover:bg-muted"
                  )}
                  onClick={() => setActiveCategoryId(cat.id)}
                >{cat.name}</button>
              ))}
            </div>
          </div>

          <div className="p-4 grid grid-cols-3 gap-2.5">
            {products?.map(product => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddToCart(product)}
                className="bg-card rounded-2xl p-2.5 border border-border shadow-sm flex flex-col text-left relative overflow-hidden"
              >
                {product.isFavorite && (
                  <div className="absolute top-1.5 right-1.5 text-amber-500 z-10">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}
                <div className="w-full aspect-square bg-muted rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                      {product.name.substring(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-xs line-clamp-1 leading-tight">{product.name}</h3>
                <p className="text-primary font-bold text-xs mt-0.5">₹{product.price.toFixed(0)}</p>

                {/* In-cart indicator */}
                {cart.find(c => c.productId === product.id) && (
                  <>
                    <div className="absolute inset-0 bg-primary/5 border-2 border-primary rounded-2xl pointer-events-none" />
                    <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">
                      {cart.find(c => c.productId === product.id)?.quantity}
                    </div>
                  </>
                )}
              </motion.button>
            ))}
            {products?.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center text-center">
                <SearchX className="w-12 h-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Cart Section (flex-shrink-0 — never overlaps products) ── */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="flex-shrink-0 bg-card border-t border-border shadow-[0_-6px_24px_rgba(0,0,0,0.08)] flex flex-col"
              style={{ maxHeight: "56vh" }}
            >
              {/* Cart header — always visible */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border"
                onClick={() => setCartExpanded(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    Cart ({cart.reduce((a, b) => a + b.quantity, 0)} items)
                  </span>
                  <span className="text-muted-foreground text-sm">·</span>
                  <span className="text-primary font-black text-base">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); clearCart(); }}
                    className="text-destructive text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                  {cartExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expandable cart items list */}
              <AnimatePresence>
                {cartExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-y-auto"
                    style={{ maxHeight: "22vh" }}
                  >
                    <div className="p-3 space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-muted/50 px-3 py-2 rounded-xl border border-border/50">
                          <span className="flex-1 font-medium text-foreground text-sm truncate">{item.productName}</span>
                          <span className="text-muted-foreground text-sm font-mono">₹{item.unitPrice}</span>
                          <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                            <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-md" onClick={() => updateQuantity(item.id, -1)}>
                              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5" />}
                            </button>
                            <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                            <button className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-md" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold w-14 text-right">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Totals + payment + complete — always visible */}
              <div className="px-4 py-3 bg-muted/20 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Subtotal <span className="text-foreground font-medium">₹{subtotal.toFixed(0)}</span></span>
                  <span className="text-xl font-black text-primary">Total ₹{total.toFixed(0)}</span>
                </div>

                <div className="flex gap-2 mb-3">
                  {(["cash", "upi", "card", "split"] as BillInputPaymentMethod[]).map(method => (
                    <button
                      key={method}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-colors border",
                        paymentMethod === method
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      )}
                      onClick={() => setPaymentMethod(method)}
                    >{method}</button>
                  ))}
                </div>

                <Button 
                  className="w-full h-12 rounded-xl text-base font-bold shadow-md bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={handleCompleteBill}
                  disabled={createBill.isPending}
                >
                  {createBill.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Bill"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
