
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PrescriptionSearchProps {
  onSearch: (searchTerm: string) => void;
}

export const PrescriptionSearch = ({ onSearch }: PrescriptionSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by patient name or mobile number..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};
