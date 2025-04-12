
import { createClient } from '@supabase/supabase-js';

// Hardcoded values from the Supabase project
const SUPABASE_URL = "https://vbxrptkhikmzayxnzlvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZieHJwdGtoaWttemF5eG56bHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjUwMTksImV4cCI6MjA2MDA0MTAxOX0.At6OnNihnsZ8VA622IluB4LISJ6SjkFbxkKnpGMe34w";

// Initialize the Supabase client with appropriate error handling
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
};
