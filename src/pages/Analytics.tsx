
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const Analytics = () => {
  // Mock data for charts
  const medicationFrequencyData = [
    { name: "Lisinopril", prescriptions: 48 },
    { name: "Metformin", prescriptions: 42 },
    { name: "Atorvastatin", prescriptions: 38 },
    { name: "Levothyroxine", prescriptions: 29 },
    { name: "Amlodipine", prescriptions: 26 },
    { name: "Omeprazole", prescriptions: 22 },
  ];

  const monthlyPrescriptionsData = [
    { name: "Jan", count: 34 },
    { name: "Feb", count: 41 },
    { name: "Mar", count: 38 },
    { name: "Apr", count: 45 },
    { name: "May", count: 49 },
    { name: "Jun", count: 42 },
    { name: "Jul", count: 37 },
    { name: "Aug", count: 41 },
    { name: "Sep", count: 46 },
    { name: "Oct", count: 51 },
    { name: "Nov", count: 45 },
    { name: "Dec", count: 38 },
  ];

  const medicationCategoryData = [
    { name: "Cardiovascular", value: 124 },
    { name: "Endocrine", value: 87 },
    { name: "Gastrointestinal", value: 62 },
    { name: "Neurological", value: 43 },
    { name: "Respiratory", value: 35 },
  ];

  const COLORS = ["#789D3C", "#4A6B2A", "#A3C266", "#3A5B1A", "#C8DBAC"];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <Select defaultValue="2025">
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
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
                    dataKey="prescriptions"
                    fill="#789D3C"
                    name="Prescriptions"
                  />
                </BarChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyPrescriptionsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
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
              <div className="bg-accent/30 p-4 rounded-md">
                <h4 className="font-medium">Prescription Pattern Change</h4>
                <p className="text-sm text-muted-foreground">
                  There has been a 12% increase in Metformin prescriptions 
                  compared to the previous quarter, suggesting a rise in 
                  diabetes-related treatments.
                </p>
              </div>

              <div className="bg-accent/30 p-4 rounded-md">
                <h4 className="font-medium">Potential Drug Interaction Alert</h4>
                <p className="text-sm text-muted-foreground">
                  The system detected 5 patients with concurrent prescriptions 
                  of medications that may have adverse interactions. Review 
                  recommended.
                </p>
              </div>

              <div className="bg-accent/30 p-4 rounded-md">
                <h4 className="font-medium">Seasonal Prescription Trend</h4>
                <p className="text-sm text-muted-foreground">
                  Respiratory medication prescriptions show consistent seasonal 
                  patterns, with peaks during winter months (Dec-Feb).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
