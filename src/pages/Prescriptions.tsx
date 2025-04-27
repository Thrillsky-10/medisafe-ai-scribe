import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, EyeIcon, Filter, RefreshCw, Search, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { fetchPrescriptions } from "@/services/prescriptionService";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PrescriptionSearch } from "@/components/prescriptions/PrescriptionSearch";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const itemsPerPage = 10;

  const { 
    data: prescriptions = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['prescriptions', searchTerm],
    queryFn: () => fetchPrescriptions(searchTerm),
  });

  const handleRefresh = () => {
    refetch();
    toast.success("Prescription data refreshed");
  };

  const totalPages = Math.ceil(prescriptions.length / itemsPerPage);
  const paginatedPrescriptions = prescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, status, sortOrder]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Prescription Records</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="whitespace-nowrap" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Link to="/upload">
              <Button className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <PrescriptionSearch onSearch={setSearchTerm} />
          </div>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No prescriptions found matching your search.
            </div>
          ) : (
            paginatedPrescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
              />
            ))
          )}
        </div>

        {!isLoading && prescriptions.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(itemsPerPage * (currentPage - 1) + 1, prescriptions.length)} to {Math.min(currentPage * itemsPerPage, prescriptions.length)} of{" "}
              {prescriptions.length} prescriptions
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-w-8 px-3"
              >
                {currentPage}
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Prescriptions;
