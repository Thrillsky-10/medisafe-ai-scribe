
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

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const itemsPerPage = 10;

  // Fetch prescriptions with filters
  const { 
    data: prescriptions = [], 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['prescriptions', searchTerm, status, sortOrder],
    queryFn: () => fetchPrescriptions(searchTerm, status, sortOrder),
  });

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast.success("Prescription data refreshed");
  };

  // Calculate pagination
  const totalPages = Math.ceil(prescriptions.length / itemsPerPage);
  const paginatedPrescriptions = prescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
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

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prescriptions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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

        {/* Prescriptions table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Refills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No prescriptions found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPrescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-medium">{rx.id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{rx.patient_name}</div>
                        <div className="text-xs text-muted-foreground">{rx.patient_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{rx.medication}</TableCell>
                    <TableCell>{rx.dosage}</TableCell>
                    <TableCell>{formatDate(rx.prescribed_date)}</TableCell>
                    <TableCell>{rx.refills}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rx.status === "active"
                            ? "bg-primary/20 text-primary"
                            : rx.status === "completed"
                            ? "bg-muted text-muted-foreground"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        {rx.document_url && (
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => window.open(rx.document_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
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
