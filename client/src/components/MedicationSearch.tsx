import { useState, useEffect, useRef } from "react";
import { Search, Pill, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Medication {
  name: string;
  rxcui: string;
  score: string;
}

interface MedicationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MedicationSearch({ value, onChange, placeholder = "Search medications...", className }: MedicationSearchProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Medication[]>([]);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchMedications = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/medications/search?q=${encodeURIComponent(term)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search medications');
      }

      const data = await response.json();
      setSearchResults(data.medications || []);
      setShowResults(true);
    } catch (error) {
      console.error('Medication search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchMedications(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleSelectMedication = (medication: Medication) => {
    onChange(medication.name);
    setSearchTerm(medication.name);
    setShowResults(false);
  };

  const handleClear = () => {
    onChange("");
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
          onChange={handleInputChange}
          onFocus={() => searchTerm && searchResults.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          data-testid="input-medication-search"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            data-testid="button-clear-medication"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <Command>
            <CommandList>
              <CommandGroup>
                {searchResults.map((medication) => (
                  <CommandItem
                    key={medication.rxcui}
                    value={medication.name}
                    onSelect={() => handleSelectMedication(medication)}
                    className="cursor-pointer"
                    data-testid={`medication-result-${medication.rxcui}`}
                  >
                    <Pill className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{medication.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}

      {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-sm text-muted-foreground text-center">
          No medications found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}
