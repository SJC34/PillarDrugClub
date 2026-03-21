import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Package,
  Clock,
  DollarSign,
  Pill,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";

const LS_KEY = "admin_fulfillment_v1";

interface CategoryRow {
  id: string;
  category: string;
  fillRate: string;
}

interface FulfillmentState {
  fillsThisMonth: string;
  pendingFills: string;
  avgFillTime: string;
  hwFlatFee: string;
  hwDispenseFeePerFill: string;
  categories: CategoryRow[];
}

const DEFAULT_STATE: FulfillmentState = {
  fillsThisMonth: "",
  pendingFills: "",
  avgFillTime: "",
  hwFlatFee: "",
  hwDispenseFeePerFill: "10",
  categories: [
    { id: "1", category: "Cardiovascular", fillRate: "" },
    { id: "2", category: "Diabetes / Metabolic", fillRate: "" },
    { id: "3", category: "Mental Health", fillRate: "" },
    { id: "4", category: "Thyroid", fillRate: "" },
    { id: "5", category: "Other", fillRate: "" },
  ],
};

function loadState(): FulfillmentState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: FulfillmentState) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

export default function AdminFulfillmentPage() {
  const [state, setState] = useState<FulfillmentState>(loadState);

  const update = (patch: Partial<FulfillmentState>) => {
    const next = { ...state, ...patch };
    setState(next);
    saveState(next);
  };

  const updateCategory = (id: string, field: keyof CategoryRow, val: string) => {
    const updated = state.categories.map((c) =>
      c.id === id ? { ...c, [field]: val } : c
    );
    update({ categories: updated });
  };

  const addCategory = () => {
    const updated = [
      ...state.categories,
      { id: Date.now().toString(), category: "", fillRate: "" },
    ];
    update({ categories: updated });
  };

  const removeCategory = (id: string) => {
    update({ categories: state.categories.filter((c) => c.id !== id) });
  };

  const fills = parseFloat(state.fillsThisMonth) || 0;
  const flatFee = parseFloat(state.hwFlatFee) || 0;
  const dispensePerFill = parseFloat(state.hwDispenseFeePerFill) || 0;
  const dispenseFeeTotal = fills * dispensePerFill;
  const hwTotalSpend = flatFee + dispenseFeeTotal;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" data-testid="page-admin-fulfillment">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fulfillment Dashboard</h1>
          <p className="text-muted-foreground">HealthWarehouse metrics and cost tracking</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Label htmlFor="fillsThisMonth" className="text-sm text-muted-foreground">
                  Rx Fills This Month
                </Label>
                <Input
                  id="fillsThisMonth"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={state.fillsThisMonth}
                  onChange={(e) => update({ fillsThisMonth: e.target.value })}
                  data-testid="input-fills-this-month"
                  className="text-2xl font-bold h-12"
                />
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Package className="h-6 w-6 text-teal-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Label htmlFor="pendingFills" className="text-sm text-muted-foreground">
                  Pending Fills
                </Label>
                <Input
                  id="pendingFills"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={state.pendingFills}
                  onChange={(e) => update({ pendingFills: e.target.value })}
                  data-testid="input-pending-fills"
                  className="text-2xl font-bold h-12"
                />
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Label htmlFor="avgFillTime" className="text-sm text-muted-foreground">
                  Avg Fill Time (days)
                </Label>
                <Input
                  id="avgFillTime"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0.0"
                  value={state.avgFillTime}
                  onChange={(e) => update({ avgFillTime: e.target.value })}
                  data-testid="input-avg-fill-time"
                  className="text-2xl font-bold h-12"
                />
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HealthWarehouse Cost Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            HealthWarehouse Cost Tracker
          </CardTitle>
          <CardDescription>
            Total = flat fee + (dispense fee × fills this month)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hwFlatFee">Flat Fee (monthly, $)</Label>
              <Input
                id="hwFlatFee"
                type="number"
                min="0"
                placeholder="0"
                value={state.hwFlatFee}
                onChange={(e) => update({ hwFlatFee: e.target.value })}
                data-testid="input-hw-flat-fee"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hwDispenseFeePerFill">Dispense Fee per Fill ($)</Label>
              <Input
                id="hwDispenseFeePerFill"
                type="number"
                min="0"
                step="0.01"
                placeholder="10.00"
                value={state.hwDispenseFeePerFill}
                onChange={(e) => update({ hwDispenseFeePerFill: e.target.value })}
                data-testid="input-hw-dispense-fee"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Flat Fee</p>
              <p className="text-2xl font-bold" data-testid="metric-hw-flat-fee">
                ${flatFee.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-muted/40 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Dispense Fee ({fills} fills × ${dispensePerFill.toFixed(2)})
              </p>
              <p className="text-2xl font-bold" data-testid="metric-hw-dispense-total">
                ${dispenseFeeTotal.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total HW Spend</p>
              <p className="text-2xl font-bold text-primary" data-testid="metric-hw-total">
                ${hwTotalSpend.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fill Rate by Drug Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Fill Rate by Drug Category
            </CardTitle>
            <CardDescription>Track fill rate (%) per therapeutic category.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addCategory} data-testid="button-add-category">
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drug Category</TableHead>
                <TableHead>Fill Rate (%)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.categories.map((cat) => (
                <TableRow key={cat.id} data-testid={`row-category-${cat.id}`}>
                  <TableCell>
                    <Input
                      placeholder="Category name"
                      value={cat.category}
                      onChange={(e) => updateCategory(cat.id, "category", e.target.value)}
                      data-testid={`input-category-name-${cat.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      value={cat.fillRate}
                      onChange={(e) => updateCategory(cat.id, "fillRate", e.target.value)}
                      data-testid={`input-category-fill-rate-${cat.id}`}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeCategory(cat.id)}
                      data-testid={`button-remove-category-${cat.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
