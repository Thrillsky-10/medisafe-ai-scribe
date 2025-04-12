
import { supabase } from '@/lib/supabase';
import { Prescription, PrescriptionStat, MedicationStat } from '@/types/database.types';

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
      .from('prescriptions')
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

export async function createPrescription(prescription: Omit<Prescription, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([prescription])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating prescription:', error);
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

    return {
      path: filePath,
      url: publicUrlData.publicUrl
    };
  } catch (error) {
    console.error('Error uploading prescription document:', error);
    throw error;
  }
}
