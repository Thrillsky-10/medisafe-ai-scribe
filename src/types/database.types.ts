export type Patient = {
  id: string;
  name: string;
  email?: string;
  created_at: string;
};

export type Prescription = {
  id: string;
  patient_id: string;
  patient_name: string;
  medication: string;
  dosage: string;
  prescribed_date: string;
  refills: number;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  document_url?: string;
};

export type MedicationStat = {
  name: string;
  count: number;
  percentage: number;
};

export type PatientStat = {
  total: number;
  active: number;
  new_this_month: number;
};

export type PrescriptionStat = {
  total: number;
  active: number;
  completed: number;
  expired: number;
};

export type AIInteraction = {
  id: string;
  user_id: string;
  query: string;
  response: string;
  created_at: string;
};
