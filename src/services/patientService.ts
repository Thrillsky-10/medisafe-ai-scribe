import { supabase } from '@/lib/supabase';
import { Patient, PatientStat } from '@/types/database.types';

// Sample patients for development (remove in production)
const SAMPLE_PATIENTS = [
  { id: 'P10001', name: 'John Smith', email: 'john@example.com', mobile: 'PLACEHOLDER-P10001' },
  { id: 'P10002', name: 'Sarah Johnson', email: 'sarah@example.com', mobile: 'PLACEHOLDER-P10002' },
  { id: 'P10003', name: 'Michael Brown', email: 'michael@example.com', mobile: 'PLACEHOLDER-P10003' },
  { id: 'P10004', name: 'Emily Davis', email: 'emily@example.com', mobile: 'PLACEHOLDER-P10004' },
  { id: 'P10005', name: 'Robert Wilson', email: 'robert@example.com', mobile: 'PLACEHOLDER-P10005' },
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

// Function to create a patient
export async function createPatient(name: string, mobile: string, email?: string): Promise<Patient | null> {
  try {
    // Generate a patient ID with a simple prefix + timestamp pattern
    const patientId = `P${Date.now().toString().substring(6)}`;
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        id: patientId,
        name,
        mobile,
        email
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating patient:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createPatient:', error);
    throw error;
  }
}

export async function fetchPatients(): Promise<Patient[]> {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching patients:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchPatients:", error);
    throw error;
  }
}

export async function fetchPatientById(patientId: string): Promise<Patient | null> {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    if (error) {
      console.error("Error fetching patient:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchPatientById:", error);
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
    // Fixed: Using a subquery approach instead of .in() with a query builder
    const { data: activePrescriptions, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .select('patient_id')
      .eq('status', 'active');

    if (prescriptionsError) throw prescriptionsError;
    
    // Get distinct patient IDs from active prescriptions
    const activePatientIds = [...new Set(activePrescriptions.map(p => p.patient_id))];
    
    // Count active patients
    const { count: active, error: activeError } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .in('id', activePatientIds);

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
