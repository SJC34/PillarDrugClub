import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ComingSoonPage from "@/pages/ComingSoonPage";
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
import AdminBlogPage from "@/pages/AdminBlogPage";
import AdminContentAutomationPage from "@/pages/AdminContentAutomationPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
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
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import PriceBanner from "@/components/PriceBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/coming-soon" component={ComingSoonPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/subscribe" component={SubscriptionPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/admin-portal">
        <ProtectedRoute requiredRole="admin"><AdminPortalPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute requiredRole="admin"><AdminDashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin"><AdminUsersPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <ProtectedRoute requiredRole="admin"><AdminFinancialPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/communications">
        <ProtectedRoute requiredRole="admin"><AdminCommunicationsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute requiredRole="admin"><AdminReportsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/pricing">
        <ProtectedRoute requiredRole="admin"><AdminMedicationPricingPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/referrals">
        <ProtectedRoute requiredRole="admin"><AdminReferralsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/blog">
        <ProtectedRoute requiredRole="admin"><AdminBlogPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/automation">
        <ProtectedRoute requiredRole="admin"><AdminContentAutomationPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/content-automation">
        <ProtectedRoute requiredRole="admin"><AdminContentAutomationPage /></ProtectedRoute>
      </Route>
      <Route path="/medications" component={MedicationsPage} />
      <Route path="/medications/my-list" component={MyMedicationsPage} />
      <Route path="/medications/:id" component={MedicationDetailsPage} />
      <Route path="/cost-calculator" component={CostCalculatorPage} />
      <Route path="/prescription-request">
        <ProtectedRoute><PrescriptionRequestPage /></ProtectedRoute>
      </Route>
      <Route path="/prescriptions" component={PrescriptionsPage} />
      <Route path="/refills" component={RefillsPage} />
      <Route path="/refills/history" component={RefillHistoryPage} />
      <Route path="/referrals">
        <ProtectedRoute><ReferralsPage /></ProtectedRoute>
      </Route>
      <Route path="/cancel-subscription" component={CancelSubscriptionPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
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

function AppContent() {
  const [location] = useLocation();
  const isComingSoonPage = location === "/coming-soon";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isComingSoonPage && <PriceBanner />}
      {!isComingSoonPage && <Header />}
      <main className="flex-1">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
