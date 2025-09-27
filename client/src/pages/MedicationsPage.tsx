import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingCart, Info } from "lucide-react";
import { Link } from "wouter";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  category: string;
  description: string;
  price: number;
  wholesalePrice: number;
  inStock: boolean;
  quantity: number;
  requiresPrescription: boolean;
}

interface SearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  requiresPrescription?: boolean;
  page: number;
  limit: number;
}

export default function MedicationsPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 20,
    inStockOnly: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ['/api/medications/search', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/medications/search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch medications');
      return response.json();
    }
  });

  const updateSearch = (updates: Partial<SearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...updates, page: 1 }));
  };

  const categories = [
    "ACE Inhibitors", "Diabetes Medications", "Statins", "Antidepressants",
    "Antibiotics", "Pain Relief", "Blood Pressure", "Heart Medications"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Prescription Medications
          </h1>
          <p className="text-muted-foreground">
            Browse our extensive catalog of prescription medications at wholesale prices
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Medications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Search by name
                </label>
                <Input
                  placeholder="Search medications..."
                  value={searchParams.query || ""}
                  onChange={(e) => updateSearch({ query: e.target.value })}
                  data-testid="input-medication-search"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Category
                </label>
                <Select 
                  value={searchParams.category || ""}
                  onValueChange={(value) => updateSearch({ category: value || undefined })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Prescription Required
                </label>
                <Select 
                  value={searchParams.requiresPrescription?.toString() || ""}
                  onValueChange={(value) => updateSearch({ 
                    requiresPrescription: value === "" ? undefined : value === "true" 
                  })}
                >
                  <SelectTrigger data-testid="select-prescription-required">
                    <SelectValue placeholder="All medications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All medications</SelectItem>
                    <SelectItem value="true">Prescription required</SelectItem>
                    <SelectItem value="false">Over-the-counter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchParams.inStockOnly || false}
                    onChange={(e) => updateSearch({ inStockOnly: e.target.checked })}
                    className="rounded"
                    data-testid="checkbox-in-stock-only"
                  />
                  <span className="text-sm">In stock only</span>
                </label>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setSearchParams({ page: 1, limit: 20, inStockOnly: true })}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {data?.medications?.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    Showing {data.medications.length} of {data.total} medications
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.medications.map((medication: Medication) => (
                    <Card key={medication.id} className="hover-elevate transition-all duration-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-foreground">
                              {medication.name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {medication.genericName}
                              {medication.brandName && ` (${medication.brandName})`}
                            </p>
                          </div>
                          {!medication.inStock && (
                            <Badge variant="destructive" className="ml-2">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Strength:</span>
                            <span className="font-medium">{medication.strength}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Form:</span>
                            <span className="font-medium">{medication.dosageForm}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Category:</span>
                            <Badge variant="secondary" className="text-xs">
                              {medication.category}
                            </Badge>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground line-through">
                              Retail: ${medication.price.toFixed(2)}
                            </span>
                            <Badge className="bg-primary/10 text-primary border-primary">
                              Save {Math.round(((medication.price - medication.wholesalePrice) / medication.price) * 100)}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-primary">
                              ${medication.wholesalePrice.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Wholesale Price
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {medication.description}
                        </p>

                        <div className="flex gap-2 pt-2">
                          <Link href={`/medications/${medication.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-details-${medication.id}`}>
                              <Info className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </Link>
                          
                          {medication.requiresPrescription ? (
                            <Link href={`/order/prescription/${medication.id}`} className="flex-1">
                              <Button 
                                size="sm" 
                                className="w-full"
                                disabled={!medication.inStock}
                                data-testid={`button-order-prescription-${medication.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Order Rx
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/order/otc/${medication.id}`} className="flex-1">
                              <Button 
                                size="sm" 
                                className="w-full"
                                disabled={!medication.inStock}
                                data-testid={`button-add-to-cart-${medication.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            </Link>
                          )}
                        </div>

                        {medication.requiresPrescription && (
                          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                              📋 Prescription Required
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              A valid prescription is required to order this medication
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {data.total > searchParams.limit && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={searchParams.page === 1}
                      onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page - 1 }))}
                      data-testid="button-previous-page"
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      Page {searchParams.page} of {Math.ceil(data.total / searchParams.limit)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={searchParams.page >= Math.ceil(data.total / searchParams.limit)}
                      onClick={() => setSearchParams(prev => ({ ...prev, page: prev.page + 1 }))}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No medications found</h3>
                    <p>Try adjusting your search criteria or browse different categories</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}