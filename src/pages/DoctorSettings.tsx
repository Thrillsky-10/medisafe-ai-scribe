
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { 
  fetchDoctorSettings, 
  saveDoctorSettings, 
  uploadHospitalLogo,
  DoctorSettings
} from "@/services/doctorSettingsService";
import { SignatureField } from "@/components/prescriptions/SignatureField";

const formSchema = z.object({
  hospital_name: z.string().min(2, "Hospital name is required"),
  hospital_address: z.string().min(2, "Hospital address is required"),
  hospital_phone: z.string().min(6, "Hospital phone is required"),
  doctor_name: z.string().min(2, "Doctor name is required"),
  doctor_qualifications: z.string().optional(),
  signatureData: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const DoctorSettingsPage = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["doctorSettings"],
    queryFn: fetchDoctorSettings,
  });

  // Setup form with existing settings
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hospital_name: settings?.hospital_name || "",
      hospital_address: settings?.hospital_address || "",
      hospital_phone: settings?.hospital_phone || "",
      doctor_name: settings?.doctor_name || "",
      doctor_qualifications: settings?.doctor_qualifications || "",
      signatureData: settings?.signature_url || "",
    },
    values: {
      hospital_name: settings?.hospital_name || "",
      hospital_address: settings?.hospital_address || "",
      hospital_phone: settings?.hospital_phone || "",
      doctor_name: settings?.doctor_name || "",
      doctor_qualifications: settings?.doctor_qualifications || "",
      signatureData: settings?.signature_url || "",
    },
  });

  // Mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Upload logo if selected
      let logo_url = settings?.logo_url;
      if (logoFile) {
        setIsUploading(true);
        try {
          logo_url = await uploadHospitalLogo(logoFile);
        } finally {
          setIsUploading(false);
        }
      }

      // Upload signature if it's a data URL
      let signature_url = data.signatureData;

      // Prepare settings data
      const settingsData: Partial<DoctorSettings> = {
        hospital_name: data.hospital_name,
        hospital_address: data.hospital_address,
        hospital_phone: data.hospital_phone,
        doctor_name: data.doctor_name,
        doctor_qualifications: data.doctor_qualifications,
        signature_url,
      };

      if (logo_url) {
        settingsData.logo_url = logo_url;
      }

      return saveDoctorSettings(settingsData);
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["doctorSettings"] });
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    saveSettingsMutation.mutate(data);
  };

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Doctor & Hospital Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hospital & Doctor Profile</CardTitle>
            <CardDescription>
              Configure your hospital and doctor information for prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Hospital Logo */}
                <div className="space-y-4">
                  <FormLabel>Hospital Logo</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={logoPreview || settings?.logo_url} />
                      <AvatarFallback>LOGO</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Recommended size: 200x200 pixels (JPG or PNG)
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Hospital Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Hospital Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hospital_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hospital Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter hospital name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hospital_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter hospital phone"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hospital_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter hospital address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Doctor Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Doctor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="doctor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter doctor name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="doctor_qualifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualifications</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="MD, MBBS, etc." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Digital Signature */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Digital Signature</h3>
                  <FormField
                    control={form.control}
                    name="signatureData"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SignatureField 
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Your signature will be used on all digital prescriptions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isUploading || saveSettingsMutation.isPending}
                  >
                    {isUploading || saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DoctorSettingsPage;
