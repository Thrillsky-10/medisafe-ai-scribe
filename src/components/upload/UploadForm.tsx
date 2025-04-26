
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { PatientDetailsForm, PatientFormData } from "./PatientDetailsForm";
import { MultiFileUploader } from "./MultiFileUploader";
import { uploadPrescriptionDocument } from "@/services/prescriptionService";

export const UploadForm = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientFormData | null>(null);
  const navigate = useNavigate();

  const handlePatientDetails = (data: PatientFormData) => {
    setPatientDetails(data);
    toast.success("Patient details saved");
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
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
      // Create a temporary patient ID using timestamp and random number
      const tempPatientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const uploadPromises = selectedFiles.map(file => 
        uploadPrescriptionDocument(file, tempPatientId)
      );

      await Promise.all(uploadPromises);

      toast.success("All files uploaded successfully");
      navigate("/prescriptions");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PatientDetailsForm onSubmit={handlePatientDetails} />

      {patientDetails && (
        <>
          <div className="border-t pt-6">
            <MultiFileUploader 
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              maxSize={10}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/prescriptions")}
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
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
