import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import BillingPage from "@/pages/billing";
import Dashboard from "@/pages/dashboard";
import PurchasePage from "@/pages/purchase";
import PurchaseCreatePage from "@/pages/purchase-create";
import NotFound from "@/pages/not-found";
import { FileText, LayoutDashboard, ShoppingBag } from "lucide-react";

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex gap-4">
        <Link href="/">
          <Button 
            variant={location === "/" ? "default" : "ghost"} 
            className="flex items-center gap-2"
            data-testid="nav-billing"
          >
            <FileText className="h-4 w-4" />
            Create Bill
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button 
            variant={location === "/dashboard" ? "default" : "ghost"} 
            className="flex items-center gap-2"
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/purchase">
          <Button 
            variant={location === "/purchase" ? "default" : "ghost"} 
            className="flex items-center gap-2"
            data-testid="nav-purchase"
          >
            <ShoppingBag className="h-4 w-4" />
            Purchase Bills
          </Button>
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={BillingPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/purchase" component={PurchasePage} />
        <Route path="/purchase/create" component={PurchaseCreatePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
