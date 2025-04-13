
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { UploadForm } from "@/components/upload/UploadForm";
import { ProcessingInfo } from "@/components/upload/ProcessingInfo";
import { fetchPatients, seedPatientsIfEmpty } from "@/services/patientService";

const Upload = () => {
  useEffect(() => {
    seedPatientsIfEmpty();
  }, []);

  const { data: patients = [], isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: fetchPatients,
  });

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
            <UploadForm 
              patients={patients} 
              isLoadingPatients={isLoadingPatients} 
            />
          </CardContent>
        </Card>

        <ProcessingInfo />
      </div>
    </AppLayout>
  );
};

export default Upload;
