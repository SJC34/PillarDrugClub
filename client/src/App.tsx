import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PortalNav from "@/components/PortalNav";
import HomePage from "@/pages/HomePage";
import MedicationsPage from "@/pages/MedicationsPage";
import MedicationDetailsPage from "@/pages/MedicationDetailsPage";
import CostCalculatorPage from "@/pages/CostCalculatorPage";
import ClientPortalPage from "@/pages/ClientPortalPage";
import BrokerPortalPage from "@/pages/BrokerPortalPage";
import CompanyPortalPage from "@/pages/CompanyPortalPage";
import AdminPortalPage from "@/pages/AdminPortalPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PortalNav} />
      <Route path="/home" component={HomePage} />
      <Route path="/medications" component={MedicationsPage} />
      <Route path="/medications/:id" component={MedicationDetailsPage} />
      <Route path="/calculator" component={CostCalculatorPage} />
      <Route path="/client" component={ClientPortalPage} />
      <Route path="/broker" component={BrokerPortalPage} />
      <Route path="/company" component={CompanyPortalPage} />
      <Route path="/admin" component={AdminPortalPage} />
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
