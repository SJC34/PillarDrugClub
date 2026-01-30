import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Search, DollarSign, TrendingDown, Calendar, Pill, Plus, X, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { SEOHead, createBreadcrumbSchema } from "@/components/SEOHead";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  price: number;
  wholesalePrice: number;
  requiresPrescription: boolean;
}

interface CalculationResult {
  medication: Medication;
  quantity: number;
  daysSupply: number;
  tabletsPerDay: number;
  costPerTablet: number;
  totalCost: number;
  retailTotalCost: number;
  monthlyCost: number;
  yearlyCost: number;
  savings: number;
  savingsPercent: number;
}

interface PlanCost {
  name: string;
  tierKey: string;
  annualFee: number;
  fulfillmentFee: number;
  maxSupplyDays: number;
  ordersPerYear: number;
  totalFulfillmentCost: number;
  totalAnnualCost: number;
  isRecommended: boolean;
  supplyNote: string;
}

function calculatePlanCosts(desiredSupplyDays: number): PlanCost[] {
  const plans = [
    { name: "Gold – 6 Month", tierKey: "gold", annualFee: 59, fulfillmentFee: 10, maxSupplyDays: 180 },
    { name: "Platinum", tierKey: "platinum", annualFee: 99, fulfillmentFee: 10, maxSupplyDays: 365 },
  ];

  const results: PlanCost[] = plans.map(plan => {
    const effectiveSupply = Math.min(desiredSupplyDays, plan.maxSupplyDays);
    const ordersPerYear = Math.ceil(365 / effectiveSupply);
    const totalFulfillmentCost = ordersPerYear * plan.fulfillmentFee;
    const totalAnnualCost = plan.annualFee + totalFulfillmentCost;
    
    const supplyNote = desiredSupplyDays > plan.maxSupplyDays 
      ? `Limited to ${plan.maxSupplyDays}-day supply (${ordersPerYear} orders/year)`
      : `${effectiveSupply}-day supply (${ordersPerYear} order${ordersPerYear > 1 ? 's' : ''}/year)`;

    return {
      name: plan.name,
      tierKey: plan.tierKey,
      annualFee: plan.annualFee,
      fulfillmentFee: plan.fulfillmentFee,
      maxSupplyDays: plan.maxSupplyDays,
      ordersPerYear,
      totalFulfillmentCost,
      totalAnnualCost,
      isRecommended: false,
      supplyNote,
    };
  });

  const minCost = Math.min(...results.map(r => r.totalAnnualCost));
  results.forEach(r => {
    r.isRecommended = r.totalAnnualCost === minCost;
  });

  return results;
}

