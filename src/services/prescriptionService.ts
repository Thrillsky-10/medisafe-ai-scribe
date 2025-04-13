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

export async function createPrescription(
  patient_id: string,
  ocr_result_id: string,
  medication: string,
  dosage: string,
  refills: number,
  document_path: string,
  document_url: string,
): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id,
      ocr_result_id,
      medication,
      dosage,
      refills,
      document_path,
      document_url
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating prescription:", error);
    throw error; // Or handle the error appropriately
  }

  return data;
}

export async function fetchPrescriptions(searchTerm = '', status = 'all', sortOrder = 'newest') {
  try {
    let query = supabase
      .from('prescriptions') // changed from ocr_results to prescriptions
      .select('*');

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status); // You might need to adjust this field name
    }

    // Apply search term if provided
    if (searchTerm) {
      query = query.or(`patient_id.ilike.%${searchTerm}%,medication.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`); // adjusted to the prescriptions table fields
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      query = query.order('created_at', { ascending: false }); // changed from prescribed_date to created_at
    } else {
      query = query.order('created_at', { ascending: true }); // changed from prescribed_date to created_at
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
      .from('prescriptions') // changed from ocr_results to prescriptions
      .select('id, patient_id, medication, created_at') //changed from prescribed_date to created_at
      .order('created_at', { ascending: false }) //changed from prescribed_date to created_at
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

    const { data, error } = await supabase.storage
      .from('prescription-documents')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('prescription-documents')
      .getPublicUrl(filePath);

    // Process the document with OCR
    const processingResult = await processPrescriptionDocument(publicUrlData.publicUrl, filePath, patientId);
    
    if (!processingResult?.success) {
      console.error('Document processing failed:', processingResult?.error);
      throw new Error('Document processing failed. Please try again.');
    }

    return {
      path: filePath,
      url: publicUrlData.publicUrl,
      ocr_result: processingResult.ocr_result,
      extracted_data: processingResult.extracted_data
    };
  } catch (error) {
    console.error('Error uploading prescription document:', error);
    throw error;
  }
}

export async function processPrescriptionDocument(documentUrl: string, documentPath: string, patientId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        documentUrl,
        documentPath,
        patientId,
      },
    });

    if (error) {
      console.error('Error invoking process-document function:', error);
      throw error;
    }
    
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
