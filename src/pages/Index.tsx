
import { useState } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Database, Fingerprint } from "lucide-react";

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent/30">
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">MediSafe AI</div>
        <Button onClick={() => setIsLogin(true)} variant="outline">
          Sign In
        </Button>
      </header>

      <div className="container mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-secondary">
            Secure Prescription Management with AI Analytics
          </h1>
          <p className="text-lg text-muted-foreground">
            A HIPAA-compliant system for healthcare professionals to securely
            manage prescriptions, analyze medication patterns, and retrieve
            patient histories through our AI-powered assistant.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-medium">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  End-to-end encryption and secure storage
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-medium">Smart OCR</h3>
                <p className="text-sm text-muted-foreground">
                  Extract data from any prescription format
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Database className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-medium">Powerful Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize medication patterns and trends
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Fingerprint className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-medium">Secure Access</h3>
                <p className="text-sm text-muted-foreground">
                  Robust authentication and audit trails
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <AuthForm isLogin={isLogin} onToggle={toggleAuthMode} />
        </div>
      </div>

      <footer className="container mx-auto py-8 px-4 mt-12 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 MediSafe AI. All rights reserved. HIPAA Compliant.
        </p>
      </footer>
    </div>
  );
};

export default Index;