export default function CostCalculatorPage() {
  const [selectedMedications, setSelectedMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planDesiredSupply, setPlanDesiredSupply] = useState<string>("90");
  const [planResults, setPlanResults] = useState<PlanCost[] | null>(null);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [daysSupplies, setDaysSupplies] = useState<{ [key: string]: number }>({});

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/medications/search', { query: searchQuery, limit: 10 }],
    queryFn: async () => {
      if (!searchQuery) return { medications: [], total: 0 };
      const params = new URLSearchParams({ query: searchQuery, limit: '10' });
      const response = await fetch(`/api/medications/search?${params}`);
      if (!response.ok) throw new Error('Failed to search medications');
      return response.json();
    },
    enabled: !!searchQuery
  });

  const addMedication = (medication: Medication) => {
    if (!selectedMedications.find(m => m.id === medication.id)) {
      setSelectedMedications(prev => [...prev, medication]);
      setQuantities(prev => ({ ...prev, [medication.id]: 30 }));
      setDaysSupplies(prev => ({ ...prev, [medication.id]: 30 }));
    }
    setSearchQuery("");
  };

  const removeMedication = (medicationId: string) => {
    setSelectedMedications(prev => prev.filter(m => m.id !== medicationId));
    setQuantities(prev => {
      const { [medicationId]: removed, ...rest } = prev;
      return rest;
    });
    setDaysSupplies(prev => {
      const { [medicationId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateQuantity = (medicationId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [medicationId]: Math.max(1, quantity) }));
  };

  const updateDaysSupply = (medicationId: string, days: number) => {
    setDaysSupplies(prev => ({ ...prev, [medicationId]: Math.max(1, days) }));
  };

  useEffect(() => {
    const newCalculations: CalculationResult[] = selectedMedications.map(medication => {
      const quantity = quantities[medication.id] || 30;
      const daysSupply = daysSupplies[medication.id] || 30;
      const tabletsPerDay = quantity / daysSupply;
      const costPerTablet = medication.wholesalePrice;
      const totalCost = costPerTablet * quantity;
      const retailTotalCost = medication.price * quantity;
      const monthlyCost = (tabletsPerDay * 30) * costPerTablet;
      const yearlyCost = monthlyCost * 12;
      const savings = retailTotalCost - totalCost;
      const savingsPercent = (savings / retailTotalCost) * 100;

      return {
        medication,
        quantity,
        daysSupply,
        tabletsPerDay,
        costPerTablet,
        totalCost,
        retailTotalCost,
        monthlyCost,
        yearlyCost,
        savings,
        savingsPercent
      };
    });

    setCalculations(newCalculations);
  }, [selectedMedications, quantities, daysSupplies]);

  const totalSavings = calculations.reduce((sum, calc) => sum + calc.savings, 0);
  const totalYearlyCost = calculations.reduce((sum, calc) => sum + calc.yearlyCost, 0);
  const totalRetailYearlyCost = calculations.reduce((sum, calc) => sum + (calc.medication.price * (calc.tabletsPerDay * 365)), 0);

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://pillardrugclub.com" },
    { name: "Cost Calculator", url: "https://pillardrugclub.com/cost-calculator" }
  ]);

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <SEOHead
        title="Prescription Cost Calculator - See How Much You'll Save | Pillar Drug Club"
        description="Calculate your exact prescription costs and savings. See how much you'll pay for your medications vs retail prices. Free calculator shows your savings instantly."
        canonical="https://pillardrugclub.com/cost-calculator"
        schema={breadcrumbSchema}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <Calculator className="h-7 w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Medication Cost Calculator
            </h1>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            Calculate and compare your medication costs with our wholesale pricing. 
            See how much you can save compared to retail pharmacy prices.
          </p>
        </div>

        {/* Plan Recommendation Calculator */}
        <Card className="mb-6 md:mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Find Your Best Plan
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select how often you'd like to receive your medications and we'll recommend the most cost-effective plan. 
              All your medications ship together in one order, so the fulfillment fee stays the same no matter how many you have.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Desired Supply Duration</label>
                <Select
                  value={planDesiredSupply}
                  onValueChange={setPlanDesiredSupply}
                >
                  <SelectTrigger data-testid="select-supply-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days (1 month)</SelectItem>
                    <SelectItem value="60">60 days (2 months)</SelectItem>
                    <SelectItem value="90">90 days (3 months)</SelectItem>
                    <SelectItem value="180">180 days (6 months)</SelectItem>
                    <SelectItem value="365">365 days (1 year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  onClick={() => setPlanResults(calculatePlanCosts(Number(planDesiredSupply)))}
                  data-testid="button-calculate-plan"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Best Plan
                </Button>
              </div>
            </div>

            {planResults && (
              <div className="space-y-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {planResults.map((plan) => (
                    <Card 
                      key={plan.tierKey} 
                      className={`relative ${plan.isRecommended ? 'border-primary border-2 shadow-lg' : ''}`}
                    >
                      {plan.isRecommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground px-3">
                            <Star className="h-3 w-3 mr-1" />
                            BEST VALUE
                          </Badge>
                        </div>
                      )}
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <div className="text-3xl font-bold text-primary mt-2">
                            ${plan.totalAnnualCost}
                            <span className="text-sm font-normal text-muted-foreground">/year</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Annual membership:</span>
                            <span className="font-medium">${plan.annualFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fulfillment fee:</span>
                            <span className="font-medium">${plan.fulfillmentFee}/order</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Orders per year:</span>
                            <span className="font-medium">{plan.ordersPerYear}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Fulfillment costs:</span>
                            <span>${plan.totalFulfillmentCost}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{plan.supplyNote}</p>
                        </div>
                        {plan.isRecommended && (
                          <div className="mt-4">
                            <Link href="/register">
                              <Button className="w-full" size="sm" data-testid="button-get-started">
                                Get Started
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Savings comparison */}
                {planResults.length > 1 && (
                  <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-300">
                          {planResults.find(p => p.isRecommended)?.name} saves you the most!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {(() => {
                            const recommended = planResults.find(p => p.isRecommended);
                            const others = planResults.filter(p => !p.isRecommended);
                            if (!recommended || others.length === 0) return null;
                            const maxOther = Math.max(...others.map(o => o.totalAnnualCost));
                            const savings = maxOther - recommended.totalAnnualCost;
                            return savings > 0 ? `Save up to $${savings}/year compared to other plans` : 'Most cost-effective for your needs';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Medication Section */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Search className="h-5 w-5" />
              Add Medications to Calculate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search for medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 md:h-12 pl-10"
                data-testid="input-medication-search"
              />
            </div>
            
            {/* Search Results with Pricing */}
            {searchQuery && (
              <div className="bg-muted/30 border rounded-md max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground text-sm md:text-base">Searching catalog...</div>
                ) : searchResults?.medications?.length > 0 ? (
                  <div className="py-2">
                    {searchResults.medications.map((medication: Medication) => (
                      <button
                        key={medication.id}
                        onClick={() => addMedication(medication)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 min-h-[60px] touch-manipulation"
                        data-testid={`button-add-medication-${medication.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm md:text-base truncate">{medication.name}</div>
                            <div className="text-xs md:text-sm text-muted-foreground truncate">
                              {medication.genericName} - {medication.strength}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs md:text-sm text-primary font-bold">
                              ${medication.wholesalePrice.toFixed(2)}/tablet
                            </div>
                            <div className="text-xs text-muted-foreground line-through">
                              ${medication.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-4 text-center text-muted-foreground text-sm md:text-base">
                    No medications found in catalog for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Medications */}
        {selectedMedications.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {selectedMedications.map((medication) => {
              const calc = calculations.find(c => c.medication.id === medication.id);
              if (!calc) return null;

              return (
                <Card key={medication.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg text-foreground mb-1 pr-2">
                          {medication.name}
                        </CardTitle>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {medication.genericName} - {medication.strength}
                        </p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {medication.dosageForm}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedication(medication.id)}
                        className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8"
                        data-testid={`button-remove-medication-${medication.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 pt-0">
                    {/* Input Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="text-xs md:text-sm font-medium text-muted-foreground mb-2 block">
                          Quantity (tablets)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantities[medication.id] || 30}
                          onChange={(e) => updateQuantity(medication.id, parseInt(e.target.value) || 1)}
                          data-testid={`input-quantity-${medication.id}`}
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                      </div>
                      <div>
                        <label className="text-xs md:text-sm font-medium text-muted-foreground mb-2 block">
                          Days Supply
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={daysSupplies[medication.id] || 30}
                          onChange={(e) => updateDaysSupply(medication.id, parseInt(e.target.value) || 1)}
                          data-testid={`input-days-supply-${medication.id}`}
                          className="h-10 md:h-11 text-sm md:text-base"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Cost per tablet:</span>
                        <span className="font-bold text-primary">
                          ${calc.costPerTablet.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Tablets per day:</span>
                        <span className="font-medium">
                          {calc.tabletsPerDay.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base text-muted-foreground">Total cost:</span>
                        <span className="text-base md:text-lg font-bold text-primary">
                          ${calc.totalCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground line-through">Retail price:</span>
                        <span className="text-muted-foreground line-through">
                          ${calc.retailTotalCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300">
                            You save:
                          </span>
                          <div className="text-right">
                            <div className="text-sm md:text-lg font-bold text-green-700 dark:text-green-300">
                              ${calc.savings.toFixed(2)}
                            </div>
                            <div className="text-xs md:text-sm text-green-600 dark:text-green-400">
                              ({calc.savingsPercent.toFixed(0)}% off)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Time-based Costs */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                      <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 md:mb-2 text-primary" />
                        <div className="font-semibold text-foreground text-xs md:text-sm">Monthly Cost</div>
                        <div className="text-sm md:text-lg font-bold text-primary">
                          ${calc.monthlyCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-2 md:p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 md:mb-2 text-primary" />
                        <div className="font-semibold text-foreground text-xs md:text-sm">Yearly Cost</div>
                        <div className="text-sm md:text-lg font-bold text-primary">
                          ${calc.yearlyCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {calculations.length > 1 && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center">
                  <div className="text-xl md:text-3xl font-bold text-primary mb-2">
                    ${totalYearlyCost.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Total Annual Cost (Wholesale)
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xl md:text-3xl font-bold text-muted-foreground line-through mb-2">
                    ${totalRetailYearlyCost.toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Total Annual Cost (Retail)
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xl md:text-3xl font-bold text-green-600 mb-2">
                    ${(totalRetailYearlyCost - totalYearlyCost).toFixed(2)}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Total Annual Savings
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground text-center">
                  <TrendingDown className="h-4 w-4 flex-shrink-0" />
                  <span>
                    You save {Math.round(((totalRetailYearlyCost - totalYearlyCost) / totalRetailYearlyCost) * 100)}% 
                    compared to retail pharmacy prices
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        {selectedMedications.length > 0 && (
          <div className="text-center mt-6 md:mt-8">
            <div className="bg-primary/5 rounded-lg p-4 md:p-6 border border-primary/20">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                Ready to start saving?
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Get these wholesale prices by becoming a Pillar Drug Club member
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/medications">
                  <Button size="lg" className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base">
                    <Pill className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    Browse More Medications
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 md:px-8 text-sm md:text-base">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedMedications.length === 0 && (
          <Card className="text-center py-8 md:py-12">
            <CardContent>
              <Calculator className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                Start Calculating Your Medication Costs
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                Search for and add medications above to see detailed cost breakdowns, 
                savings calculations, and yearly estimates.
              </p>
              <Link href="/medications">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Medications
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}