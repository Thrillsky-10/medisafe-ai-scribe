
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useEffect } from "react";
import { seedPatientsIfEmpty } from "./services/patientService";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Prescriptions from "./pages/Prescriptions";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Assistant from "./pages/Assistant";
import NotFound from "./pages/NotFound";
import CreatePrescription from "./pages/CreatePrescription";
import DoctorSettings from "./pages/DoctorSettings";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Separate the AppRoutes component to prevent React context issues
const AppRoutes = () => {
  useEffect(() => {
    // Seed sample patients when app loads
    seedPatientsIfEmpty();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/prescriptions" element={
            <ProtectedRoute>
              <Prescriptions />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/assistant" element={
            <ProtectedRoute>
              <Assistant />
            </ProtectedRoute>
          } />
          <Route path="/create-prescription" element={
            <ProtectedRoute>
              <CreatePrescription />
            </ProtectedRoute>
          } />
          <Route path="/doctor-settings" element={
            <ProtectedRoute>
              <DoctorSettings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
