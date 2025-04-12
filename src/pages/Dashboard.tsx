
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  FileText,
  Plus,
  Pills,
  MessageSquare,
  Users,
} from "lucide-react";

const Dashboard = () => {
  // Mock data - would come from an API in a real app
  const recentPrescriptions = [
    {
      id: 1,
      patientName: "Sarah Johnson",
      medication: "Lisinopril 10mg",
      date: "2025-04-10",
    },
    {
      id: 2,
      patientName: "Michael Chen",
      medication: "Metformin 500mg",
      date: "2025-04-09",
    },
    {
      id: 3,
      patientName: "Emily Rodriguez",
      medication: "Atorvastatin 20mg",
      date: "2025-04-08",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex space-x-2">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Apr 12, 2025</span>
            </Button>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              <span>New Prescription</span>
            </Button>
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
                <h3 className="text-2xl font-bold">1,284</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Pills className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Active Medications</p>
                <h3 className="text-2xl font-bold">326</h3>
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
                <h3 className="text-2xl font-bold">592</h3>
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
                <h3 className="text-2xl font-bold">89</h3>
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
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="prescription-item flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{prescription.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {prescription.medication}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(prescription.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                <span>Upload Prescription</span>
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>View Analytics</span>
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                <span>Patient Records</span>
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Ask AI Assistant</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
