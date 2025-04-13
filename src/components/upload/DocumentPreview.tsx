
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PreviewData {
  medication: string;
  dosage: string;
  refills: number;
}

interface DocumentPreviewProps {
  previewData: PreviewData | null;
}

export const DocumentPreview = ({ previewData }: DocumentPreviewProps) => {
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
