
import { Loader2 } from "lucide-react";

interface OcrStatusIndicatorProps {
  ocrStatus: string;
}

export const OcrStatusIndicator = ({ ocrStatus }: OcrStatusIndicatorProps) => {
  if (!ocrStatus) return null;

  return (
    <div className="flex items-center space-x-2 bg-primary/10 p-3 rounded mt-4">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <p className="text-sm font-medium">{ocrStatus}</p>
    </div>
  );
};
