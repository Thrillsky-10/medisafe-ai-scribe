
import { z } from "zod";

export const formSchema = z.object({
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  patientMobile: z.string().min(10, "Mobile number must be at least 10 characters"),
  prescriptionDate: z.date({
    required_error: "Prescription date is required",
  }),
  medications: z.array(
    z.object({
      name: z.string().min(2, "Medication name is required"),
      dosage: z.string().min(1, "Dosage is required"),
      frequency: z.string().min(1, "Frequency is required"),
      duration: z.string().min(1, "Duration is required"),
    })
  ).min(1, "At least one medication is required"),
  notes: z.string().optional(),
  signatureData: z.string().min(1, "Signature is required"),
});

export type FormData = z.infer<typeof formSchema>;

export interface MedicationDetail {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}
