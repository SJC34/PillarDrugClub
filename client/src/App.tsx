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
import SettingsPage from "@/pages/SettingsPage";
import AdminPortalPage from "@/pages/AdminPortalPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import OrdersPage from "@/pages/OrdersPage";
import ShipmentTrackingPage from "@/pages/ShipmentTrackingPage";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import RefillsPage from "@/pages/RefillsPage";
import RefillHistoryPage from "@/pages/RefillHistoryPage";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import PriceBanner from "@/components/PriceBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/subscribe" component={SubscriptionPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin-portal" component={AdminPortalPage} />
      <Route path="/admin/dashboard" component={AdminDashboardPage} />
      <Route path="/medications" component={MedicationsPage} />
      <Route path="/medications/:id" component={MedicationDetailsPage} />
      <Route path="/cost-calculator" component={CostCalculatorPage} />
      <Route path="/prescription-transfer" component={PrescriptionTransferPage} />
      <Route path="/prescriptions" component={PrescriptionsPage} />
      <Route path="/refills" component={RefillsPage} />
      <Route path="/refills/history" component={RefillHistoryPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:id" component={OrderDetailsPage} />
      <Route path="/tracking/:trackingNumber" component={ShipmentTrackingPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <PriceBanner />
          <Header />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
