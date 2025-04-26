
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, CheckCircle2 } from "lucide-react";

export const ProcessingInfo = () => {
  return (
    <Alert>
      <FileText className="h-4 w-4" />
      <AlertTitle>How Prescription Processing Works</AlertTitle>
      <AlertDescription className="mt-3">
        <p className="mb-2">Our system automatically processes prescription documents:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-sm">
          <li className="flex items-start">
            <span className="mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline text-green-500" />
            </span>
            <span>Enter the patient's name and mobile number</span>
          </li>
          <li className="flex items-start">
            <span className="mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline text-green-500" />
            </span>
            <span>Upload prescription images or PDF documents (up to 5 files)</span>
          </li>
          <li className="flex items-start">
            <span className="mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline text-green-500" />
            </span>
            <span>Our OCR system automatically extracts medication details</span>
          </li>
          <li className="flex items-start">
            <span className="mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline text-green-500" />
            </span>
            <span>Prescriptions are linked to the patient's profile for easy access</span>
          </li>
        </ol>
      </AlertDescription>
    </Alert>
  );
};
