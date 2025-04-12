
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();
  
  // Show error if Supabase is not configured
  if (!supabaseConfigured) {
    return (
      <div className="flex h-screen w-screen items-center justify-center flex-col p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 w-full max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Configuration Error</h2>
          <p className="text-red-600">
            Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.
          </p>
        </div>
      </div>
    );
  }
  
  // Show loading or redirect if not authenticated
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
