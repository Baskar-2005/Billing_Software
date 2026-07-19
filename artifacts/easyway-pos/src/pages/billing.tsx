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
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SearchX, Star, Plus, Minus, X, Trash2, CheckCircle2, Loader2 } from "lucide-react";
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
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
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
  };

  const handleCompleteBill = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

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
        
        // Success haptic
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 2500);
      },
      onError: (err) => {
        toast.error("Failed to create bill: " + (err?.error || "Unknown error"));
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
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold mb-2"
        >
          Bill Created!
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl opacity-90 font-medium"
        >
          ₹{successTotal.toFixed(2)}
        </motion.p>
      </div>
    );
  }

  return (
    <AppLayout hideNav>
      <TopBar title="New Bill" />
      
      <div className="flex flex-col h-[calc(100dvh-64px)]">
        {/* Products Section - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background pb-32">
          
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
              >
                All
              </button>
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
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products?.map(product => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddToCart(product)}
                className="bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col text-left relative overflow-hidden"
              >
                {product.isFavorite && (
                  <div className="absolute top-2 right-2 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                )}
                <div className="w-full aspect-square bg-muted rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {product.name.substring(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</h3>
                <p className="text-primary font-bold text-sm mt-1">₹{product.price.toFixed(2)}</p>
                
                {/* Overlay indicating it's in cart */}
                {cart.find(c => c.productId === product.id) && (
                  <div className="absolute inset-0 bg-primary/5 border-2 border-primary rounded-2xl pointer-events-none" />
                )}
                {cart.find(c => c.productId === product.id) && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
                    {cart.find(c => c.productId === product.id)?.quantity}
                  </div>
                )}
              </motion.button>
            ))}
            
            {products?.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center text-center">
                <SearchX className="w-12 h-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground">Try a different search term</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Bottom Sheet (always visible when items exist) */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 max-w-screen-md mx-auto bg-card rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-border z-40 flex flex-col max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto my-3" />
              
              <div className="px-5 pb-2 flex items-center justify-between border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Current Bill ({cart.length})</h2>
                <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={clearCart}>
                  <Trash2 className="w-4 h-4 mr-1" /> Clear
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/50 p-3 rounded-xl border border-border/50">
                    <div className="flex-1 flex justify-between sm:justify-start sm:gap-4">
                      <span className="font-medium text-foreground line-clamp-1">{item.productName}</span>
                      <span className="text-muted-foreground font-mono">₹{item.unitPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between sm:w-auto sm:gap-4">
                      <span className="font-bold text-foreground min-w-[60px]">
                        ₹{(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
                        <button 
                          className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-md transition-colors"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4" />}
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-md transition-colors"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-5 bg-muted/30 border-t border-border mt-auto">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {/* Additional fields could go here (Discount, Tax) */}
                  
                  <div className="flex justify-between items-end pt-2 border-t border-border">
                    <span className="text-lg font-medium text-foreground">Total</span>
                    <span className="text-3xl font-black text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(["cash", "upi", "card", "split"] as BillInputPaymentMethod[]).map(method => (
                    <button
                      key={method}
                      className={cn(
                        "py-2 rounded-xl text-sm font-semibold capitalize transition-colors border",
                        paymentMethod === method 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-card text-foreground border-border hover:bg-muted"
                      )}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                
                <Button 
                  className="w-full h-14 rounded-xl text-lg font-bold shadow-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  onClick={handleCompleteBill}
                  disabled={createBill.isPending}
                >
                  {createBill.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Bill"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small floating cart indicator if cart is not expanded completely, though in this design we always show it when items > 0 */}
      </div>
    </AppLayout>
  );
}
