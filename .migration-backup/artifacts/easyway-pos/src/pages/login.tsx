import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetAuthStatus } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Moon, Sun, Loader2, Delete } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Login() {
  const [pin, setPin] = useState("");
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const { data: auth, isLoading: authLoading } = useGetAuthStatus();
  const login = useLogin();

  useEffect(() => {
    if (auth?.authenticated) {
      setLocation("/");
    }
  }, [auth, setLocation]);

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 6) {
      login.mutate({ data: { pin } }, {
        onSuccess: (res) => {
          if (res.authenticated) {
            toast.success("Welcome back!");
            setLocation("/");
          } else {
            toast.error("Invalid PIN");
            setPin("");
          }
        },
        onError: () => {
          toast.error("Invalid PIN");
          setPin("");
        }
      });
    }
  }, [pin, login, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-between bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-br from-primary/20 to-secondary/5 blur-3xl rounded-[100%] z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-gradient-to-tl from-accent/20 to-transparent blur-3xl rounded-[100%] z-0 pointer-events-none" />

      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-background/50 backdrop-blur-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <motion.div 
        className="w-full max-w-sm flex-1 flex flex-col items-center justify-center px-6 z-10 pt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <Coffee className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">EasyWay POS</h1>
        <p className="text-muted-foreground font-medium mb-12">Tea Shop Billing</p>

        <div className="flex gap-4 mb-10 h-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-300",
                pin.length > i 
                  ? "bg-primary scale-100" 
                  : "bg-border scale-75"
              )}
              animate={pin.length === i ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: pin.length === i ? Infinity : 0, duration: 1.5 }}
            />
          ))}
        </div>

        <div className="w-full max-w-[280px] grid grid-cols-3 gap-x-6 gap-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <motion.button
              key={digit}
              whileTap={{ scale: 0.9, backgroundColor: "hsl(var(--primary) / 0.2)" }}
              onClick={() => handlePinPress(digit.toString())}
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold text-foreground bg-card shadow-sm border border-border mx-auto"
            >
              {digit}
            </motion.button>
          ))}
          <div />
          <motion.button
            whileTap={{ scale: 0.9, backgroundColor: "hsl(var(--primary) / 0.2)" }}
            onClick={() => handlePinPress("0")}
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-semibold text-foreground bg-card shadow-sm border border-border mx-auto"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9, backgroundColor: "hsl(var(--destructive) / 0.2)" }}
            onClick={handleBackspace}
            disabled={pin.length === 0}
            className="w-20 h-20 rounded-full flex items-center justify-center text-foreground bg-card shadow-sm border border-border mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Delete className="w-7 h-7" />
          </motion.button>
        </div>

        <AnimatePresence>
          {login.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-center gap-2 text-primary font-medium"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
