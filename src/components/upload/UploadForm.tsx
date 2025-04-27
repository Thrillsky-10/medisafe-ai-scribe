
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createWorker } from 'tesseract.js';
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload as UploadIcon } from "lucide-react";
import { FileUploader } from "./FileUploader";
import { OcrStatusIndicator } from "./OcrStatusIndicator";
import { FilePreview } from "./FilePreview";
import { uploadPrescriptionDocument, processPrescriptionDocument } from "@/services/prescriptionService";
import { Patient } from "@/types/database.types";

const formSchema = z.object({
  patientName: z.string().min(1, "Please enter patient name"),
  patientMobile: z.string().min(10, "Please enter a valid mobile number"),
});

type FormValues = z.infer<typeof formSchema>;

// Define proper props interface for UploadForm
interface UploadFormProps {
  patients?: Patient[];
  isLoadingPatients?: boolean;
}

export const UploadForm = ({ patients = [], isLoadingPatients = false }: UploadFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientMobile: "",
    }
  });

  const handleFileChange = (files: File[]) => {
    setUploadedFiles(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setFileUrls(urls);
  };

  const onSubmit = async (values: FormValues) => {
    if (uploadedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setIsUploading(true);
      setOcrStatus("Uploading documents...");

      // Process each file sequentially
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setOcrStatus(`Uploading document ${i + 1} of ${uploadedFiles.length}...`);
        
        console.log('Starting upload for file:', file.name);
        
        const uploadResult = await uploadPrescriptionDocument(
          file,
          values.patientName,
          values.patientMobile
        );

        if (!uploadResult || !uploadResult.patient_id) {
          throw new Error(`Failed to upload document ${i + 1}`);
        }

        console.log('Upload successful, processing document:', uploadResult);
        
        setOcrStatus(`Processing document ${i + 1} of ${uploadedFiles.length}...`);
        setIsUploading(false);
        setIsProcessing(true);

        try {
          let extractedText = "";
          if (file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            const worker = await createWorker("eng");
            const { data } = await worker.recognize(imageUrl);
            extractedText = data.text;
            await worker.terminate();
            URL.revokeObjectURL(imageUrl);
          } else if (file.type === 'application/pdf') {
            extractedText = `Prescription scan for ${values.patientName}`;
          }

          console.log("Extracted text:", extractedText ? extractedText.substring(0, 100) + "..." : "none");

          const processResult = await processPrescriptionDocument(
            uploadResult.url,
            uploadResult.path,
            uploadResult.patient_id,
            extractedText
          );

          console.log("Document processing result:", processResult);
          
          if (!processResult || processResult.error) {
            throw new Error(processResult?.error || "Unknown error during processing");
          }
        } catch (processError: any) {
          console.error("Processing error:", processError);
          toast.error(`Error processing document ${i + 1}: ${processError.message || "Unknown error"}`);
        }
      }

      toast.success("Documents uploaded and processed successfully");
      navigate("/prescriptions");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Error processing documents");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setOcrStatus("");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="patientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter patient name"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="patientMobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter mobile number"
                    type="tel"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FileUploader 
          uploadedFiles={uploadedFiles}
          onFileChange={handleFileChange}
          isUploading={isUploading}
          multiple={true}
        />

        <OcrStatusIndicator ocrStatus={ocrStatus} />
        
        {fileUrls.map((url, index) => (
          <FilePreview 
            key={index}
            fileUrl={url} 
            uploadedFile={uploadedFiles[index]} 
          />
        ))}

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
            disabled={isUploading || isProcessing}
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
