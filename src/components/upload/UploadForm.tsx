
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload as UploadIcon, Loader2 } from "lucide-react";
import { PatientDetailsForm, PatientFormData } from "./PatientDetailsForm";
import { MultiFileUploader } from "./MultiFileUploader";
import { uploadPrescriptionDocument } from "@/services/prescriptionService";
import { supabase } from "@/lib/supabase";

export const UploadForm = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patientDetails, setPatientDetails] = useState<PatientFormData | null>(null);
  const navigate = useNavigate();

  const handlePatientDetails = async (data: PatientFormData) => {
    try {
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
      toast.success("Patient details saved");
    } catch (error) {
      console.error("Error saving patient details:", error);
      toast.error("Error saving patient details. Please try again.");
    }
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
      const uploadPromises = selectedFiles.map(file => 
        uploadPrescriptionDocument(file, patientDetails.mobile)
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
      <PatientDetailsForm 
        onSubmit={handlePatientDetails}
        isSubmitting={isUploading}
      />

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
