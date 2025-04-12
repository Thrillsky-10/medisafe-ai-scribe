
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

export async function logAnalyticsEvent(eventType: string, eventData: any) {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        event_data: eventData,
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging analytics event:', error);
    return false;
  }
}

export async function fetchOcrAnalytics() {
  try {
    const { data, error } = await supabase
      .from('ocr_results')
      .select('created_at, extracted_data')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    // Process the results to get useful analytics
    const totalDocuments = data.length;
    const avgConfidence = data.reduce((sum, item) => sum + (item.extracted_data.confidence || 0), 0) / (totalDocuments || 1);
    
    // Count extraction success by field
    const fieldExtractionStats = {
      medication: data.filter(item => item.extracted_data.medication && item.extracted_data.medication !== 'Unknown').length,
      dosage: data.filter(item => item.extracted_data.dosage && item.extracted_data.dosage !== 'Unknown').length,
      refills: data.filter(item => typeof item.extracted_data.refills === 'number').length
    };
    
    return {
      totalDocuments,
      avgConfidence,
      fieldExtractionStats,
      recentOcrResults: data.slice(0, 5)
    };
  } catch (error) {
    console.error('Error fetching OCR analytics:', error);
    throw error;
  }
}
