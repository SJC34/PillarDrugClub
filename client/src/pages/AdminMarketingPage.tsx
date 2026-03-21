import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  TrendingUp,
  Search,
  Mail,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
} from "lucide-react";

const MEMBERSHIP_PRICE = 99;
const LTV = 446;

const CHANNELS = [
  "Google Search",
  "Meta",
  "Reddit",
  "Organic / SEO",
  "Direct",
  "Email",
  "Referral",
];

const EMAIL_SEQUENCES = [
  { id: "welcome", name: "Welcome" },
  { id: "onboarding-d3", name: "Onboarding D3" },
  { id: "onboarding-d7", name: "Onboarding D7" },
  { id: "upsell", name: "Upsell" },
  { id: "winback-30", name: "Winback 30" },
  { id: "winback-60", name: "Winback 60" },
];

interface ChannelRow {
  channel: string;
  spend: string;
  clicks: string;
  conversions: string;
  wowChange: string;
}

interface SeoRow {
  title: string;
  keyword: string;
  status: string;
  position: string;
  impressions: string;
  clicks: string;
}

interface EmailSeqRow {
  id: string;
  name: string;
  status: "active" | "paused";
  openRate: string;
  clickRate: string;
  revenueAttributed: string;
}

function getCacColor(cac: number | null): string {
  if (cac === null || isNaN(cac)) return "";
  if (cac < 94.5) return "text-green-700 dark:text-green-400 font-semibold";
  if (cac <= 110) return "text-yellow-700 dark:text-yellow-400 font-semibold";
  return "text-red-700 dark:text-red-400 font-semibold";
}

function computeCac(spend: string, conversions: string): number | null {
  const s = parseFloat(spend);
  const c = parseFloat(conversions);
  if (!c || c === 0 || isNaN(s) || isNaN(c)) return null;
  return s / c;
}

function computeRoas(spend: string, conversions: string): number | null {
  const s = parseFloat(spend);
  const c = parseFloat(conversions);
  if (!s || s === 0 || isNaN(s) || isNaN(c)) return null;
  return (c * MEMBERSHIP_PRICE) / s;
}

const DEFAULT_CHANNELS: ChannelRow[] = CHANNELS.map((ch) => ({
  channel: ch,
  spend: "",
  clicks: "",
  conversions: "",
  wowChange: "",
}));

const DEFAULT_EMAIL_SEQS: EmailSeqRow[] = EMAIL_SEQUENCES.map((s) => ({
  ...s,
  status: "active",
  openRate: "",
  clickRate: "",
  revenueAttributed: "",
}));

function loadOrDefault<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
}

