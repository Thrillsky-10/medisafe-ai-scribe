import { Database } from "@/types/database.types";
import { supabase } from '@/lib/supabase';
import { Patient, PatientStat } from '@/types/database.types';

// Sample patients for development (remove in production)
const SAMPLE_PATIENTS = [
  { id: 'P10001', name: 'John Smith', email: 'john@example.com' },
  { id: 'P10002', name: 'Sarah Johnson', email: 'sarah@example.com' },
  { id: 'P10003', name: 'Michael Brown', email: 'michael@example.com' },
  { id: 'P10004', name: 'Emily Davis', email: 'emily@example.com' },
  { id: 'P10005', name: 'Robert Wilson', email: 'robert@example.com' },
];

export async function seedPatientsIfEmpty() {
  try {
    // Check if patients table is empty
    const { count, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Only seed if no patients exist
    if (count === 0) {
      const { error } = await supabase
        .from('patients')
        .insert(SAMPLE_PATIENTS);
      
      if (error) throw error;
      console.log('Sample patients seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding patients:', error);
  }
}

type Patient = Database["public"]["Tables"]["patients"]["Row"];

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from("patients").select("*");

  if (error) {
    console.error("Error fetching patients:", error);
    throw error;
  }

  return data || [];
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
