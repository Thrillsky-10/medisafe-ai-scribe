
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchMedications } from "@/services/medicationService";

interface MedicationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MedicationSearch({ value, onChange }: MedicationSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize search term with value prop
    if (value) {
      setSearchTerm(value);
    }
  }, [value]);

  useEffect(() => {
    // Don't search for empty terms
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce search requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchMedications(searchTerm);
        setSuggestions(results);
      } catch (error) {
        console.error("Error searching medications:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearchTerm(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex w-full items-center">
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onChange(e.target.value);
            }}
            onClick={() => setOpen(true)}
            placeholder="Search medications..."
            className="w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full" align="start">
        <Command>
          <CommandInput 
            placeholder="Search medications..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No medication found."}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((medication) => (
                <CommandItem
                  key={medication}
                  value={medication}
                  onSelect={() => handleSelect(medication)}
                >
                  {medication}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === medication ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
