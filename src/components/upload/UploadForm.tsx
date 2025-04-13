
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Sparkles, Upload as UploadIcon } from "lucide-react";
import { createWorker } from "tesseract.js";

import { FileUploader } from "./FileUploader";
import { OcrStatusIndicator } from "./OcrStatusIndicator";
import { FilePreview } from "./FilePreview";
import { DocumentPreview } from "./DocumentPreview";
import { 
  uploadPrescriptionDocument, 
  processPrescriptionDocument, 
  createPrescription 
} from "@/services/prescriptionService";

const formSchema = z.object({
  docType: z.string().min(1, "Please select a document type"),
  patientId: z.string().min(1, "Please select a patient"),
  medicationName: z.string().min(1, "Please enter medication name"),
  dosage: z.string().min(1, "Please enter dosage"),
  refills: z.coerce.number().min(0, "Refills must be 0 or greater")
});

type FormValues = z.infer<typeof formSchema>;

interface UploadFormProps {
  patients: any[];
  isLoadingPatients: boolean;
}

export const UploadForm = ({ patients, isLoadingPatients }: UploadFormProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [autoProcess, setAutoProcess] = useState(true);
  const navigate = useNavigate();

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

  const selectedPatient = patients.find((p) => p.id === form.watch("patientId"));

  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  const handleFileChange = (file: File | null) => {
    setUploadedFile(file);
    if (file && form.getValues("patientId") && autoProcess) {
      performOcr(file);
    }
  };

  const performOcr = async (file: File) => {
    setOcrStatus("Extracting text from document...");
    setPreviewData(null);
    
    try {
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        
        try {
          const worker = await createWorker('eng');
          await worker.setParameters({
            tessedit_ocr_engine_mode: 1, 
            preserve_interword_spaces: 1
          });
          
          const { data } = await worker.recognize(imageUrl);
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
        toast.info("Processing PDF. This may take a moment.");
        setOcrStatus("PDF files require server-side processing...");
        // For PDFs, we'll extract text during the actual submission
        // Just show a placeholder for now
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

  const handleExtractedText = async (text: string) => {
    try {
      console.log("Extracted text:", text);
      
      const medicationMatch = text.match(/medication:?\s*([\w\s\-]+)/i) || 
                            text.match(/med:?\s*([\w\s\-]+)/i) ||
                            text.match(/prescribed:?\s*([\w\s\-]+)/i) ||
                            text.match(/drug:?\s*([\w\s\-]+)/i) ||
                            text.match(/rx:?\s*([\w\s\-]+)/i);
      
      const dosageMatch = text.match(/dosage:?\s*([\w\s\.\/\-]+)/i) || 
                          text.match(/dose:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/take:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/daily:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/sig:?\s*([\w\s\.\/\-]+)/i) ||
                          text.match(/(\d+\s*mg|\d+\s*ml|\d+\s*tablet|\d+\s*cap|once daily|twice daily|three times daily|every \d+ hours)/i);
      
      const refillsMatch = text.match(/refill[s]?:?\s*(\d+)/i) || 
                          text.match(/repeats:?\s*(\d+)/i) ||
                          text.match(/repeat:?\s*(\d+)/i) ||
                          text.match(/qty:?\s*(\d+)/i);
      
      // Check for common medication names if no direct mention
      let medicationValue = medicationMatch && medicationMatch[1].trim();
      if (!medicationValue) {
        const commonMeds = [
          'Lisinopril', 'Metformin', 'Amlodipine', 'Metoprolol', 'Atorvastatin',
          'Levothyroxine', 'Simvastatin', 'Omeprazole', 'Losartan', 'Albuterol',
          'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Amoxicillin'
        ];
        
        for (const med of commonMeds) {
          if (text.toLowerCase().includes(med.toLowerCase())) {
            medicationValue = med;
            break;
          }
        }
      }
      
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

  const onSubmit = async (values: FormValues) => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setOcrStatus("Uploading document...");
      
      const uploadResult = await uploadPrescriptionDocument(
        uploadedFile,
        values.patientId
      );
      
      setOcrStatus("Processing document...");
      setIsUploading(false);
      setIsProcessing(true);
      
      // Create a date string in YYYY-MM-DD format for the prescribed_date
      const currentDate = new Date().toISOString().split('T')[0];
      
      try {
        let extractedText = "";
        if (previewData) {
          extractedText = `Medication: ${previewData.medication}\nDosage: ${previewData.dosage}\nRefills: ${previewData.refills}`;
        } else if (uploadedFile.type.startsWith('image/')) {
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
        
        const processResult = await processPrescriptionDocument(
          uploadResult.url,
          uploadResult.path,
          values.patientId,
          extractedText
        );
        
        console.log("Document processing result:", processResult);
        
        if (processResult && processResult.prescription) {
          // Successfully processed via edge function, navigate to prescriptions
          toast.success("Prescription uploaded and processed successfully");
          navigate("/prescriptions");
          return;
        }
      } catch (processError) {
        console.error("Edge function error:", processError);
        // Continue with manual prescription creation if edge function fails
      }
      
      // Fallback to manual creation if edge function processing fails
      const prescription = await createPrescription({
        patient_id: values.patientId,
        medication: values.medicationName,
        dosage: values.dosage,
        refills: values.refills,
        document_url: uploadResult.url,
        prescribed_date: currentDate,
        status: 'active'
      });
      
      if (!prescription) {
        throw new Error("Failed to create prescription");
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

  useEffect(() => {
    const patientId = form.watch("patientId");
    if (patientId && uploadedFile && autoProcess) {
      performOcr(uploadedFile);
    }
  }, [form.watch("patientId")]);

  return (
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

        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox" 
              id="autoProcess"
              checked={autoProcess}
              onChange={(e) => setAutoProcess(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="autoProcess" className="text-sm font-medium">
              Auto-process documents (extract information automatically)
            </label>
          </div>
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
                    value={String(field.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FileUploader 
          uploadedFile={uploadedFile}
          onFileChange={handleFileChange}
          isUploading={isUploading}
        />

        <OcrStatusIndicator ocrStatus={ocrStatus} />
        <FilePreview fileUrl={fileUrl} uploadedFile={uploadedFile} />
        <DocumentPreview previewData={previewData} />

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
  );
};
