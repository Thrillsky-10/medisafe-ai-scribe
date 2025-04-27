
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OcrStatusIndicatorProps {
  ocrStatus: string;
}

export const OcrStatusIndicator = ({ ocrStatus }: OcrStatusIndicatorProps) => {
  if (!ocrStatus) return null;

  // Determine progress value based on status message
  let progressValue = 50; // Default for general processing
  
  if (ocrStatus.includes("Uploading")) {
    progressValue = 25;
  } else if (ocrStatus.includes("Processing")) {
    progressValue = 75;
  }

  return (
    <div className="space-y-2 bg-primary/10 p-4 rounded mt-4">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <p className="text-sm font-medium">{ocrStatus}</p>
      </div>
      <Progress 
        value={progressValue}
        className="h-1"
      />
    </div>
  );
};
