import { supabase } from '@/lib/supabase';
import { Prescription, PrescriptionStat, MedicationStat } from '@/types/database.types';

export async function fetchPrescriptions(searchTerm = '', status = 'all', sortOrder = 'newest') {
  try {
    let query = supabase
      .from('ocr_results')
      .select('*');

    // Apply status filter if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search term if provided
    if (searchTerm) {
      query = query.or(`patient_name.ilike.%${searchTerm}%,medication.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    if (sortOrder === 'newest') {
      query = query.order('prescribed_date', { ascending: false });
    } else {
      query = query.order('prescribed_date', { ascending: true });
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
      .from('ocr_results')
      .select('id, patient_name, medication, prescribed_date')
      .order('prescribed_date', { ascending: false })
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
      .from('ocr_results')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get active count
    const { count: active, error: activeError } = await supabase
      .from('ocr_results')
      .select('*', { count: 'exact', head: true }) //this should have been ocr_results but we need to create status column on that table
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get completed count
    const { count: completed, error: completedError } = await supabase
      .from('ocr_results')
      .select('*', { count: 'exact', head: true }) //this should have been ocr_results but we need to create status column on that table
      .eq('status', 'completed');

    if (completedError) throw completedError;

    // Get expired count
    const { count: expired, error: expiredError } = await supabase
      .from('ocr_results')
      .select('*', { count: 'exact', head: true }) //this should have been ocr_results but we need to create status column on that table
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

export async function fetchOcrResults(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('ocr_results')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching OCR results:', error);
    throw error;
  }
}
