import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout hideNav>
      <TopBar title="Page Not Found" showBack onBack={() => window.history.back()} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[calc(100dvh-64px)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-12 h-12 text-destructive" />
        </motion.div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-foreground mb-2"
        >
          404
        </motion.h1>
        
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground mb-8 max-w-xs mx-auto"
        >
          The page you are looking for doesn't exist or has been moved.
        </motion.p>
        
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/">
            <Button className="rounded-xl h-12 px-6 gap-2">
              <Home className="w-5 h-5" /> Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
