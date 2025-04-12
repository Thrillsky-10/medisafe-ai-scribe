
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  FileText,
  Plus,
  Pill,
  MessageSquare,
  Users,
  Loader2
} from "lucide-react";
import { fetchRecentPrescriptions } from "@/services/prescriptionService";
import { fetchPatientStats } from "@/services/patientService";
import { fetchPrescriptionStats } from "@/services/prescriptionService";
import { fetchAIInteractionStats } from "@/services/analyticsService";
import { formatDate } from "@/lib/utils";

const Dashboard = () => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // Fetch recent prescriptions
  const { 
    data: recentPrescriptions = [], 
    isLoading: isLoadingPrescriptions 
  } = useQuery({
    queryKey: ['recentPrescriptions'],
    queryFn: () => fetchRecentPrescriptions(),
  });
  
  // Fetch stats
  const { data: prescriptionStats, isLoading: isLoadingPrescriptionStats } = useQuery({
    queryKey: ['prescriptionStats'],
    queryFn: fetchPrescriptionStats,
  });
  
  const { data: patientStats, isLoading: isLoadingPatientStats } = useQuery({
    queryKey: ['patientStats'],
    queryFn: fetchPatientStats,
  });
  
  const { data: aiInteractions, isLoading: isLoadingAIStats } = useQuery({
    queryKey: ['aiInteractionStats'],
    queryFn: fetchAIInteractionStats,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{currentDate}</span>
            </Button>
            <Link to="/upload">
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                <span>New Prescription</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Prescriptions</p>
                {isLoadingPrescriptionStats ? (
                  <div className="h-6 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold">{prescriptionStats?.total.toLocaleString() || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Active Medications</p>
                {isLoadingPrescriptionStats ? (
                  <div className="h-6 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold">{prescriptionStats?.active.toLocaleString() || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Patients</p>
                {isLoadingPatientStats ? (
                  <div className="h-6 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold">{patientStats?.total.toLocaleString() || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">AI Interactions</p>
                {isLoadingAIStats ? (
                  <div className="h-6 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <h3 className="text-2xl font-bold">{aiInteractions?.toLocaleString() || 0}</h3>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Prescriptions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center justify-between">
                Recent Prescriptions
                <Link to="/prescriptions">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPrescriptions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : recentPrescriptions.length > 0 ? (
                <div className="space-y-2">
                  {recentPrescriptions.map((prescription: any) => (
                    <div
                      key={prescription.id}
                      className="prescription-item flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{prescription.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {prescription.medication}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(prescription.prescribed_date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No prescriptions found. Create your first prescription.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/upload">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Upload Prescription</span>
                </Button>
              </Link>
              <Link to="/analytics">
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>View Analytics</span>
                </Button>
              </Link>
              <Link to="/prescriptions">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Patient Records</span>
                </Button>
              </Link>
              <Link to="/assistant">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Ask AI Assistant</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
