import { useState, useEffect } from "react";
import { Search, MapPin, Phone, FileText, User, Building, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DoctorData {
  npi: string;
  name: string;
  credential?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  fax?: string;
  taxonomy?: string;
  organizationName?: string;
  isOrganization: boolean;
}

interface DoctorSearchProps {
  onDoctorSelect: (doctor: DoctorData | null) => void;
  selectedDoctor?: DoctorData | null;
  className?: string;
}

export function DoctorSearch({ onDoctorSelect, selectedDoctor, className }: DoctorSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DoctorData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Format NPI API response for individual providers
  const formatIndividualProvider = (item: any): DoctorData => {
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
      phone: "",
      fax: "",
      isOrganization: false
    };
  };

  // Format NPI API response for organizations
  const formatOrganization = (item: any): DoctorData => {
    // API returns: [name, npi, taxonomy, fullAddress]
    const fullAddress = item[3] || "";
    const addressParts = parseAddress(fullAddress);
    
    return {
      name: item[0] || "",
      organizationName: item[0] || "",
      npi: item[1] || "",
      taxonomy: item[2] || "",
      address: addressParts.street,
      city: addressParts.city,
      state: addressParts.state,
      zipCode: addressParts.zip,
      phone: "",
      fax: "",
      isOrganization: true
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

  const searchDoctors = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Search both individual providers and organizations
      const [individualResponse, organizationResponse] = await Promise.all([
        fetch(`https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search?terms=${encodeURIComponent(term)}&maxList=20`),
        fetch(`https://clinicaltables.nlm.nih.gov/api/npi_org/v3/search?terms=${encodeURIComponent(term)}&maxList=20`)
      ]);

      if (!individualResponse.ok || !organizationResponse.ok) {
        throw new Error("Failed to search doctor database");
      }

      const [individualData, organizationData] = await Promise.all([
        individualResponse.json(),
        organizationResponse.json()
      ]);

      const results: DoctorData[] = [];

      // Process individual providers
      if (individualData[3] && Array.isArray(individualData[3])) {
        const individuals = individualData[3].map(formatIndividualProvider);
        results.push(...individuals);
      }

      // Process organizations
      if (organizationData[3] && Array.isArray(organizationData[3])) {
        const organizations = organizationData[3].map(formatOrganization);
        results.push(...organizations);
      }

      // Sort results: prioritize those with fax numbers
      const sortedResults = results.sort((a, b) => {
        const aHasFax = a.fax && a.fax.trim() !== "";
        const bHasFax = b.fax && b.fax.trim() !== "";
        if (aHasFax && !bHasFax) return -1;
        if (!aHasFax && bHasFax) return 1;
        return 0;
      });
      
      setSearchResults(sortedResults);
      setShowResults(true);
    } catch (error) {
      console.error("Doctor search error:", error);
      setSearchError("Failed to search doctor database. Please try again or enter doctor information manually.");
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDoctors(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDoctorSelect = (doctor: DoctorData) => {
    onDoctorSelect(doctor);
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

  const getSpecialtyDisplay = (taxonomy: string) => {
    if (!taxonomy) return "";
    // Extract specialty from taxonomy code description
    const parts = taxonomy.split(" - ");
    return parts.length > 1 ? parts[1] : taxonomy;
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Selected Doctor Display */}
        {selectedDoctor && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedDoctor.isOrganization ? (
                      <Building className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                    <h3 className="font-semibold text-foreground">
                      {selectedDoctor.name}
                      {selectedDoctor.credential && !selectedDoctor.isOrganization && (
                        <span className="text-muted-foreground ml-1">{selectedDoctor.credential}</span>
                      )}
                    </h3>
                  </div>
                  
                  {selectedDoctor.taxonomy && (
                    <Badge variant="secondary" className="text-xs mb-2">
                      {getSpecialtyDisplay(selectedDoctor.taxonomy)}
                    </Badge>
                  )}
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedDoctor.address}, {selectedDoctor.city}, {selectedDoctor.state} {selectedDoctor.zipCode}</span>
                    </div>
                    {selectedDoctor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhoneNumber(selectedDoctor.phone)}</span>
                      </div>
                    )}
                    {selectedDoctor.fax && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{formatPhoneNumber(selectedDoctor.fax)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDoctorSelect(null)}
                  data-testid="button-clear-doctor"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Input */}
        {!selectedDoctor && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for doctors by name, specialty, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
                data-testid="input-doctor-search"
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
        {showResults && searchResults.length > 0 && !selectedDoctor && (
          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {searchResults.map((doctor, index) => (
                <div key={`${doctor.npi}-${index}`}>
                  <button
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`button-select-doctor-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      {doctor.isOrganization ? (
                        <Building className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      ) : (
                        <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">
                            {doctor.name}
                            {doctor.credential && !doctor.isOrganization && (
                              <span className="text-muted-foreground ml-1">{doctor.credential}</span>
                            )}
                          </h4>
                          {doctor.taxonomy && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {getSpecialtyDisplay(doctor.taxonomy)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{doctor.address}, {doctor.city}, {doctor.state} {doctor.zipCode}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {doctor.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{formatPhoneNumber(doctor.phone)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {doctor.fax ? (
                                <span>{formatPhoneNumber(doctor.fax)}</span>
                              ) : (
                                <span className="text-muted-foreground/60 italic">No fax on file</span>
                              )}
                            </div>
                          </div>
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
                No doctors found for "{searchTerm}". 
                <br />
                Try a different search term or enter doctor information manually below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}