
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { UploadForm } from "@/components/upload/UploadForm";
import { ProcessingInfo } from "@/components/upload/ProcessingInfo";
import { ChatInterface } from "@/components/chat/ChatInterface";
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PrescriptiBot</h1>
        <p className="text-muted-foreground mb-6">Upload and process medical documents with AI assistance</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
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

          <div>
            <ChatInterface />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Upload;
