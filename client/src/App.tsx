import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ConnectionProvider } from "@/components/ConnectionProvider";
import ConnectionStatus from "@/components/ConnectionStatus";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/category/:name" component={CategoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Mark app as loaded after component mounts
  useEffect(() => {
    // Hide the loading screen
    if (typeof window !== 'undefined' && (window as any).appLoaded) {
      (window as any).appLoaded();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ConnectionStatus />
          </TooltipProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
