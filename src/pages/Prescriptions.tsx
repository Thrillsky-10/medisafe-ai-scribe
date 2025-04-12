
import { useState } from "react";
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
import { FileText, Download, EyeIcon, Filter, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";

const Prescriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Mock prescription data
  const prescriptions = [
    {
      id: "RX-2025-0142",
      patientName: "Sarah Johnson",
      patientId: "PT-0021",
      medication: "Lisinopril 10mg",
      dosage: "1 tablet daily",
      prescribedDate: "2025-04-02",
      refills: 2,
      status: "active",
    },
    {
      id: "RX-2025-0138",
      patientName: "Michael Chen",
      patientId: "PT-0015",
      medication: "Metformin 500mg",
      dosage: "1 tablet twice daily",
      prescribedDate: "2025-04-01",
      refills: 3,
      status: "active",
    },
    {
      id: "RX-2025-0134",
      patientName: "Emily Rodriguez",
      patientId: "PT-0018",
      medication: "Atorvastatin 20mg",
      dosage: "1 tablet at bedtime",
      prescribedDate: "2025-03-30",
      refills: 5,
      status: "active",
    },
    {
      id: "RX-2025-0129",
      patientName: "James Wilson",
      patientId: "PT-0034",
      medication: "Omeprazole 20mg",
      dosage: "1 capsule before breakfast",
      prescribedDate: "2025-03-28",
      refills: 1,
      status: "active",
    },
    {
      id: "RX-2025-0124",
      patientName: "David Thompson",
      patientId: "PT-0027",
      medication: "Amoxicillin 500mg",
      dosage: "1 capsule three times daily",
      prescribedDate: "2025-03-25",
      refills: 0,
      status: "completed",
    },
    {
      id: "RX-2025-0118",
      patientName: "Sarah Johnson",
      patientId: "PT-0021",
      medication: "Azithromycin 250mg",
      dosage: "1 tablet daily for 5 days",
      prescribedDate: "2025-03-20",
      refills: 0,
      status: "completed",
    },
    {
      id: "RX-2025-0112",
      patientName: "Robert Garcia",
      patientId: "PT-0019",
      medication: "Prednisone 10mg",
      dosage: "Tapering dose as directed",
      prescribedDate: "2025-03-15",
      refills: 0,
      status: "expired",
    },
  ];

  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.medication.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Prescription Records</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="whitespace-nowrap">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button className="whitespace-nowrap">
              <FileText className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
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
            <Select defaultValue="all">
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
            <Select defaultValue="newest">
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
              {filteredPrescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No prescriptions found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-medium">{rx.id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{rx.patientName}</div>
                        <div className="text-xs text-muted-foreground">{rx.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{rx.medication}</TableCell>
                    <TableCell>{rx.dosage}</TableCell>
                    <TableCell>{new Date(rx.prescribedDate).toLocaleDateString()}</TableCell>
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
                        <Button size="icon" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(filteredPrescriptions.length, 10)} of{" "}
            {filteredPrescriptions.length} prescriptions
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
              disabled={filteredPrescriptions.length <= 10}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Prescriptions;
