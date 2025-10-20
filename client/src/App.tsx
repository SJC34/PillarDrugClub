import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import MedicationsPage from "@/pages/MedicationsPage";
import MedicationDetailsPage from "@/pages/MedicationDetailsPage";
import MyMedicationsPage from "@/pages/MyMedicationsPage";
import CostCalculatorPage from "@/pages/CostCalculatorPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import DashboardPage from "@/pages/DashboardPage";
import PrescriptionRequestPage from "@/pages/PrescriptionRequestPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPortalPage from "@/pages/AdminPortalPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminFinancialPage from "@/pages/AdminFinancialPage";
import AdminCommunicationsPage from "@/pages/AdminCommunicationsPage";
import AdminReportsPage from "@/pages/AdminReportsPage";
import AdminMedicationPricingPage from "@/pages/AdminMedicationPricingPage";
import AdminReferralsPage from "@/pages/AdminReferralsPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import OrdersPage from "@/pages/OrdersPage";
import ShipmentTrackingPage from "@/pages/ShipmentTrackingPage";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import RefillsPage from "@/pages/RefillsPage";
import RefillHistoryPage from "@/pages/RefillHistoryPage";
import ReferralsPage from "@/pages/ReferralsPage";
import CancelSubscriptionPage from "@/pages/CancelSubscriptionPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";
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
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/financial" component={AdminFinancialPage} />
      <Route path="/admin/communications" component={AdminCommunicationsPage} />
      <Route path="/admin/reports" component={AdminReportsPage} />
      <Route path="/admin/pricing" component={AdminMedicationPricingPage} />
      <Route path="/admin/referrals" component={AdminReferralsPage} />
      <Route path="/medications" component={MedicationsPage} />
      <Route path="/medications/my-list" component={MyMedicationsPage} />
      <Route path="/medications/:id" component={MedicationDetailsPage} />
      <Route path="/cost-calculator" component={CostCalculatorPage} />
      <Route path="/prescription-request" component={PrescriptionRequestPage} />
      <Route path="/prescriptions" component={PrescriptionsPage} />
      <Route path="/refills" component={RefillsPage} />
      <Route path="/refills/history" component={RefillHistoryPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/cancel-subscription" component={CancelSubscriptionPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
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
