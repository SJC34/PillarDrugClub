import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { Switch, Route } from "wouter";
import PreLaunchPage from "@/pages/PreLaunchPage";
import LoginPage from "@/pages/LoginPage";

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Switch>
                <Route path="/" component={PreLaunchPage} />
                <Route path="/login" component={LoginPage} />
                <Route component={PreLaunchPage} />
              </Switch>
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
