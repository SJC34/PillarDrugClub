import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Search, Pill, Loader2, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface MedicationOption {
  id?: string;
  name: string;
  genericName: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  ndc?: string;
  isFromPdc: boolean;
  manufacturer?: string;
}

interface MedicationAutocompleteProps {
  onSelect: (medication: MedicationOption) => void;
  placeholder?: string;
  className?: string;
}

export function MedicationAutocomplete({ 
  onSelect, 
  placeholder = "Search medications...", 
  className 
}: MedicationAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [manualEntry, setManualEntry] = useState({
    medicationName: "",
    genericName: "",
    brandName: "",
    strength: "",
    dosageForm: "",
    externalSourceName: ""
  });

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
      const fullMedications = await Promise.all(
        medications.slice(0, 10).map(async (med: any) => {
          try {
            const detailResponse = await fetch(`/api/medications/${med.rxcui}`);
            if (detailResponse.ok) {
              return await detailResponse.json();
            }
            return null;
          } catch (e) {
            return null;
          }
        })
      );
      
      setSearchResults(fullMedications.filter(Boolean));
      setShowResults(fullMedications.filter(Boolean).length > 0);
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
  }, [searchTerm]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
  };

  const handleSelectMedication = (medication: any) => {
    const selectedMed: MedicationOption = {
      id: medication.id,
      name: medication.name,
      genericName: medication.genericName,
      brandName: medication.brandName,
      strength: medication.strength,
      dosageForm: medication.dosageForm,
      ndc: medication.ndc,
      isFromPdc: true,
      manufacturer: medication.manufacturer
    };
    
    onSelect(selectedMed);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleManualEntrySubmit = () => {
    if (!manualEntry.medicationName && !manualEntry.genericName) {
      return;
    }

    const medication: MedicationOption = {
      name: manualEntry.medicationName || manualEntry.genericName,
      genericName: manualEntry.genericName || manualEntry.medicationName,
      brandName: manualEntry.brandName || undefined,
      strength: manualEntry.strength || undefined,
      dosageForm: manualEntry.dosageForm || undefined,
      isFromPdc: false
    };

    onSelect(medication);
    setShowManualEntry(false);
    setManualEntry({
      medicationName: "",
      genericName: "",
      brandName: "",
      strength: "",
      dosageForm: "",
      externalSourceName: ""
    });
    setSearchTerm("");
  };

  return (
    <>
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
            data-testid="input-medication-autocomplete"
          />
          {searchTerm && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
              data-testid="button-clear-medication-search"
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
                      key={medication.id}
                      value={medication.name}
                      onSelect={() => handleSelectMedication(medication)}
                      className="cursor-pointer"
                      data-testid={`medication-result-${medication.id}`}
                    >
                      <Pill className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{medication.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {medication.genericName} {medication.strength && `• ${medication.strength}`}
                        </span>
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
            <p className="text-sm text-muted-foreground text-center mb-3">
              No medications found in our catalog for "{searchTerm}"
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setShowManualEntry(true);
                setManualEntry({ ...manualEntry, medicationName: searchTerm });
              }}
              data-testid="button-add-external-medication"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add from another pharmacy
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-manual-medication-entry">
          <DialogHeader>
            <DialogTitle>Add Medication from Another Pharmacy</DialogTitle>
            <DialogDescription>
              Enter the medication details from your current pharmacy. We'll still check for drug interactions and side effects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medication-name">Medication Name *</Label>
              <Input
                id="medication-name"
                value={manualEntry.medicationName}
                onChange={(e) => setManualEntry({ ...manualEntry, medicationName: e.target.value })}
                placeholder="e.g., Metformin"
                data-testid="input-manual-medication-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generic-name">Generic Name</Label>
              <Input
                id="generic-name"
                value={manualEntry.genericName}
                onChange={(e) => setManualEntry({ ...manualEntry, genericName: e.target.value })}
                placeholder="e.g., Metformin HCl"
                data-testid="input-manual-generic-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={manualEntry.brandName}
                onChange={(e) => setManualEntry({ ...manualEntry, brandName: e.target.value })}
                placeholder="e.g., Glucophage"
                data-testid="input-manual-brand-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  value={manualEntry.strength}
                  onChange={(e) => setManualEntry({ ...manualEntry, strength: e.target.value })}
                  placeholder="e.g., 500mg"
                  data-testid="input-manual-strength"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage-form">Dosage Form</Label>
                <Input
                  id="dosage-form"
                  value={manualEntry.dosageForm}
                  onChange={(e) => setManualEntry({ ...manualEntry, dosageForm: e.target.value })}
                  placeholder="e.g., Tablet"
                  data-testid="input-manual-dosage-form"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external-source">Pharmacy Name (Optional)</Label>
              <Input
                id="external-source"
                value={manualEntry.externalSourceName}
                onChange={(e) => setManualEntry({ ...manualEntry, externalSourceName: e.target.value })}
                placeholder="e.g., CVS, Walgreens"
                data-testid="input-manual-pharmacy-name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(false)}
              data-testid="button-cancel-manual-entry"
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualEntrySubmit}
              disabled={!manualEntry.medicationName && !manualEntry.genericName}
              data-testid="button-submit-manual-entry"
            >
              Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
