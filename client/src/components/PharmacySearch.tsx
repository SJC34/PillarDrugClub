import { useState, useEffect } from "react";
import { Search, MapPin, Phone, Building, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PharmacyData {
  npi: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  taxonomy?: string;
}

interface PharmacySearchProps {
  onPharmacySelect: (pharmacy: PharmacyData | null) => void;
  selectedPharmacy?: PharmacyData | null;
  className?: string;
}

export function PharmacySearch({ onPharmacySelect, selectedPharmacy, className }: PharmacySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PharmacyData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Format NPI API response for pharmacies
  const formatPharmacy = (item: any): PharmacyData => {
    // API returns: [name, npi, taxonomy, fullAddress]
    const fullAddress = item[3] || "";
    const addressParts = parseAddress(fullAddress);
    
    return {
      name: item[0] || "",
      npi: item[1] || "",
      taxonomy: item[2] || "",
      address: addressParts.street,
      city: addressParts.city,
      state: addressParts.state,
      zipCode: addressParts.zip,
      phone: ""
    };
  };
  
  // Parse full address string into components
  const parseAddress = (fullAddress: string) => {
    // Format: "STREET, CITY, STATE ZIP"
    const parts = fullAddress.split(",").map(p => p.trim());
    
    if (parts.length >= 3) {
      const street = parts[0];
      const city = parts[1];
      const stateZip = parts[2].split(" ");
      const state = stateZip[0] || "";
      const zip = stateZip.slice(1).join(" ");
      
      return { street, city, state, zip };
    }
    
    return {
      street: fullAddress,
      city: "",
      state: "",
      zip: ""
    };
  };

  const searchPharmacies = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Search NPI organization database for pharmacies
      const response = await fetch(
        `https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=${encodeURIComponent(term)}&maxList=50`
      );

      if (!response.ok) {
        throw new Error("Failed to search pharmacy database");
      }

      const data = await response.json();
      const results: PharmacyData[] = [];

      // Process organizations
      if (data[3] && Array.isArray(data[3])) {
        const pharmacies = data[3]
          .map(formatPharmacy)
          // Filter to only show pharmacy-related organizations
          .filter((pharmacy: PharmacyData) => {
            const nameUpper = pharmacy.name.toUpperCase();
            const taxonomyUpper = (pharmacy.taxonomy || "").toUpperCase();
            return (
              nameUpper.includes("PHARM") ||
              nameUpper.includes("DRUG") ||
              nameUpper.includes("RX") ||
              taxonomyUpper.includes("PHARMACIST") ||
              taxonomyUpper.includes("PHARMACY")
            );
          });
        results.push(...pharmacies);
      }

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Pharmacy search error:", error);
      setSearchError("Failed to search pharmacy database. Please try again or enter pharmacy information manually.");
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPharmacies(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePharmacySelect = (pharmacy: PharmacyData) => {
    onPharmacySelect(pharmacy);
    setShowResults(false);
    setSearchTerm("");
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Selected Pharmacy Display */}
        {selectedPharmacy && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {selectedPharmacy.name}
                    </h3>
                  </div>
                  
                  {selectedPharmacy.taxonomy && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      {selectedPharmacy.taxonomy}
                    </Badge>
                  )}
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedPharmacy.address}, {selectedPharmacy.city}, {selectedPharmacy.state} {selectedPharmacy.zipCode}</span>
                    </div>
                    {selectedPharmacy.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhoneNumber(selectedPharmacy.phone)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPharmacySelect(null)}
                  data-testid="button-clear-pharmacy"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Input */}
        {!selectedPharmacy && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for pharmacies by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
                data-testid="input-pharmacy-search"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {searchError && (
              <p className="text-sm text-destructive mt-2">{searchError}</p>
            )}
          </div>
        )}

        {/* Search Results */}
        {showResults && searchResults.length > 0 && !selectedPharmacy && (
          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {searchResults.map((pharmacy, index) => (
                <div key={`${pharmacy.npi}-${index}`}>
                  <button
                    onClick={() => handlePharmacySelect(pharmacy)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`button-select-pharmacy-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {pharmacy.name}
                          </h4>
                          {pharmacy.taxonomy && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {pharmacy.taxonomy}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{pharmacy.address}, {pharmacy.city}, {pharmacy.state} {pharmacy.zipCode}</span>
                          </div>
                          {pharmacy.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{formatPhoneNumber(pharmacy.phone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  {index < searchResults.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {showResults && searchResults.length === 0 && !isSearching && searchTerm.length >= 2 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                No pharmacies found for "{searchTerm}". 
                <br />
                Try a different search term or enter pharmacy information manually below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
