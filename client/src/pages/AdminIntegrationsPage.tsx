import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  CreditCard,
  Mail,
  MessageSquare,
  Phone,
  BarChart3,
  Shield,
  ExternalLink,
} from "lucide-react";

interface IntegrationStatus {
  vendor: string;
  status: "live" | "error" | "unconfigured";
  message: string;
  checkedAt: string;
}

interface StatusResponse {
  status: IntegrationStatus[];
  checkedAt: string;
}

const VENDOR_META: Record<string, { icon: React.ElementType; category: string; envVars?: string[] }> = {
  "Stripe": { icon: CreditCard, category: "Payments", envVars: ["STRIPE_SECRET_KEY", "VITE_STRIPE_PUBLISHABLE_KEY"] },
  "Klaviyo": { icon: Mail, category: "Marketing Email", envVars: ["KLAVIYO_API_KEY"] },
  "Twilio": { icon: Phone, category: "SMS", envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"] },
  "Resend": { icon: Mail, category: "Transactional Email", envVars: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"] },
  "HushMail SMTP": { icon: Shield, category: "PHI Email", envVars: ["HUSHMAIL_SMTP_HOST", "HUSHMAIL_SMTP_USER", "HUSHMAIL_SMTP_PASS"] },
  "Google Tag Manager": { icon: BarChart3, category: "Analytics", envVars: ["VITE_GTM_ID"] },
  "GA4": { icon: BarChart3, category: "Analytics", envVars: ["VITE_GA4_MEASUREMENT_ID"] },
  "Meta Pixel": { icon: Zap, category: "Ad Tracking", envVars: ["VITE_META_PIXEL_ID"] },
  "Reddit Pixel": { icon: MessageSquare, category: "Ad Tracking", envVars: ["VITE_REDDIT_PIXEL_ID"] },
};

function StatusBadge({ status }: { status: "live" | "error" | "unconfigured" }) {
  if (status === "live") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0" data-testid="badge-status-live">
        <CheckCircle className="h-3 w-3 mr-1" />
        Live
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0" data-testid="badge-status-error">
        <XCircle className="h-3 w-3 mr-1" />
        Error
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0" data-testid="badge-status-unconfigured">
      <AlertCircle className="h-3 w-3 mr-1" />
      Unconfigured
    </Badge>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

export default function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [recheckVendor, setRecheckVendor] = useState<string | null>(null);

  const { data, isLoading, dataUpdatedAt } = useQuery<StatusResponse>({
    queryKey: ["/api/admin/integrations/status"],
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const recheckMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/integrations/status", { credentials: "include" });
      if (!r.ok) throw new Error("Status check failed");
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/admin/integrations/status"], data);
    },
    onSettled: () => setRecheckVendor(null),
  });

  const statuses = data?.status ?? [];
  const liveCount = statuses.filter((s) => s.status === "live").length;
  const errorCount = statuses.filter((s) => s.status === "error").length;
  const unconfiguredCount = statuses.filter((s) => s.status === "unconfigured").length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="h-9 w-64 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-testid="page-admin-integrations">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Integration Status</h1>
          <p className="text-muted-foreground">Real-time health checks for all vendor integrations</p>
        </div>
        <Button
          onClick={() => recheckMutation.mutate()}
          disabled={recheckMutation.isPending}
          data-testid="button-run-all-checks"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${recheckMutation.isPending ? "animate-spin" : ""}`} />
          {recheckMutation.isPending ? "Checking..." : "Run All Checks"}
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Live</p>
              <p className="text-xl font-bold text-green-700" data-testid="metric-live-count">{liveCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Error</p>
              <p className="text-xl font-bold text-red-600" data-testid="metric-error-count">{errorCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unconfigured</p>
              <p className="text-xl font-bold text-yellow-600" data-testid="metric-unconfigured-count">{unconfiguredCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {dataUpdatedAt ? (
        <p className="text-xs text-muted-foreground">
          Last checked: {formatTime(new Date(dataUpdatedAt).toISOString())}
        </p>
      ) : null}

      {/* Vendor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statuses.map((item) => {
          const meta = VENDOR_META[item.vendor];
          const Icon = meta?.icon ?? ExternalLink;
          const isReChecking = recheckVendor === item.vendor && recheckMutation.isPending;

          return (
            <Card
              key={item.vendor}
              className={item.status === "error" ? "border-red-300 dark:border-red-700" : item.status === "unconfigured" ? "border-yellow-300 dark:border-yellow-700" : ""}
              data-testid={`card-integration-${item.vendor.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${item.status === "live" ? "bg-green-100" : item.status === "error" ? "bg-red-100" : "bg-yellow-100"}`}>
                      <Icon className={`h-4 w-4 ${item.status === "live" ? "text-green-700" : item.status === "error" ? "text-red-600" : "text-yellow-600"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{item.vendor}</CardTitle>
                      {meta?.category && (
                        <p className="text-xs text-muted-foreground">{meta.category}</p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-xs leading-relaxed">{item.message}</CardDescription>
                {meta?.envVars && item.status === "unconfigured" && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="font-medium text-foreground">Required vars:</p>
                    {meta.envVars.map((v) => (
                      <code key={v} className="block font-mono text-[10px] bg-muted px-1 rounded">{v}</code>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">{formatTime(item.checkedAt)}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={recheckMutation.isPending}
                    onClick={() => {
                      setRecheckVendor(item.vendor);
                      recheckMutation.mutate();
                    }}
                    data-testid={`button-recheck-${item.vendor.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isReChecking ? "animate-spin" : ""}`} />
                    Re-check
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {statuses.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No integration data available. Click "Run All Checks" to start.</p>
        </div>
      )}
    </div>
  );
}
