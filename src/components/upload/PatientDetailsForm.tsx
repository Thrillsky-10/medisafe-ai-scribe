
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Phone } from "lucide-react";

const patientSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  mobile: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must not exceed 15 digits")
    .regex(/^\+?[\d\s-]+$/, "Invalid mobile number format")
});

export type PatientFormData = z.infer<typeof patientSchema>;

interface PatientDetailsFormProps {
  onSubmit: (data: PatientFormData) => void;
  isSubmitting?: boolean;
}

export const PatientDetailsForm = ({ onSubmit, isSubmitting = false }: PatientDetailsFormProps) => {
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      mobile: ""
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient Name
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter patient name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mobile Number
              </FormLabel>
              <FormControl>
                <Input 
                  type="tel" 
                  placeholder="Enter mobile number" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          Continue
        </Button>
      </form>
    </Form>
  );
};
