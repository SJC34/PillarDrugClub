import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import MedicationsPage from "@/pages/MedicationsPage";
import MedicationDetailsPage from "@/pages/MedicationDetailsPage";
import CostCalculatorPage from "@/pages/CostCalculatorPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import DashboardPage from "@/pages/DashboardPage";
import PrescriptionTransferPage from "@/pages/PrescriptionTransferPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/subscribe" component={SubscriptionPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/medications" component={MedicationsPage} />
      <Route path="/medications/:id" component={MedicationDetailsPage} />
      <Route path="/cost-calculator" component={CostCalculatorPage} />
      <Route path="/prescription-transfer" component={PrescriptionTransferPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
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
