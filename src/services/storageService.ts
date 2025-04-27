
import { supabase } from "@/lib/supabase";

export async function ensureStorageBuckets() {
  try {
    // Check if prescription-documents bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return;
    }
    
    if (!buckets?.find(b => b.name === 'prescription-documents')) {
      try {
        console.log('Creating prescription-documents bucket...');
        const { data, error } = await supabase.storage.createBucket('prescription-documents', {
          public: true, // Make bucket public so files can be accessed without authentication
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          console.error('Error creating bucket:', error);
        } else {
          console.log('Bucket created successfully:', data);
        }
      } catch (error) {
        console.error('Error creating storage bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error in ensureStorageBuckets:', error);
  }
}
