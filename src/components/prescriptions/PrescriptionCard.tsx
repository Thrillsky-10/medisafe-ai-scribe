
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Prescription } from "@/types/database.types";

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard = ({ prescription }: PrescriptionCardProps) => {
  const handleView = () => {
    if (prescription.document_url) {
      window.open(prescription.document_url, '_blank');
    }
  };

  const handleDownload = async () => {
    if (prescription.document_url) {
      const response = await fetch(prescription.document_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescription.id}.${blob.type.split('/')[1]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          {prescription.document_url && (
            <AspectRatio ratio={4/3} className="bg-muted">
              <img
                src={prescription.document_url}
                alt="Prescription"
                className="object-cover w-full h-full rounded-md"
              />
            </AspectRatio>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">{prescription.patient_name}</h3>
            <p className="text-sm text-muted-foreground">
              Date: {formatDate(prescription.prescribed_date)}
            </p>
            {prescription.medication && (
              <p className="text-sm">
                Medication: {prescription.medication}
              </p>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleView}
                disabled={!prescription.document_url}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleDownload}
                disabled={!prescription.document_url}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