export default function AdminMarketingPage() {
  const [channels, setChannels] = useState<ChannelRow[]>(() =>
    loadOrDefault("admin_marketing_channels", DEFAULT_CHANNELS)
  );
  const [seoRows, setSeoRows] = useState<SeoRow[]>(() =>
    loadOrDefault("admin_marketing_seo", [])
  );
  const [emailSeqs, setEmailSeqs] = useState<EmailSeqRow[]>(() =>
    loadOrDefault("admin_marketing_email", DEFAULT_EMAIL_SEQS)
  );
  const [showReport, setShowReport] = useState(false);

  const save = (
    key: string,
    value: ChannelRow[] | SeoRow[] | EmailSeqRow[]
  ) => localStorage.setItem(key, JSON.stringify(value));

  const updateChannel = (idx: number, field: keyof ChannelRow, val: string) => {
    const updated = channels.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    setChannels(updated);
    save("admin_marketing_channels", updated);
  };

  const addSeoRow = () => {
    const updated = [
      ...seoRows,
      { title: "", keyword: "", status: "Draft", position: "", impressions: "", clicks: "" },
    ];
    setSeoRows(updated);
    save("admin_marketing_seo", updated);
  };

  const updateSeo = (idx: number, field: keyof SeoRow, val: string) => {
    const updated = seoRows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    setSeoRows(updated);
    save("admin_marketing_seo", updated);
  };

  const removeSeoRow = (idx: number) => {
    const updated = seoRows.filter((_, i) => i !== idx);
    setSeoRows(updated);
    save("admin_marketing_seo", updated);
  };

  const updateEmailSeq = (id: string, field: keyof EmailSeqRow, val: string) => {
    const updated = emailSeqs.map((r) => (r.id === id ? { ...r, [field]: val } : r));
    setEmailSeqs(updated);
    save("admin_marketing_email", updated);
  };

  const toggleSeqStatus = (id: string) => {
    const updated = emailSeqs.map((r) =>
      r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r
    ) as EmailSeqRow[];
    setEmailSeqs(updated);
    save("admin_marketing_email", updated);
  };

  const totalSpend = channels.reduce((acc, r) => acc + (parseFloat(r.spend) || 0), 0);
  const totalConversions = channels.reduce((acc, r) => acc + (parseFloat(r.conversions) || 0), 0);
  const blendedCac = totalConversions > 0 ? totalSpend / totalConversions : null;
  const blendedRoas = totalSpend > 0 ? (totalConversions * MEMBERSHIP_PRICE) / totalSpend : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-testid="page-admin-marketing">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketing Dashboard</h1>
            <p className="text-muted-foreground">Channel performance, SEO, and email sequences</p>
          </div>
        </div>
        <Button onClick={() => setShowReport(true)} data-testid="button-generate-report">
          <Printer className="h-4 w-4 mr-2" />
          Generate Weekly Report
        </Button>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Channel Performance
          </CardTitle>
          <CardDescription>Enter weekly spend and conversion data per channel. CAC auto-calculated.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Spend ($)</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>CAC</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>WoW Change (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((row, idx) => {
                const cac = computeCac(row.spend, row.conversions);
                const roas = computeRoas(row.spend, row.conversions);
                return (
                  <TableRow key={row.channel} data-testid={`row-channel-${idx}`}>
                    <TableCell className="font-medium whitespace-nowrap">{row.channel}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.spend}
                        onChange={(e) => updateChannel(idx, "spend", e.target.value)}
                        data-testid={`input-spend-${idx}`}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.clicks}
                        onChange={(e) => updateChannel(idx, "clicks", e.target.value)}
                        data-testid={`input-clicks-${idx}`}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={row.conversions}
                        onChange={(e) => updateChannel(idx, "conversions", e.target.value)}
                        data-testid={`input-conversions-${idx}`}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={getCacColor(cac)} data-testid={`metric-cac-${idx}`}>
                        {cac !== null ? `$${cac.toFixed(2)}` : "—"}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`metric-roas-${idx}`}>
                      {roas !== null ? `${roas.toFixed(2)}x` : "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        placeholder="0"
                        value={row.wowChange}
                        onChange={(e) => updateChannel(idx, "wowChange", e.target.value)}
                        data-testid={`input-wow-${idx}`}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span>
              Total Spend:{" "}
              <strong className="text-foreground">${totalSpend.toFixed(2)}</strong>
            </span>
            <span>
              Total Conversions:{" "}
              <strong className="text-foreground">{totalConversions}</strong>
            </span>
            <span>
              Blended CAC:{" "}
              <strong className={getCacColor(blendedCac)} data-testid="metric-blended-cac">
                {blendedCac !== null ? `$${blendedCac.toFixed(2)}` : "—"}
              </strong>
            </span>
            <span>
              Blended ROAS:{" "}
              <strong className="text-foreground">
                {blendedRoas !== null ? `${blendedRoas.toFixed(2)}x` : "—"}
              </strong>
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Badge className="bg-green-100 text-green-800">Green: CAC &lt; $94.50</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">Yellow: $94.50 – $110</Badge>
            <Badge className="bg-red-100 text-red-800">Red: CAC &gt; $110</Badge>
          </div>
        </CardContent>
      </Card>

      {/* SEO Tracker */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              SEO Content Tracker
            </CardTitle>
            <CardDescription>Track ranking and performance for each content piece.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addSeoRow} data-testid="button-add-seo-row">
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {seoRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No content tracked yet. Click "Add Row" to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seoRows.map((row, idx) => {
                  const pos = parseFloat(row.position);
                  const isFlagged = !isNaN(pos) && pos > 20;
                  return (
                    <TableRow key={idx} data-testid={`row-seo-${idx}`}>
                      <TableCell>
                        <Input
                          placeholder="Article title"
                          value={row.title}
                          onChange={(e) => updateSeo(idx, "title", e.target.value)}
                          data-testid={`input-seo-title-${idx}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Target keyword"
                          value={row.keyword}
                          onChange={(e) => updateSeo(idx, "keyword", e.target.value)}
                          data-testid={`input-seo-keyword-${idx}`}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Draft / Live"
                          value={row.status}
                          onChange={(e) => updateSeo(idx, "status", e.target.value)}
                          data-testid={`input-seo-status-${idx}`}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="—"
                            value={row.position}
                            onChange={(e) => updateSeo(idx, "position", e.target.value)}
                            data-testid={`input-seo-position-${idx}`}
                            className="w-20"
                          />
                          {isFlagged && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.impressions}
                          onChange={(e) => updateSeo(idx, "impressions", e.target.value)}
                          data-testid={`input-seo-impressions-${idx}`}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.clicks}
                          onChange={(e) => updateSeo(idx, "clicks", e.target.value)}
                          data-testid={`input-seo-clicks-${idx}`}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSeoRow(idx)}
                          data-testid={`button-remove-seo-${idx}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Sequence Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Sequence Tracker
          </CardTitle>
          <CardDescription>Monitor open rates, click rates, and toggle Active/Paused per sequence.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Open Rate (%)</TableHead>
                <TableHead>Click Rate (%)</TableHead>
                <TableHead>Revenue Attributed ($)</TableHead>
                <TableHead>Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailSeqs.map((seq) => (
                <TableRow key={seq.id} data-testid={`row-email-${seq.id}`}>
                  <TableCell className="font-medium whitespace-nowrap">{seq.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        seq.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }
                      data-testid={`badge-status-${seq.id}`}
                    >
                      {seq.status === "active" ? (
                        <CheckCircle className="h-3 w-3 mr-1 inline" />
                      ) : (
                        <PauseCircle className="h-3 w-3 mr-1 inline" />
                      )}
                      {seq.status === "active" ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      value={seq.openRate}
                      onChange={(e) => updateEmailSeq(seq.id, "openRate", e.target.value)}
                      data-testid={`input-open-rate-${seq.id}`}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      value={seq.clickRate}
                      onChange={(e) => updateEmailSeq(seq.id, "clickRate", e.target.value)}
                      data-testid={`input-click-rate-${seq.id}`}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      placeholder="—"
                      value={seq.revenueAttributed}
                      onChange={(e) => updateEmailSeq(seq.id, "revenueAttributed", e.target.value)}
                      data-testid={`input-revenue-attributed-${seq.id}`}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSeqStatus(seq.id)}
                      data-testid={`button-toggle-${seq.id}`}
                    >
                      {seq.status === "active" ? "Pause" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weekly Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 space-y-6 print:shadow-none">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Weekly Marketing Report</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print / PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowReport(false)}>
                  Close
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Generated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Top-Line Numbers</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Total Marketing Spend</p>
                  <p className="font-bold text-xl">${totalSpend.toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Total Conversions</p>
                  <p className="font-bold text-xl">{totalConversions}</p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Blended CAC</p>
                  <p className={`font-bold text-xl ${getCacColor(blendedCac)}`}>
                    {blendedCac !== null ? `$${blendedCac.toFixed(2)}` : "—"}
                  </p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">Blended ROAS</p>
                  <p className="font-bold text-xl">
                    {blendedRoas !== null ? `${blendedRoas.toFixed(2)}x` : "—"}
                  </p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">LTV (fixed)</p>
                  <p className="font-bold text-xl">${LTV}</p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-xs text-muted-foreground">LTV:CAC Ratio</p>
                  <p className={`font-bold text-xl ${blendedCac && blendedCac > 0 ? (LTV / blendedCac < 4.4 ? "text-red-600" : "text-green-600") : ""}`}>
                    {blendedCac && blendedCac > 0 ? `${(LTV / blendedCac).toFixed(1)}x` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">Channel Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Conv.</TableHead>
                    <TableHead>CAC</TableHead>
                    <TableHead>ROAS</TableHead>
                    <TableHead>WoW</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels
                    .filter((r) => r.spend || r.conversions)
                    .map((row, idx) => {
                      const cac = computeCac(row.spend, row.conversions);
                      const roas = computeRoas(row.spend, row.conversions);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.channel}</TableCell>
                          <TableCell>${parseFloat(row.spend || "0").toFixed(2)}</TableCell>
                          <TableCell>{row.conversions || "0"}</TableCell>
                          <TableCell className={getCacColor(cac)}>
                            {cac !== null ? `$${cac.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell>{roas !== null ? `${roas.toFixed(2)}x` : "—"}</TableCell>
                          <TableCell>
                            {row.wowChange ? `${parseFloat(row.wowChange) > 0 ? "+" : ""}${row.wowChange}%` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {seoRows.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">SEO Highlights</h3>
                  <div className="space-y-1 text-sm">
                    {seoRows
                      .filter((r) => r.position && parseFloat(r.position) > 20)
                      .map((r, i) => (
                        <p key={i} className="text-red-600">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          "{r.title || r.keyword}" at position {r.position} — needs improvement
                        </p>
                      ))}
                    {seoRows.filter((r) => r.position && parseFloat(r.position) <= 20).map((r, i) => (
                      <p key={i} className="text-green-700">
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        "{r.title || r.keyword}" at position {r.position}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <p className="text-xs text-muted-foreground">
              PDC Membership price: ${MEMBERSHIP_PRICE}/yr · LTV: ${LTV} · CAC threshold: $110 red / $94.50 green
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
