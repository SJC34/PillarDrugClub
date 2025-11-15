import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Pill } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface AllergyAutocompleteProps {
  onSelect: (allergyName: string) => void;
  existingAllergies?: string[];
  placeholder?: string;
  className?: string;
}

export function AllergyAutocomplete({ 
  onSelect, 
  existingAllergies = [],
  placeholder = "Search for drug allergy...", 
  className 
}: AllergyAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchMedications = async (term: string, signal?: AbortSignal) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/medications/search?q=${encodeURIComponent(term)}`, { signal });
      
      if (!response.ok) {
        console.error('Medication search failed with status:', response.status);
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      const data = await response.json();
      
      const medications = data.medications || [];
      const uniqueMedications = medications
        .filter((med: any) => !existingAllergies.includes(med.name))
        .slice(0, 10);
      
      setSearchResults(uniqueMedications);
      setShowResults(uniqueMedications.length > 0);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Medication search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchMedications(searchTerm, abortController.signal);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchTerm, existingAllergies]);

  const handleSelectAllergy = (medication: any) => {
    onSelect(medication.name);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && searchResults.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          data-testid="input-allergy-autocomplete"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            data-testid="button-clear-allergy-search"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          <Command>
            <CommandList>
              <CommandGroup>
                {searchResults.map((medication) => (
                  <CommandItem
                    key={medication.rxcui}
                    value={medication.name}
                    onSelect={() => handleSelectAllergy(medication)}
                    className="cursor-pointer"
                    data-testid={`allergy-result-${medication.rxcui}`}
                  >
                    <Pill className="h-4 w-4 mr-2 text-red-500" />
                    <div className="flex flex-col">
                      <span className="font-medium">{medication.name}</span>
                      {medication.rxnormId && (
                        <span className="text-xs text-muted-foreground">
                          RxNorm: {medication.rxnormId}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            No medications found for "{searchTerm}"
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Try a different search term or contact support
          </p>
        </div>
      )}
    </div>
  );
}
