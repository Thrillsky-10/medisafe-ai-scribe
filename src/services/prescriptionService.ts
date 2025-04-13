
// src/services/prescriptionService.ts

import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";

// Helper type for the 'prescriptions' table
type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
type OcrResult = Database["public"]["Tables"]["ocr_results"]["Row"];

export interface PrescriptionStat {
  total: number;
  active: number;
  completed: number;
  expired: number;
}

export interface MedicationStat {
  medication: string;
  count: number;
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
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: data.patient_id,
        medication: data.medication,
        dosage: data.dosage,
        refills: data.refills,
        document_url: data.document_url,
      })
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

export async function uploadPrescriptionDocument(file: File, patientId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}_${Date.now()}.${fileExt}`;
    const filePath = `prescriptions/${fileName}`;

    // Create the bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'prescription-documents')) {
      await supabase.storage.createBucket('prescription-documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL (or protected URL depending on your needs)
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrlData.publicUrl,
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

    const response = await fetch(
      "https://vbxrptkhikmzayxnzlvj.supabase.co/functions/v1/process-document", 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabase.auth.anon.key}`
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
