import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  MessageSquare,
  Ticket,
  Star,
  Info,
} from "lucide-react";

const LS_KEY = "admin_cs_v1";

interface CSState {
  retellCallVolume: string;
  retellAvgHandleTime: string;
  retellMissedCalls: string;
  chatbotConversations: string;
  chatbotResolutionRate: string;
  chatbotEscalationRate: string;
  openTickets: string;
  csatScore: string;
}

const DEFAULT_STATE: CSState = {
  retellCallVolume: "",
  retellAvgHandleTime: "",
  retellMissedCalls: "",
  chatbotConversations: "",
  chatbotResolutionRate: "",
  chatbotEscalationRate: "",
  openTickets: "",
  csatScore: "",
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
}

function MetricInput({ id, label, hint, value, type = "number", suffix, onChange, testId }: MetricInputProps) {
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

export default function AdminCSPage() {
  const [state, setState] = useState<CSState>(loadState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => { setIsHydrated(true); }, []);

  const update = (patch: Partial<CSState>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveState(next);
  };

  const csat = parseFloat(state.csatScore);
  const csatColor =
    isNaN(csat) ? "" :
    csat >= 4.5 ? "text-green-600" :
    csat >= 3.5 ? "text-yellow-600" :
    "text-red-600";

  const missedCalls = parseFloat(state.retellMissedCalls) || 0;
  const totalCalls = parseFloat(state.retellCallVolume) || 0;
  const missedRate = totalCalls > 0 ? ((missedCalls / totalCalls) * 100).toFixed(1) : null;

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
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Retell AI Phone Line
              </CardTitle>
              <CardDescription>
                Enter current-month call metrics. Live API integration coming in a future release.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <Info className="h-3 w-3 flex-shrink-0" />
              Manual input
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <MetricInput
              id="retellCallVolume"
              label="Call Volume (this month)"
              value={state.retellCallVolume}
              onChange={(v) => update({ retellCallVolume: v })}
              testId="input-retell-call-volume"
            />
            <MetricInput
              id="retellAvgHandleTime"
              label="Avg Handle Time"
              hint="In minutes"
              suffix="min"
              value={state.retellAvgHandleTime}
              onChange={(v) => update({ retellAvgHandleTime: v })}
              testId="input-retell-avg-handle-time"
            />
            <MetricInput
              id="retellMissedCalls"
              label="Missed Calls"
              value={state.retellMissedCalls}
              onChange={(v) => update({ retellMissedCalls: v })}
              testId="input-retell-missed-calls"
            />
          </div>

          {missedRate !== null && (
            <p className="mt-4 text-sm text-muted-foreground">
              Missed rate:{" "}
              <span className={parseFloat(missedRate) > 10 ? "text-red-600 font-semibold" : "font-semibold text-foreground"}>
                {missedRate}%
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chatbot */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                CS Chatbot (Azure)
              </CardTitle>
              <CardDescription>
                Enter chatbot performance metrics. Live API integration tied to Task #5.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
              <Info className="h-3 w-3 flex-shrink-0" />
              Manual input
            </div>
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
