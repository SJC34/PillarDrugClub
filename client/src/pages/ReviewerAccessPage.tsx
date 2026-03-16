import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  ClipboardCopy, 
  CheckCircle, 
  ExternalLink,
  FileText,
  ShoppingCart,
  Pill,
  Calculator,
  User,
  ArrowRight,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ReviewerAccessPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reviewerCreds, setReviewerCreds] = useState<{ email: string; password: string } | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { toast } = useToast();
  const { user, login } = useAuth();

  useEffect(() => {
    fetch("/api/reviewer-credentials")
      .then(res => {
        if (!res.ok) {
          setAccessDenied(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setReviewerCreds(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setAccessDenied(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (shouldRedirect && user) {
      setLocation("/dashboard");
      setShouldRedirect(false);
    }
  }, [shouldRedirect, user, setLocation]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied",
        description: `${field} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually",
        variant: "destructive",
      });
    }
  };

  const handleQuickLogin = async () => {
    if (!reviewerCreds) return;
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: reviewerCreds.email, password: reviewerCreds.password }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error - please try again later");
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }

      login(result.user);
      toast({
        title: "Login Successful",
        description: "Welcome to the LegitScript review account",
      });
      setShouldRedirect(true);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Could not log in with reviewer credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const reviewSteps = [
    {
      title: "Member Dashboard",
      description: "View the authenticated member experience including prescription history, order tracking, and account management.",
      icon: User,
      path: "/dashboard",
    },
    {
      title: "Medication Catalog",
      description: "Browse the full generic medication catalog with wholesale pricing. All medications require a valid prescription.",
      icon: Pill,
      path: "/medications",
    },
    {
      title: "Cost Calculator",
      description: "Compare Pillar Drug Club wholesale prices against typical retail pharmacy pricing.",
      icon: Calculator,
      path: "/cost-calculator",
    },
    {
      title: "Prescription Request Flow",
      description: "Review the prescription request workflow. Requests generate a PDF faxed to the prescribing physician for authorization.",
      icon: FileText,
      path: "/prescription-request",
    },
    {
      title: "Checkout Process",
      description: "Review the order placement flow including shipping address collection and $5 flat-rate shipping disclosure.",
      icon: ShoppingCart,
      path: "/checkout",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (accessDenied || !reviewerCreds) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" data-testid="page-reviewer-denied">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Restricted</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Reviewer access is not available in this environment. Please contact the site administrator.
          </p>
          <Link href="/">
            <Button variant="outline" data-testid="button-go-home">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12" data-testid="page-reviewer-access">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-reviewer-title">
            LegitScript Reviewer Access
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            This page provides reviewer credentials and a guided walkthrough of the Pillar Drug Club platform for LegitScript certification review.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Important Reviewer Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Pillar Drug Club is a <strong>membership-based pharmacy purchasing service</strong> ($99/year). We do not dispense medications directly.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>All prescription medications require a valid prescription from a licensed prescriber. No medications are dispensed without physician authorization.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Fulfillment is handled by <strong>HealthWarehouse</strong> (VIPPS-accredited, LegitScript-certified, DEA-licensed mail-order pharmacy).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>We only offer <strong>FDA-approved generic medications</strong>. No controlled substances, compounded drugs, or imported medications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Shipping is $5 flat-rate per order via USPS/UPS within the United States only.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reviewer Credentials</CardTitle>
            <CardDescription>
              Use these credentials to log in and explore the full member experience. This account has an active membership with sample prescription and order data pre-loaded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={reviewerCreds.email}
                  className="font-mono bg-gray-50 dark:bg-gray-800"
                  data-testid="input-reviewer-email"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(reviewerCreds.email, "Email")}
                  data-testid="button-copy-email"
                >
                  {copiedField === "Email" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    type={showPassword ? "text" : "password"}
                    value={reviewerCreds.password}
                    className="font-mono bg-gray-50 dark:bg-gray-800 pr-10"
                    data-testid="input-reviewer-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(reviewerCreds.password, "Password")}
                  data-testid="button-copy-password"
                >
                  {copiedField === "Password" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardCopy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleQuickLogin}
                disabled={isLoggingIn}
                className="flex-1"
                data-testid="button-quick-login"
              >
                {isLoggingIn ? "Logging in..." : "Quick Login as Reviewer"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Link href="/login">
                <Button variant="outline" className="w-full" data-testid="button-manual-login">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Login Page
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Suggested Review Walkthrough</CardTitle>
            <CardDescription>
              After logging in, visit these sections to review the complete member experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Link key={step.path} href={step.path}>
                    <div
                      className="flex items-start gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                      data-testid={`link-review-step-${index}`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{step.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{step.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pre-loaded Test Data</CardTitle>
            <CardDescription>
              The reviewer account includes the following sample data for a realistic review experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">Account Details</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Active $99/year membership</li>
                  <li>Member for ~90 days</li>
                  <li>Drug allergies: Penicillin, Sulfa</li>
                  <li>Primary doctor on file</li>
                  <li>Shipping address on file</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">Prescription & Order History</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>2 prescription requests (1 confirmed, 1 pending)</li>
                  <li>2 orders (1 delivered, 1 processing)</li>
                  <li>Lisinopril 10mg, Metformin 500mg, Atorvastatin 20mg</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions about this review? Contact{" "}
            <a href="mailto:seth@pharmacyautopilot.com" className="text-blue-600 hover:underline">
              seth@pharmacyautopilot.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
