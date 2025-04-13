
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
  FileText,
  Image,
  Upload as UploadIcon,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { fetchPatients, seedPatientsIfEmpty } from "@/services/patientService";
import {
  uploadPrescriptionDocument,
  processPrescriptionDocument,
  createPrescription,
} from "@/services/prescriptionService";
import { createWorker } from "tesseract.js";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form schema for validation
const formSchema = z.object({
  docType: z.string().min(1, "Please select a document type"),
  patientId: z.string().min(1, "Please select a patient"),
  medicationName: z.string().min(1, "Please enter medication name"),
  dosage: z.string().min(1, "Please enter dosage"),
  refills: z.number().min(0, "Refills must be 0 or greater")
});

type FormValues = z.infer<typeof formSchema>;

const Upload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrData, setOcrData] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const navigate = useNavigate();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      docType: "prescription",
      patientId: "",
      medicationName: "",
      dosage: "",
      refills: 0
    }
  });

  // Seed patients on component mount
  useEffect(() => {
    seedPatientsIfEmpty();
  }, []);

  // Fetch patients for the dropdown
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

  // Get patient name from ID
  const selectedPatient = patients.find((p) => p.id === form.watch("patientId"));

  // Create a file URL for preview
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // If we have a file and a patient is selected, trigger OCR processing
      if (file && form.getValues("patientId")) {
        performOcr(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      
      // If we have a file and a patient is selected, trigger OCR processing
      if (file && form.getValues("patientId")) {
        performOcr(file);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileUrl(null);
    setOcrData(null);
    setPreviewData(null);
  };

  // Perform OCR on the uploaded file
  const performOcr = async (file: File) => {
    setOcrStatus("Extracting text from document...");
    setPreviewData(null);
    
    try {
      // For images, use Tesseract.js
      if (file.type.startsWith('image/')) {
        // Create file URL for Tesseract
        const imageUrl = URL.createObjectURL(file);
        
        try {
          // Initialize worker with language and options
          const worker = await createWorker('eng', {
            logger: m => console.log(m),
            errorHandler: err => console.error('Tesseract error:', err)
          });
          
          // Configure recognizer
          await worker.setParameters({
            tessedit_ocr_engine_mode: 1, // Use LSTM only
            preserve_interword_spaces: 1
          });
          
          // Recognize text
          const { data } = await worker.recognize(imageUrl);
          
          // Clean up
          URL.revokeObjectURL(imageUrl);
          await worker.terminate();
          
          if (data && data.text) {
            handleExtractedText(data.text);
          } else {
            throw new Error('No text was extracted from the image');
          }
        } catch (ocrError) {
          console.error("OCR Error:", ocrError);
          toast.error("Could not extract text from the image. Please try another file or enter information manually.");
          setOcrStatus("");
        }
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll use the manually entered data since client-side PDF text extraction is complex
        toast.info("PDF processing: Please enter the prescription details manually.");
        setOcrStatus("");
      } else {
        toast.warning("Unsupported file type. Please upload an image (JPG, PNG) or PDF.");
        setOcrStatus("");
      }
    } catch (error) {
      console.error("OCR Processing Error:", error);
      toast.error("Error processing the document. Please try again or enter information manually.");
      setOcrStatus("");
    }
  };

  // Handle the extracted text from OCR
  const handleExtractedText = async (text: string) => {
    try {
      console.log("Extracted text:", text);
      
      // Auto-fill form fields based on OCR
      const medicationMatch = text.match(/medication:?\s*([\w\s\-]+)/i) || 
                             text.match(/med:?\s*([\w\s\-]+)/i) ||
                             text.match(/prescribed:?\s*([\w\s\-]+)/i) ||
                             text.match(/drug:?\s*([\w\s\-]+)/i);
      
      const dosageMatch = text.match(/dosage:?\s*([\w\s\.\/\-]+)/i) || 
                          text.match(/dose:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/take:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/daily:?\s*([\w\s\.\/\-]+)/i);
      
      const refillsMatch = text.match(/refill[s]?:?\s*(\d+)/i) || 
                           text.match(/repeats:?\s*(\d+)/i) ||
                           text.match(/repeat:?\s*(\d+)/i);
      
      // Update form values if matches found
      const medicationValue = medicationMatch && medicationMatch[1].trim();
      const dosageValue = dosageMatch && dosageMatch[1].trim();
      const refillsValue = refillsMatch ? parseInt(refillsMatch[1]) : 0;
      
      if (medicationValue && medicationValue !== "Unknown") {
        form.setValue("medicationName", medicationValue);
      }
      
      if (dosageValue && dosageValue !== "Unknown") {
        form.setValue("dosage", dosageValue);
      }
      
      if (refillsMatch) {
        form.setValue("refills", refillsValue);
      }
      
      // Set preview data
      setPreviewData({
        medication: medicationValue || "Not detected",
        dosage: dosageValue || "Not detected",
        refills: refillsValue,
      });
      
      setOcrStatus("");
      toast.success("Document processed successfully!");
    } catch (error) {
      console.error("Error processing text:", error);
      toast.error("Error extracting information from document. Please enter details manually.");
      setOcrStatus("");
    }
  };

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setOcrStatus("Uploading document...");
      
      // Upload the document to storage
      const uploadResult = await uploadPrescriptionDocument(
        uploadedFile,
        values.patientId
      );
      
      setOcrStatus("Processing document...");
      setIsUploading(false);
      setIsProcessing(true);
      
      // Use the form values directly for the prescription data
      const prescription = await createPrescription({
        patient_id: values.patientId,
        medication: values.medicationName,
        dosage: values.dosage,
        refills: values.refills,
        document_url: uploadResult.url
      });
      
      if (!prescription) {
        throw new Error("Failed to create prescription");
      }
      
      // Process the document with the edge function (for future AI analysis)
      try {
        // Get OCR text from the file if not already processed
        let extractedText = "";
        if (previewData) {
          // Create a simple text representation of the extracted data
          extractedText = `Medication: ${previewData.medication}\nDosage: ${previewData.dosage}\nRefills: ${previewData.refills}`;
        } else if (uploadedFile.type.startsWith('image/')) {
          // For images, create a URL for Tesseract
          const imageUrl = URL.createObjectURL(uploadedFile);
          try {
            const worker = await createWorker("eng");
            const { data } = await worker.recognize(imageUrl);
            extractedText = data.text;
            await worker.terminate();
            URL.revokeObjectURL(imageUrl);
          } catch (ocrError) {
            console.error("OCR Error:", ocrError);
            extractedText = "OCR processing failed";
          }
        }
        
        // Send to Supabase Edge Function
        const processResult = await processPrescriptionDocument(
          uploadResult.url,
          uploadResult.path,
          values.patientId,
          extractedText
        );
        
        console.log("Document processing result:", processResult);
      } catch (processError) {
        // Don't fail if the edge function processing fails
        console.error("Edge function error:", processError);
      }
      
      toast.success("Prescription uploaded and created successfully");
      navigate("/prescriptions");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error processing document");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setOcrStatus("");
    }
  };

  // React to patient ID change
  useEffect(() => {
    const patientId = form.watch("patientId");
    if (patientId && uploadedFile) {
      performOcr(uploadedFile);
    }
  }, [form.watch("patientId")]);

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

  // Document preview component
  const DocumentPreview = () => {
    if (!previewData) return null;

    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Extracted Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medication</p>
                <p className="font-medium">{previewData.medication}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                <p className="font-medium">{previewData.dosage}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Refills</p>
                <p className="font-medium">{previewData.refills}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // File Preview component
  const FilePreview = () => {
    if (!fileUrl || !uploadedFile) return null;
    
    return (
      <Card className="mt-4 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFile.type.startsWith('image/') && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border">
              <img 
                src={fileUrl} 
                alt="Document preview"
                className="object-contain w-full h-full"
              />
            </div>
          )}
          
          {uploadedFile.type === 'application/pdf' && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                PDF preview not available. The file will be uploaded and processed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="docType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prescription">Prescription</SelectItem>
                            <SelectItem value="labResult">Lab Result</SelectItem>
                            <SelectItem value="medicalRecord">Medical Record</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={isLoadingPatients}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoadingPatients
                                    ? "Loading patients..."
                                    : "Select patient"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medicationName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Medication Name</FormLabel>
                          {previewData && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Auto-filled
                            </div>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Enter medication name"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Dosage</FormLabel>
                          {previewData && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Auto-filled
                            </div>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            placeholder="E.g. 10mg, twice daily"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="refills"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Refills</FormLabel>
                          {previewData && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Auto-filled
                            </div>
                          )}
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Number of refills"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
                        {uploadedFile.type.includes('pdf') ? (
                          <FileText className="h-8 w-8 text-primary" />
                        ) : (
                          <Image className="h-8 w-8 text-primary" />
                        )}
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            {uploadedFile.name}
                          </p>
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
                <FilePreview />
                <DocumentPreview />

                <div className="bg-muted/30 rounded p-4 border border-muted flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Important</p>
                    <p className="text-muted-foreground">
                      All uploaded documents are encrypted and stored in
                      compliance with HIPAA regulations. Ensure that all PHI is
                      properly contained within the document before uploading.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isUploading ||
                      isProcessing ||
                      !uploadedFile
                    }
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
            </Form>
          </CardContent>
        </Card>

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
                    Documents are encrypted and stored in a HIPAA-compliant
                    cloud storage.
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
                    Our AI model extracts structured data from your
                    documents.
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
                    Medical entities like medications and dosages are verified
                    and standardized.
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
                    Documents and their data become instantly searchable and
                    available for analytics.
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
