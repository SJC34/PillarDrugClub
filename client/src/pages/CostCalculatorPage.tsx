import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Search, DollarSign, TrendingDown, Calendar, Pill, Plus, X } from "lucide-react";
import { Link } from "wouter";

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

export default function CostCalculatorPage() {
  const [selectedMedications, setSelectedMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Medication Cost Calculator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Calculate and compare your medication costs with our wholesale pricing. 
            See how much you can save compared to retail pharmacy prices.
          </p>
        </div>

        {/* Add Medication Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Add Medications to Calculate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Input
                placeholder="Search for medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
                data-testid="input-medication-search"
              />
              
              {/* Search Results */}
              {searchQuery && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Searching...</div>
                  ) : searchResults?.medications?.length > 0 ? (
                    <div className="py-2">
                      {searchResults.medications.map((medication: Medication) => (
                        <button
                          key={medication.id}
                          onClick={() => addMedication(medication)}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                          data-testid={`button-add-medication-${medication.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">{medication.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {medication.genericName} - {medication.strength}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-primary font-bold">
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
                    <div className="p-4 text-center text-muted-foreground">
                      No medications found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Medications */}
        {selectedMedications.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {selectedMedications.map((medication) => {
              const calc = calculations.find(c => c.medication.id === medication.id);
              if (!calc) return null;

              return (
                <Card key={medication.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-foreground mb-1">
                          {medication.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {medication.genericName} - {medication.strength}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {medication.dosageForm}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMedication(medication.id)}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`button-remove-medication-${medication.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Input Controls */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Quantity (tablets)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantities[medication.id] || 30}
                          onChange={(e) => updateQuantity(medication.id, parseInt(e.target.value) || 1)}
                          data-testid={`input-quantity-${medication.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Days Supply
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={daysSupplies[medication.id] || 30}
                          onChange={(e) => updateDaysSupply(medication.id, parseInt(e.target.value) || 1)}
                          data-testid={`input-days-supply-${medication.id}`}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost per tablet:</span>
                        <span className="font-bold text-primary">
                          ${calc.costPerTablet.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tablets per day:</span>
                        <span className="font-medium">
                          {calc.tabletsPerDay.toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total cost:</span>
                        <span className="text-lg font-bold text-primary">
                          ${calc.totalCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground line-through">Retail price:</span>
                        <span className="text-muted-foreground line-through">
                          ${calc.retailTotalCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            You save:
                          </span>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                              ${calc.savings.toFixed(2)}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">
                              ({calc.savingsPercent.toFixed(0)}% off)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Time-based Costs */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <div className="font-semibold text-foreground">Monthly Cost</div>
                        <div className="text-lg font-bold text-primary">
                          ${calc.monthlyCost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                        <div className="font-semibold text-foreground">Yearly Cost</div>
                        <div className="text-lg font-bold text-primary">
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
              <CardTitle className="flex items-center gap-2 text-primary">
                <DollarSign className="h-6 w-6" />
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${totalYearlyCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Annual Cost (Wholesale)
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground line-through mb-2">
                    ${totalRetailYearlyCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Annual Cost (Retail)
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${(totalRetailYearlyCost - totalYearlyCost).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Annual Savings
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4" />
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
          <div className="text-center mt-8">
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to start saving?
              </h3>
              <p className="text-muted-foreground mb-4">
                Get these wholesale prices by becoming a Pillar Drug Club member
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/medications">
                  <Button size="lg" className="px-8">
                    <Pill className="h-5 w-5 mr-2" />
                    Browse More Medications
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedMedications.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Start Calculating Your Medication Costs
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Search for and add medications above to see detailed cost breakdowns, 
                savings calculations, and yearly estimates.
              </p>
              <Link href="/medications">
                <Button variant="outline">
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