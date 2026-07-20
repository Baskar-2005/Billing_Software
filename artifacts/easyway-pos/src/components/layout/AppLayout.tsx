import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col">
      <main className={cn("flex-1 w-full max-w-screen-md mx-auto flex flex-col", !hideNav && "pb-24")}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

// Ensure cn is imported
import { cn } from "@/lib/utils";
