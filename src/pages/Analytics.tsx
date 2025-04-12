
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { 
  fetchMedicationFrequency, 
  fetchPrescriptionsByMonth,
  fetchActiveMedicationsByStatus,
  fetchOcrAnalytics
} from "@/services/analyticsService";

const Analytics = () => {
  const [year, setYear] = useState("2025");
  const [patientGroup, setPatientGroup] = useState("all");
  
  // Fetch real data from our backend
  const { 
    data: medicationFrequencyData = [], 
    isLoading: isLoadingMedFreq,
    refetch: refetchMedFreq
  } = useQuery({
    queryKey: ['medicationFrequency'],
    queryFn: fetchMedicationFrequency,
  });

  const {
    data: monthlyPrescriptionsData = [],
    isLoading: isLoadingMonthly,
    refetch: refetchMonthly
  } = useQuery({
    queryKey: ['prescriptionsByMonth'],
    queryFn: fetchPrescriptionsByMonth,
  });

  const {
    data: medicationStatusData = [],
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['medicationsByStatus'],
    queryFn: fetchActiveMedicationsByStatus,
  });
  
  const {
    data: ocrAnalytics,
    isLoading: isLoadingOcr,
    refetch: refetchOcr
  } = useQuery({
    queryKey: ['ocrAnalytics'],
    queryFn: fetchOcrAnalytics,
  });

  // Prepare data for the medication category chart (still using mock data)
  const medicationCategoryData = [
    { name: "Cardiovascular", value: 124 },
    { name: "Endocrine", value: 87 },
    { name: "Gastrointestinal", value: 62 },
    { name: "Neurological", value: 43 },
    { name: "Respiratory", value: 35 },
  ];

  const COLORS = ["#789D3C", "#4A6B2A", "#A3C266", "#3A5B1A", "#C8DBAC"];
  
  // Handle refresh
  const handleRefreshData = async () => {
    try {
      await Promise.all([
        refetchMedFreq(),
        refetchMonthly(),
        refetchStatus(),
        refetchOcr()
      ]);
      toast.success("Analytics data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh analytics data");
    }
  };

  // Format OCR insights
  const getOcrInsights = () => {
    if (!ocrAnalytics) return [];
    
    const insights = [];
    
    if (ocrAnalytics.totalDocuments > 0) {
      insights.push({
        title: "OCR Processing",
        description: `Processed ${ocrAnalytics.totalDocuments} documents with average confidence score of ${(ocrAnalytics.avgConfidence * 100).toFixed(1)}%`
      });
    }
    
    if (ocrAnalytics.fieldExtractionStats) {
      const { medication, dosage, refills } = ocrAnalytics.fieldExtractionStats;
      insights.push({
        title: "Data Extraction Performance",
        description: `Successfully extracted medication names (${medication}), dosage information (${dosage}), and refill counts (${refills})`
      });
    }
    
    // Always add one general insight
    insights.push({
      title: "Prescription Pattern Change",
      description: "There has been a 12% increase in Metformin prescriptions compared to the previous quarter, suggesting a rise in diabetes-related treatments."
    });
    
    return insights;
  };
  
  const isLoading = isLoadingMedFreq || isLoadingMonthly || isLoadingStatus || isLoadingOcr;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Select value={patientGroup} onValueChange={setPatientGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Patient Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                <SelectItem value="diabetes">Diabetes Patients</SelectItem>
                <SelectItem value="hypertension">Hypertension Patients</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medication Frequency */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Top Prescribed Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoadingMedFreq ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={medicationFrequencyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#789D3C"
                      name="Prescriptions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Prescriptions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Monthly Prescription Count
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoadingMonthly ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyPrescriptionsData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #ddd",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#4A6B2A"
                      name="Prescriptions"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Medication Categories */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">
                Medication Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {medicationCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} prescriptions`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingOcr ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                getOcrInsights().map((insight, index) => (
                  <div key={index} className="bg-accent/30 p-4 rounded-md">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
