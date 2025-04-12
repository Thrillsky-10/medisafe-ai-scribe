
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  File,
  Image,
  Upload as UploadIcon,
  X,
  CheckCircle2,
  Loader2,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { fetchPatients } from "@/services/patientService";
import { uploadPrescriptionDocument, createPrescription } from "@/services/prescriptionService";

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [docType, setDocType] = useState("prescription");
  const [patientId, setPatientId] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [refills, setRefills] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const navigate = useNavigate();
  
  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  });
  
  // Get patient name from ID
  const selectedPatient = patients.find(p => p.id === patientId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast.error("Please select a patient");
      return;
    }
    
    if (!medicationName) {
      toast.error("Please enter medication name");
      return;
    }
    
    if (!dosage) {
      toast.error("Please enter dosage");
      return;
    }
    
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setOcrStatus("Uploading document...");
    try {
      // Upload document
      const uploadResult = await uploadPrescriptionDocument(uploadedFile, patientId);
      
      setIsUploading(false);
      setIsProcessing(true);
      setOcrStatus("Processing with OCR...");
      
      // Create prescription record
      await createPrescription({
        patient_id: patientId,
        patient_name: selectedPatient?.name || 'Unknown Patient',
        medication: medicationName,
        dosage: dosage,
        prescribed_date: new Date().toISOString(),
        refills: refills,
        status: 'active',
        document_url: uploadResult.url
      });

      toast.success("Prescription uploaded and processed successfully");
      navigate('/prescriptions');
    } catch (error: any) {
      toast.error(error.message || "Error processing document");
      setOcrStatus("");
    } finally {
      setIsProcessing(false);
      setOcrStatus("");
    }
  };

  // OCR Status component
  const OcrStatusIndicator = () => {
    if (!ocrStatus) return null;
    
    return (
      <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded mt-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm font-medium">{ocrStatus}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload Document</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Upload Medical Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type</Label>
                  <Select
                    value={docType}
                    onValueChange={setDocType}
                  >
                    <SelectTrigger id="docType">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="labResult">Lab Result</SelectItem>
                      <SelectItem value="medicalRecord">Medical Record</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient</Label>
                  <Select
                    value={patientId}
                    onValueChange={setPatientId}
                  >
                    <SelectTrigger id="patientId">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medication">Medication Name</Label>
                  <Input
                    id="medication"
                    placeholder="Enter medication name"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    placeholder="E.g. 10mg, twice daily"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refills">Refills</Label>
                  <Input
                    id="refills"
                    type="number"
                    min={0}
                    placeholder="Number of refills"
                    value={refills}
                    onChange={(e) => setRefills(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 ${
                  uploadedFile ? "border-primary" : "border-border"
                } text-center`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {!uploadedFile ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-muted rounded-full p-3">
                        <UploadIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Drag & drop file or{" "}
                        <label className="text-primary cursor-pointer hover:underline">
                          browse
                          <Input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports PDF, JPG, PNG (max 10MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-accent/30 p-3 rounded">
                    <div className="flex items-center space-x-3">
                      {uploadedFile.type.includes("pdf") ? (
                        <FileText className="h-8 w-8 text-primary" />
                      ) : (
                        <Image className="h-8 w-8 text-primary" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={removeFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <OcrStatusIndicator />

              <div className="bg-muted/30 rounded p-4 border border-muted flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Important</p>
                  <p className="text-muted-foreground">
                    All uploaded documents are encrypted and stored in compliance with
                    HIPAA regulations. Ensure that all PHI is properly contained within
                    the document before uploading.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || isProcessing || !uploadedFile || !patientId || !medicationName || !dosage}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="mr-2 h-4 w-4" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Processing information */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              How Documents Are Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Secure Upload</p>
                  <p className="text-sm text-muted-foreground">
                    Documents are encrypted and stored in a HIPAA-compliant cloud storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">AI-Powered OCR</p>
                  <p className="text-sm text-muted-foreground">
                    Our LayoutLMv3 AI model extracts structured data from your documents.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Data Validation</p>
                  <p className="text-sm text-muted-foreground">
                    Medical entities like medications and dosages are verified and standardized.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Searchable Database</p>
                  <p className="text-sm text-muted-foreground">
                    Documents and their data become instantly searchable and available for analytics.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
