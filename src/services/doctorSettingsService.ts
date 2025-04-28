
import { supabase } from "@/lib/supabase";

export interface DoctorSettings {
  id: string;
  logo_url?: string;
  hospital_name?: string;
  hospital_address?: string;
  hospital_phone?: string;
  doctor_name?: string;
  doctor_qualifications?: string;
  signature_url?: string;
  created_at?: string;
}

export async function fetchDoctorSettings(): Promise<DoctorSettings | null> {
  try {
    // In a production app, we would filter by user_id
    // For this prototype, we'll just get the first record
    const { data, error } = await supabase
      .from('doctor_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If no settings exist yet, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching doctor settings:", error);
    return null;
  }
}

export async function saveDoctorSettings(settings: Partial<DoctorSettings>): Promise<DoctorSettings | null> {
  try {
    // Check if settings already exist
    const existing = await fetchDoctorSettings();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('doctor_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('doctor_settings')
        .insert([settings])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error saving doctor settings:", error);
    return null;
  }
}

export async function uploadHospitalLogo(file: File): Promise<string | null> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload a JPG or PNG file.');
    }

    // Validate file size (2MB max)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File too large. Maximum size is 2MB.');
    }

    // Create filename with proper extension
    const fileExt = file.name.split('.').pop();
    const fileName = `hospital_logo_${Date.now()}.${fileExt}`;
    const filePath = `doctor_settings/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);

    // Return the public URL
    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading hospital logo:', error);
    throw error;
  }
}

export async function uploadDoctorSignature(signatureData: string): Promise<string | null> {
  try {
    // If it's a text signature, just return it
    if (!signatureData.startsWith('data:image')) {
      return signatureData;
    }

    // Convert base64 to blob
    const base64Response = await fetch(signatureData);
    const blob = await base64Response.blob();
    
    // Create file from blob
    const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
    
    // Upload file
    const filePath = `doctor_settings/signatures/signature_${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);

    // Return the public URL
    return publicUrlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading doctor signature:', error);
    throw error;
  }
}
