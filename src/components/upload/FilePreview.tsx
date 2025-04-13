
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText } from "lucide-react";

interface FilePreviewProps {
  fileUrl: string | null;
  uploadedFile: File | null;
}

export const FilePreview = ({ fileUrl, uploadedFile }: FilePreviewProps) => {
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
