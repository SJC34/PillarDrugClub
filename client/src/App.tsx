import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import AdminErrorBoundary from "@/components/AdminErrorBoundary";
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
import AdminMarketingPage from "@/pages/AdminMarketingPage";
import AdminFulfillmentPage from "@/pages/AdminFulfillmentPage";
import AdminCSPage from "@/pages/AdminCSPage";
import AdminIntegrationsPage from "@/pages/AdminIntegrationsPage";
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
import FAQPage from "@/pages/FAQPage";
import PharmacyMembershipVsGoodRxPage from "@/pages/PharmacyMembershipVsGoodRxPage";
import ScriptCoAlternativePage from "@/pages/ScriptCoAlternativePage";
import ReviewerAccessPage from "@/pages/ReviewerAccessPage";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import PriceBanner from "@/components/PriceBanner";
import { trackPageView } from "@/hooks/useAnalytics";

function withAdminLayout(page: React.ReactNode, fallbackTitle?: string) {
  return (
    <AdminLayout>
      <AdminErrorBoundary fallbackTitle={fallbackTitle}>
        {page}
      </AdminErrorBoundary>
    </AdminLayout>
  );
}

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
      <Route path="/my-medications">
        <ProtectedRoute><MyMedicationsPage /></ProtectedRoute>
      </Route>

      {/* Admin routes — all wrapped in AdminLayout + ErrorBoundary */}
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminDashboardPage />, "Dashboard Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin-portal">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminPortalPage />, "Portal Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminDashboardPage />, "Dashboard Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminUsersPage />, "Users Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/financial">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminFinancialPage />, "Financial Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/communications">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminCommunicationsPage />, "Communications Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminReportsPage />, "Reports Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/pricing">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminMedicationPricingPage />, "Pricing Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/referrals">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminReferralsPage />, "Referrals Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/blog">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminBlogPage />, "Blog Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/marketing">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminMarketingPage />, "Marketing Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/fulfillment">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminFulfillmentPage />, "Fulfillment Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/cs">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminCSPage />, "CS Error")}
        </ProtectedRoute>
      </Route>
      <Route path="/admin/integrations">
        <ProtectedRoute requiredRole="admin">
          {withAdminLayout(<AdminIntegrationsPage />, "Integrations Error")}
        </ProtectedRoute>
      </Route>

      <Route path="/medications" component={MedicationsPage} />
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
      <Route path="/faq" component={FAQPage} />
      <Route path="/pharmacy-membership-vs-goodrx" component={PharmacyMembershipVsGoodRxPage} />
      <Route path="/scriptco-alternative" component={ScriptCoAlternativePage} />
      <Route path="/reviewer-access" component={ReviewerAccessPage} />
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
  const isAdminPage = location === "/admin" || location.startsWith("/admin/") || location === "/admin-portal";

  // Fire page-view analytics on every route change
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isComingSoonPage && !isAdminPage && <PriceBanner />}
      {!isComingSoonPage && !isAdminPage && <Header />}
      <main className={isAdminPage ? "h-screen overflow-y-auto" : "flex-1"}>
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
