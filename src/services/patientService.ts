
import { supabase } from '@/lib/supabase';
import { Patient, PatientStat } from '@/types/database.types';

export async function fetchPatients() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Patient[];
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
}

export async function fetchPatientStats(): Promise<PatientStat> {
  try {
    // Total patients
    const { count: total, error: totalError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Active patients (patients with active prescriptions)
    const { count: active, error: activeError } = await supabase.rpc('get_active_patients_count');

    if (activeError) throw activeError;

    // New patients this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: newThisMonth, error: newError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (newError) throw newError;

    return {
      total: total || 0,
      active: active || 0,
      new_this_month: newThisMonth || 0
    };
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    throw error;
  }
}
