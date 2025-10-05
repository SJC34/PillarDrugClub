import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Pill, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName?: string;
  category: string;
  dosageForm: string;
  strength: string;
  price: number;
  requiresPrescription: boolean;
}

interface MedicationSearchProps {
  onSelect: (medication: Medication) => void;
  selectedMedication?: Medication | null;
}

export function MedicationSearch({ onSelect, selectedMedication }: MedicationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams({ query: query.trim(), limit: "10" });
      const response = await fetch(`/api/medications/search?${params}`);
      const data = await response.json();
      setResults(data.medications || []);
    } catch (error) {
      console.error("Medication search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      {selectedMedication ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{selectedMedication.name}</h3>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">Generic:</span> {selectedMedication.genericName}</p>
                  {selectedMedication.brandName && (
                    <p><span className="font-medium">Brand:</span> {selectedMedication.brandName}</p>
                  )}
                  <p><span className="font-medium">Form:</span> {selectedMedication.dosageForm}</p>
                  <p><span className="font-medium">Strength:</span> {selectedMedication.strength}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{selectedMedication.category}</Badge>
                    {selectedMedication.requiresPrescription && (
                      <Badge variant="outline">Rx Required</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelect(null as any)}
                data-testid="button-clear-medication"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                data-testid="input-search-medication"
              />
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              data-testid="button-search-medication"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((medication) => (
                <Card
                  key={medication.id}
                  className="hover-elevate active-elevate-2 cursor-pointer transition-shadow"
                  onClick={() => {
                    onSelect(medication);
                    setQuery("");
                    setResults([]);
                  }}
                  data-testid={`medication-result-${medication.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-foreground">{medication.name}</h4>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p><span className="font-medium">Generic:</span> {medication.genericName}</p>
                          <p><span className="font-medium">Form:</span> {medication.dosageForm} - {medication.strength}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{medication.category}</Badge>
                            {medication.requiresPrescription && (
                              <Badge variant="outline" className="text-xs">Rx Required</Badge>
                            )}
                            <span className="text-xs font-semibold text-primary ml-auto">
                              ${medication.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {query && results.length === 0 && !isSearching && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground">
                <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No medications found. Try a different search term.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
