
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export const ProcessingInfo = () => {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          How Documents Are Processed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-2 shrink-0">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Secure Upload</p>
              <p className="text-sm text-muted-foreground">
                Documents are encrypted and stored in a HIPAA-compliant
                cloud storage.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-2 shrink-0">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">AI-Powered OCR</p>
              <p className="text-sm text-muted-foreground">
                Our AI model automatically extracts structured data from your
                documents with minimal manual input needed.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-2 shrink-0">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Data Validation</p>
              <p className="text-sm text-muted-foreground">
                Medical entities like medications and dosages are verified
                and standardized automatically.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-2 shrink-0">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Searchable Database</p>
              <p className="text-sm text-muted-foreground">
                Documents and their data become instantly searchable and
                available for analytics.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
