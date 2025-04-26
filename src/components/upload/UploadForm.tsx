
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { PatientDetailsForm, PatientFormData } from "./PatientDetailsForm";
import { MultiFileUploader } from "./MultiFileUploader";
import { uploadPrescriptionDocument } from "@/services/prescriptionService";
import { supabase } from "@/lib/supabase";
import { OcrStatusIndicator } from "./OcrStatusIndicator";
import { createWorker } from "tesseract.js";

export const UploadForm = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientFormData | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const navigate = useNavigate();

  const handlePatientDetails = async (data: PatientFormData) => {
    try {
      setOcrStatus("Validating patient information...");
      // Check if patient exists or create new one
      const { data: existingPatient, error: searchError } = await supabase
        .from('patients')
        .select()
        .eq('mobile', data.mobile)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (!existingPatient) {
        const { error: createError } = await supabase
          .from('patients')
          .insert([{ name: data.name, mobile: data.mobile }]);

        if (createError) throw createError;
      }

      setPatientDetails(data);
      setOcrStatus("");
      toast.success("Patient details saved");
    } catch (error) {
      console.error("Error saving patient details:", error);
      setOcrStatus("");
      toast.error("Error saving patient details. Please try again.");
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const processOCR = async (file: File): Promise<string> => {
    setOcrStatus(`Processing OCR for ${file.name}...`);
    try {
      // Use Tesseract.js for OCR processing
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      return text;
    } catch (error) {
      console.error("OCR processing error:", error);
      toast.error(`Error processing OCR for ${file.name}`);
      return "";
    }
  };

  const handleUpload = async () => {
    if (!patientDetails) {
      toast.error("Please enter patient details first");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);

    try {
      setOcrStatus("Preparing files for upload...");
      
      for (const file of selectedFiles) {
        setOcrStatus(`Uploading ${file.name}...`);
        // Upload the file to storage
        const { path, url } = await uploadPrescriptionDocument(file, patientDetails.mobile);
        
        // Process the uploaded file with OCR
        setOcrStatus(`Running OCR on ${file.name}...`);
        const extractedText = await processOCR(file);
        
        // Send the OCR results to process-document edge function
        setOcrStatus(`Processing document data for ${file.name}...`);
        
        await supabase.functions.invoke("process-document", {
          body: {
            documentUrl: url,
            documentPath: path,
            patientId: patientDetails.mobile,
            extractedText: extractedText
          }
        });
      }

      toast.success("All files uploaded and processed successfully");
      setOcrStatus("");
      navigate("/prescriptions");
    } catch (error) {
      console.error("Upload error:", error);
      setOcrStatus("");
      toast.error("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!patientDetails ? (
        <PatientDetailsForm 
          onSubmit={handlePatientDetails}
          isSubmitting={isUploading}
        />
      ) : (
        <>
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="font-medium">Patient Information</h3>
            <p className="text-sm mt-2">Name: {patientDetails.name}</p>
            <p className="text-sm">Mobile: {patientDetails.mobile}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setPatientDetails(null)}
              disabled={isUploading}
            >
              Edit
            </Button>
          </div>

          <div className="border-t pt-6">
            <MultiFileUploader 
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxSize={10}
            />
          </div>

          {ocrStatus && <OcrStatusIndicator ocrStatus={ocrStatus} />}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/prescriptions")}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
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
        </>
      )}
    </div>
  );
};
