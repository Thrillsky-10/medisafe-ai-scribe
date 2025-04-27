// src/services/prescriptionService.ts

import { supabase } from "@/lib/supabase";
import { Prescription, PatientStat, MedicationStat } from "@/types/database.types";

// Helper type for the 'prescriptions' table
type OcrResult = {
  id: string;
  patient_id: string | null;
  document_url: string;
  document_path: string;
  extracted_data: any;
  raw_text: string;
  processed_by: string | null;
  created_at: string | null;
};

export interface PrescriptionStat {
  total: number;
  active: number;
  completed: number;
  expired: number;
}

export interface CreatePrescriptionData {
  patient_id: string;
  patient_name?: string;
  medication: string;
  dosage: string;
  refills: number;
  prescribed_date?: string;
  status?: 'active' | 'completed' | 'expired';
  document_url?: string;
}

export async function createPrescription(data: CreatePrescriptionData): Promise<Prescription | null> {
  try {
    // Set default values if not provided
    const prescriptionData = {
      patient_id: data.patient_id,
      medication: data.medication,
      dosage: data.dosage,
      refills: data.refills,
      document_url: data.document_url || null,
      status: data.status || 'active',
      prescribed_date: data.prescribed_date || new Date().toISOString().split('T')[0],
    };

    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert(prescriptionData)
      .select()
      .single();

    if (error) {
      console.error("Error creating prescription:", error);
      throw error;
    }

    return prescription;
  } catch (error) {
    console.error("Error in createPrescription:", error);
    throw error;
  }
}

export async function fetchPrescriptions(searchTerm = '', status = 'all', sortOrder = 'newest') {
  try {
    let query = supabase
      .from('prescriptions')
      .select('*');

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search term if provided
    if (searchTerm) {
      query = query.or(`patient_id.ilike.%${searchTerm}%,medication.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Prescription[];
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    throw error;
  }
}

export async function fetchRecentPrescriptions(limit = 3) {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, patient_id, medication, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching recent prescriptions:', error);
    throw error;
  }
}

export async function fetchPrescriptionStats(): Promise<PrescriptionStat> {
  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get active count
    const { count: active, error: activeError } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get completed count
    const { count: completed, error: completedError } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Get expired count
    const { count: expired, error: expiredError } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');
    
    if (expiredError) throw expiredError;

    return {
      total: total || 0,
      active: active || 0,
      completed: completed || 0,
      expired: expired || 0
    };
  } catch (error) {
    console.error('Error fetching prescription stats:', error);
    throw error;
  }
}

export async function fetchTopMedications(): Promise<MedicationStat[]> {
  try {
    const { data, error } = await supabase.rpc('get_medication_stats');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medication stats:', error);
    throw error;
  }
}

export async function uploadPrescriptionDocument(
  file: File,
  patientName: string,
  patientMobile: string
) {
  try {
    // Check for valid file
    if (!file || file.size === 0) {
      throw new Error('Invalid file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload a JPG, PNG, or PDF file.');
    }

    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    // First, get or create patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .upsert({
        name: patientName,
        mobile: patientMobile
      })
      .select()
      .single();

    if (patientError) {
      console.error('Error creating/updating patient:', patientError);
      throw new Error('Failed to create/update patient record');
    }

    // Create filename with proper extension
    const fileExt = file.name.split('.').pop();
    const fileName = `${patient.id}_${Date.now()}.${fileExt}`;
    const filePath = `prescriptions/${fileName}`;

    // Check if bucket exists and create if needed
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'prescription-documents')) {
      try {
        await supabase.storage.createBucket('prescription-documents', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
      } catch (bucketError: any) {
        console.warn('Bucket creation warning:', bucketError.message);
      }
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrlData.publicUrl,
      patient_id: patient.id
    };
  } catch (error) {
    console.error('Error uploading prescription document:', error);
    throw error;
  }
}

export async function processPrescriptionDocument(
  documentUrl: string, 
  documentPath: string, 
  patientId: string, 
  extractedText: string
) {
  try {
    console.log("Calling process-document function with:", {
      documentUrl,
      documentPath,
      patientId,
      textLength: extractedText?.length || 0
    });

    // Use Supabase project URL and anon key
    const supabaseUrl = "https://vbxrptkhikmzayxnzlvj.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieHJwdGtoaWttemF5eG56bHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjUwMTksImV4cCI6MjA2MDA0MTAxOX0.At6OnNihnsZ8VA622IluB4LISJ6SjkFbxkKnpGMe34w";

    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-document`, 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          documentUrl,
          documentPath,
          patientId,
          extractedText
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function error:", errorText);
      throw new Error(`Error processing document: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Process document response:", data);
    
    return data;
  } catch (error) {
    console.error('Error processing document with OCR:', error);
    throw error;
  }
}

export async function fetchOcrResults(patientId: string): Promise<OcrResult[]> {
  try {
    const { data, error } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching OCR results:', error);
    throw error;
  }
}
