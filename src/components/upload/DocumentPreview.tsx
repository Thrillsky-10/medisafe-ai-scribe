
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface DocumentPreviewProps {
  previewData: {
    medication?: string;
    dosage?: string;
    refills?: number;
  } | null;
}

export const DocumentPreview = ({ previewData }: DocumentPreviewProps) => {
  if (!previewData) return null;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Extracted Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Medication</dt>
            <dd className="mt-1 text-sm">{previewData.medication || 'Not detected'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Dosage</dt>
            <dd className="mt-1 text-sm">{previewData.dosage || 'Not detected'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Refills</dt>
            <dd className="mt-1 text-sm">{previewData.refills !== undefined ? previewData.refills : 'Not detected'}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
