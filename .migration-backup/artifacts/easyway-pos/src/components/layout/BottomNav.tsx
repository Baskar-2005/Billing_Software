import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, ReceiptText, LayoutGrid, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Billing", href: "/billing", icon: ReceiptText },
    { name: "Products", href: "/products", icon: LayoutGrid },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2 bg-background/80 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = location === tab.href || 
            (tab.href !== "/" && location.startsWith(tab.href));

          const Icon = tab.icon;

          return (
            <Link key={tab.href} href={tab.href}>
              <div
                className="relative flex flex-col items-center justify-center w-16 h-full cursor-pointer select-none no-underline tap-highlight-transparent"
                data-testid={`nav-tab-${tab.name.toLowerCase()}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-6 h-6 z-10 transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium z-10 mt-1 transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
