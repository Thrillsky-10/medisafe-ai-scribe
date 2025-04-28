
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createDigitalPrescription } from "@/services/prescriptionService";
import { SignatureField } from "@/components/prescriptions/SignatureField";
import { PatientInformationForm } from "@/components/prescriptions/PatientInformationForm";
import { MedicationsForm } from "@/components/prescriptions/MedicationsForm";
import { useQuery } from "@tanstack/react-query";
import { fetchDoctorSettings } from "@/services/doctorSettingsService";
import { formSchema, FormData } from "@/types/prescription.types";

export default function CreatePrescription() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: doctorSettings } = useQuery({
    queryKey: ["doctorSettings"],
    queryFn: fetchDoctorSettings,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientMobile: "",
      prescriptionDate: new Date(),
      medications: [
        { 
          name: "",
          dosage: "",
          frequency: "",
          duration: ""
        }
      ],
      notes: "",
      signatureData: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const result = await createDigitalPrescription({
        patientName: data.patientName,
        patientMobile: data.patientMobile,
        prescriptionDate: data.prescriptionDate.toISOString().split('T')[0],
        medications: data.medications,
        notes: data.notes || "",
        signatureData: data.signatureData,
        doctorSettings: doctorSettings || undefined,
      });

      if (result?.pdfUrl) {
        setPdfUrl(result.pdfUrl);
        toast.success("Prescription created successfully!");
      } else {
        toast.error("Failed to create prescription");
      }
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error("Failed to create prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create Prescription</h1>
          <Button onClick={() => navigate("/prescriptions")} variant="outline">
            Back to Prescriptions
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <PatientInformationForm form={form} />
                
                <Separator />
                
                <MedicationsForm form={form} />
                
                <Form.Field
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Notes / Special Instructions</Form.Label>
                      <Form.Control>
                        <Textarea 
                          placeholder="Enter any special instructions or notes"
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />

                <Separator />

                <div>
                  <h2 className="text-lg font-medium mb-4">Doctor's Signature</h2>
                  <Form.Field
                    control={form.control}
                    name="signatureData"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Control>
                          <SignatureField 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  {pdfUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(pdfUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Prescription"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
