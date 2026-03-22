import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageSquare,
  Ticket,
  Star,
  Info,
  RefreshCw,
  Wifi,
  WifiOff,
  PenLine,
} from "lucide-react";

const LS_KEY = "admin_cs_v1";

interface CSState {
  chatbotConversations: string;
  chatbotResolutionRate: string;
  chatbotEscalationRate: string;
  openTickets: string;
  csatScore: string;
  retellOverrideCallVolume: string;
  retellOverrideAvgHandleTime: string;
  retellOverrideMissedCalls: string;
}

const DEFAULT_STATE: CSState = {
  chatbotConversations: "",
  chatbotResolutionRate: "",
  chatbotEscalationRate: "",
  openTickets: "",
  csatScore: "",
  retellOverrideCallVolume: "",
  retellOverrideAvgHandleTime: "",
  retellOverrideMissedCalls: "",
};

function loadState(): CSState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: CSState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

interface MetricInputProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  type?: string;
  suffix?: string;
  onChange: (val: string) => void;
  testId: string;
  disabled?: boolean;
}

function MetricInput({ id, label, hint, value, type = "number", suffix, onChange, testId, disabled }: MetricInputProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          min="0"
          step="0.1"
          placeholder="—"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
          disabled={disabled}
          className={suffix ? "pr-12" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface RetellStatsResponse {
  configured: boolean;
  available?: boolean;
  message?: string;
  callVolume?: number;
  avgHandleTimeMinutes?: number;
  missedCalls?: number;
  periodStart?: string;
  periodEnd?: string;
}

function LiveBadge() {
  return (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">
      <Wifi className="h-2.5 w-2.5 mr-1" />
      Live
    </Badge>
  );
}

function ManualBadge() {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
      <PenLine className="h-3 w-3 flex-shrink-0" />
      Manual input
    </div>
  );
}

export default function AdminCSPage() {
  const [state, setState] = useState<CSState>(loadState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => { setIsHydrated(true); }, []);

  const update = (patch: Partial<CSState>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveState(next);
  };

  const { data: retellStats, isLoading: retellLoading, refetch: refetchRetell, dataUpdatedAt } =
    useQuery<RetellStatsResponse>({
      queryKey: ["/api/admin/retell/stats"],
      retry: 1,
      staleTime: 5 * 60 * 1000,
    });

  const hasLiveRetell = !!retellStats?.configured && !!retellStats?.available;
  const retellNotConfigured = retellStats && !retellStats.configured;

  const callVolumeDisplay = hasLiveRetell
    ? String(retellStats!.callVolume ?? "—")
    : state.retellOverrideCallVolume;

  const avgHandleDisplay = hasLiveRetell
    ? String(retellStats!.avgHandleTimeMinutes ?? "—")
    : state.retellOverrideAvgHandleTime;

  const missedCallsDisplay = hasLiveRetell
    ? String(retellStats!.missedCalls ?? "—")
    : state.retellOverrideMissedCalls;

  const callVolume = parseFloat(callVolumeDisplay) || 0;
  const missedCalls = parseFloat(missedCallsDisplay) || 0;
  const missedRate = callVolume > 0 ? ((missedCalls / callVolume) * 100).toFixed(1) : null;

  const csat = parseFloat(state.csatScore);
  const csatColor =
    isNaN(csat) ? "" :
    csat >= 4.5 ? "text-green-600" :
    csat >= 3.5 ? "text-yellow-600" :
    "text-red-600";

  if (!isHydrated) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="h-9 w-64 bg-muted animate-pulse rounded-md" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded-md" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" data-testid="page-admin-cs">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Service Dashboard</h1>
        <p className="text-muted-foreground">Retell AI phone, chatbot, tickets, and CSAT</p>
      </div>

      {/* Retell AI Phone Line */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Retell AI Phone Line
              </CardTitle>
              <CardDescription>
                {hasLiveRetell
                  ? "Live data from Retell AI API — current month"
                  : retellNotConfigured
                  ? "Retell AI not configured — enter metrics manually below"
                  : "Current-month call metrics"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasLiveRetell && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetchRetell()}
                  disabled={retellLoading}
                  data-testid="button-retell-refresh"
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${retellLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
              {hasLiveRetell ? <LiveBadge /> : <ManualBadge />}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Not configured banner */}
          {retellNotConfigured && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
              <WifiOff className="h-4 w-4 flex-shrink-0" />
              <span>
                Set <code className="font-mono text-[10px] bg-muted px-1 rounded">RETELL_AI_API_KEY</code> and{" "}
                <code className="font-mono text-[10px] bg-muted px-1 rounded">RETELL_AI_PHONE_NUMBER</code> to enable live data.
              </span>
            </div>
          )}

          {/* Live metric display */}
          {hasLiveRetell && !retellLoading && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-md" data-testid="metric-retell-call-volume">
                <p className="text-2xl font-bold">{retellStats!.callVolume ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Calls this month</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-md" data-testid="metric-retell-avg-handle">
                <p className="text-2xl font-bold">{retellStats!.avgHandleTimeMinutes ?? "—"}<span className="text-sm text-muted-foreground ml-1">min</span></p>
                <p className="text-xs text-muted-foreground mt-1">Avg handle time</p>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-md" data-testid="metric-retell-missed">
                <p className={`text-2xl font-bold ${missedRate && parseFloat(missedRate) > 10 ? "text-red-600" : ""}`}>
                  {retellStats!.missedCalls ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Missed calls</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {retellLoading && (
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          )}

          {/* Manual override section */}
          {!hasLiveRetell && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <MetricInput
                id="retellCallVolume"
                label="Call Volume (this month)"
                value={state.retellOverrideCallVolume}
                onChange={(v) => update({ retellOverrideCallVolume: v })}
                testId="input-retell-call-volume"
              />
              <MetricInput
                id="retellAvgHandleTime"
                label="Avg Handle Time"
                hint="In minutes"
                suffix="min"
                value={state.retellOverrideAvgHandleTime}
                onChange={(v) => update({ retellOverrideAvgHandleTime: v })}
                testId="input-retell-avg-handle-time"
              />
              <MetricInput
                id="retellMissedCalls"
                label="Missed Calls"
                value={state.retellOverrideMissedCalls}
                onChange={(v) => update({ retellOverrideMissedCalls: v })}
                testId="input-retell-missed-calls"
              />
            </div>
          )}

          {/* Manual override fields — always visible but secondary when live data is present */}
          {hasLiveRetell && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <PenLine className="h-3 w-3" />
                Manual override (leave blank to use live data above)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <MetricInput
                  id="retellCallVolumeOverride"
                  label="Call Volume override"
                  value={state.retellOverrideCallVolume}
                  onChange={(v) => update({ retellOverrideCallVolume: v })}
                  testId="input-retell-call-volume-override"
                />
                <MetricInput
                  id="retellAvgHandleTimeOverride"
                  label="Avg Handle Time override"
                  suffix="min"
                  value={state.retellOverrideAvgHandleTime}
                  onChange={(v) => update({ retellOverrideAvgHandleTime: v })}
                  testId="input-retell-avg-handle-time-override"
                />
                <MetricInput
                  id="retellMissedCallsOverride"
                  label="Missed Calls override"
                  value={state.retellOverrideMissedCalls}
                  onChange={(v) => update({ retellOverrideMissedCalls: v })}
                  testId="input-retell-missed-calls-override"
                />
              </div>
            </div>
          )}

          {/* Missed rate calculation */}
          {missedRate !== null && (
            <p className="text-sm text-muted-foreground">
              Missed rate:{" "}
              <span className={parseFloat(missedRate) > 10 ? "text-red-600 font-semibold" : "font-semibold text-foreground"}>
                {missedRate}%
              </span>
            </p>
          )}

          {/* Period label */}
          {hasLiveRetell && retellStats?.periodStart && (
            <p className="text-[10px] text-muted-foreground">
              Period: {new Date(retellStats.periodStart).toLocaleDateString()} –{" "}
              {new Date(retellStats.periodEnd!).toLocaleDateString()}
              {dataUpdatedAt ? ` · Last fetched ${new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chatbot */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                CS Chatbot (Azure)
              </CardTitle>
              <CardDescription>
                Enter chatbot performance metrics. Live API integration tied to Task #5.
              </CardDescription>
            </div>
            <ManualBadge />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <MetricInput
              id="chatbotConversations"
              label="Conversation Volume"
              hint="Total conversations this month"
              value={state.chatbotConversations}
              onChange={(v) => update({ chatbotConversations: v })}
              testId="input-chatbot-conversations"
            />
            <MetricInput
              id="chatbotResolutionRate"
              label="Resolution Rate"
              suffix="%"
              value={state.chatbotResolutionRate}
              onChange={(v) => update({ chatbotResolutionRate: v })}
              testId="input-chatbot-resolution-rate"
            />
            <MetricInput
              id="chatbotEscalationRate"
              label="Escalation Rate"
              suffix="%"
              value={state.chatbotEscalationRate}
              onChange={(v) => update({ chatbotEscalationRate: v })}
              testId="input-chatbot-escalation-rate"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Open Tickets + CSAT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Open Tickets
            </CardTitle>
            <CardDescription>Current support ticket queue size</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricInput
              id="openTickets"
              label="Open Ticket Count"
              value={state.openTickets}
              onChange={(v) => update({ openTickets: v })}
              testId="input-open-tickets"
            />
            {state.openTickets && (
              <p className="mt-3 text-3xl font-bold" data-testid="metric-open-tickets">
                {state.openTickets}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              CSAT Score
            </CardTitle>
            <CardDescription>Customer satisfaction (1–5 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricInput
              id="csatScore"
              label="CSAT Score (1.0 – 5.0)"
              suffix="/ 5"
              value={state.csatScore}
              onChange={(v) => update({ csatScore: v })}
              testId="input-csat-score"
            />
            {state.csatScore && !isNaN(csat) && (
              <p className={`mt-3 text-3xl font-bold ${csatColor}`} data-testid="metric-csat">
                {csat.toFixed(1)}<span className="text-lg text-muted-foreground"> / 5</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
