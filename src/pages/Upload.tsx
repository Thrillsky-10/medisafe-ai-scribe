
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from "@/components/upload/UploadForm";
import { ProcessingInfo } from "@/components/upload/ProcessingInfo";

const Upload = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-2">Upload Prescriptions</h1>
        <p className="text-muted-foreground mb-6">Add new prescriptions for processing</p>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Upload Prescription Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UploadForm />
            </CardContent>
          </Card>

          <ProcessingInfo />
        </div>
      </div>
    </AppLayout>
  );
};

export default Upload;
