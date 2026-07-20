import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAuthStatus, getGetAuthStatusQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [location, setLocation] = useLocation();
  const { data: auth, isLoading } = useGetAuthStatus({ 
    query: {
      queryKey: getGetAuthStatusQueryKey(),
      retry: false
    }
  });

  useEffect(() => {
    if (!isLoading && !auth?.authenticated && location !== "/login") {
      setLocation("/login");
    }
  }, [auth, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth?.authenticated && location !== "/login") {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
