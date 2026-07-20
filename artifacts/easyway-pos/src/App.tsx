import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AuthGuard } from '@/components/auth/AuthGuard';
import Login from '@/pages/login';
import Home from '@/pages/home';
import Billing from '@/pages/billing';
import Products from '@/pages/products';
import AddProduct from '@/pages/products/add';
import EditProduct from '@/pages/products/edit';
import Bills from '@/pages/bills';
import ReceiptView from '@/pages/receipt';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/billing" component={Billing} />
        <Route path="/products" component={Products} />
        <Route path="/products/add" component={AddProduct} />
        <Route path="/products/edit/:id" component={EditProduct} />
        <Route path="/bills" component={Bills} />
        <Route path="/receipt/:id" component={ReceiptView} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AuthGuard>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppRouter />
          </WouterRouter>
          <Toaster position="top-center" richColors theme="system" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
