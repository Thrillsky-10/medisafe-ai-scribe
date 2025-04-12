
import { supabase } from '@/lib/supabase';
import { MedicationStat } from '@/types/database.types';

export async function fetchMedicationFrequency(): Promise<MedicationStat[]> {
  try {
    const { data, error } = await supabase.rpc('get_medication_frequency');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medication frequency:', error);
    throw error;
  }
}

export async function fetchPrescriptionsByMonth() {
  try {
    const { data, error } = await supabase.rpc('get_prescriptions_by_month');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching prescriptions by month:', error);
    throw error;
  }
}

export async function fetchActiveMedicationsByStatus() {
  try {
    const { data, error } = await supabase.rpc('get_medications_by_status');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medications by status:', error);
    throw error;
  }
}

export async function fetchAIInteractionStats() {
  try {
    const { count, error } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching AI interaction stats:', error);
    throw error;
  }
}
