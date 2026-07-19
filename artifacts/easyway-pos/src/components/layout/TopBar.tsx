import { useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { useLogout, useGetAuthStatus } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function TopBar({ title, showBack, onBack, rightAction }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const { data: authStatus } = useGetAuthStatus();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/login");
        toast.success("Logged out successfully");
      },
    });
  };

  return (
    <div className="sticky top-0 z-40 w-full px-4 h-16 flex items-center justify-between glass shadow-sm">
      <div className="flex items-center gap-3">
        {showBack && onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        ) : (
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {title || authStatus?.shopName || "EasyWay POS"}
            </h1>
            <p className="text-xs font-medium text-muted-foreground">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {rightAction}
        {!rightAction && (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
