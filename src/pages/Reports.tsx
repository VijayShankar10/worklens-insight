import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, TrendingUp, Activity, Users, Award } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import DepartmentComparison from "@/components/DepartmentComparison";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { toast } from "sonner";

interface EmployeePerformance {
  id: string;
  name: string;
  employee_code: string;
  department: string;
  activities: number;
  productivityScore: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState(7);
  const [aggregation, setAggregation] = useState<"daily" | "weekly" | "monthly">("daily");
  const [stats, setStats] = useState({
    totalActivities: 0,
    avgProductivity: 0,
    activeEmployees: 0,
    topPerformer: "",
  });
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformance[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
    fetchReportsData();
  }, [timeRange, navigate]);

  const fetchReportsData = async () => {
    // Fetch all activities
    const { data: activities } = await supabase
      .from("activities")
      .select("*");

    if (activities) {
      const productive = activities.filter((a) => a.category === "productive").length;
      const avgProd = activities.length > 0 ? Math.round((productive / activities.length) * 100) : 0;

      setStats((prev) => ({
        ...prev,
        totalActivities: activities.length,
        avgProductivity: avgProd,
      }));
    }

    // Fetch employees with their performance
    const { data: employees } = await supabase.from("employees").select("*");

    if (employees) {
      setStats((prev) => ({
        ...prev,
        activeEmployees: employees.filter((e) => e.is_active).length,
      }));

      const performance = await Promise.all(
        employees.map(async (emp) => {
          const { data: empActivities } = await supabase
            .from("activities")
            .select("category")
            .eq("employee_id", emp.id);

          const productive = empActivities?.filter((a) => a.category === "productive").length || 0;
          const total = empActivities?.length || 0;
          const score = total > 0 ? Math.round((productive / total) * 100) : 0;

          return {
            id: emp.id,
            name: emp.name,
            employee_code: emp.employee_code,
            department: emp.department,
            activities: total,
            productivityScore: score,
          };
        })
      );

      const sorted = performance.sort((a, b) => b.productivityScore - a.productivityScore);
      setEmployeePerformance(sorted);

      if (sorted.length > 0) {
        setStats((prev) => ({
          ...prev,
          topPerformer: sorted[0].name,
        }));
      }

      // Calculate department data
      const deptMap: { [key: string]: { activities: number; productive: number; employees: Set<string> } } = {};
      
      await Promise.all(
        employees.map(async (emp) => {
          if (!deptMap[emp.department]) {
            deptMap[emp.department] = { activities: 0, productive: 0, employees: new Set() };
          }
          deptMap[emp.department].employees.add(emp.id);

          const { data: empAct } = await supabase
            .from("activities")
            .select("category")
            .eq("employee_id", emp.id);

          if (empAct) {
            deptMap[emp.department].activities += empAct.length;
            deptMap[emp.department].productive += empAct.filter((a) => a.category === "productive").length;
          }
        })
      );

      const deptArray = Object.entries(deptMap).map(([department, data]) => ({
        department,
        totalActivities: data.activities,
        avgProductivity: data.activities > 0 ? Math.round((data.productive / data.activities) * 100) : 0,
        employeeCount: data.employees.size,
      }));

      setDepartmentData(deptArray);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Rank", "Employee", "Code", "Department", "Activities", "Productivity Score"],
      ...employeePerformance.map((emp, index) => [
        index + 1,
        emp.name,
        emp.employee_code,
        emp.department,
        emp.activities,
        `${emp.productivityScore}%`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worklens-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report exported successfully!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-error";
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <div className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Reports & Analytics</h1>
            <p className="text-muted-foreground">Aggregated productivity statistics over time</p>
          </div>
          <Button onClick={handleExportCSV} className="gradient-success text-white hover:opacity-90">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Time Range and Aggregation Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                onClick={() => setTimeRange(days)}
                className={timeRange === days ? "gradient-primary text-white" : ""}
              >
                LAST {days} DAYS
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((agg) => (
              <Button
                key={agg}
                variant={aggregation === agg ? "default" : "outline"}
                onClick={() => setAggregation(agg)}
                className={aggregation === agg ? "gradient-info text-white" : ""}
              >
                {agg.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Activities"
            value={stats.totalActivities}
            icon={Activity}
            gradient="gradient-info"
          />
          <StatCard
            title="Avg Productivity"
            value={`${stats.avgProductivity}%`}
            icon={TrendingUp}
            gradient="gradient-success"
          />
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={Users}
            gradient="gradient-primary"
          />
          <StatCard
            title="Top Performer"
            value={stats.topPerformer || "N/A"}
            icon={Award}
            gradient="gradient-error"
          />
        </div>

        {/* Tabs for Performance and Department Comparison */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Employee Performance</TabsTrigger>
            <TabsTrigger value="departments">Department Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Employee Performance Rankings</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Rank</th>
                    <th className="text-left p-4 font-semibold">Employee</th>
                    <th className="text-left p-4 font-semibold">Department</th>
                    <th className="text-left p-4 font-semibold">Activities</th>
                    <th className="text-left p-4 font-semibold">Productivity Score</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerformance.map((emp, index) => (
                    <tr key={emp.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-muted-foreground">{emp.employee_code}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{emp.department}</Badge>
                      </td>
                      <td className="p-4 font-medium">{emp.activities}</td>
                      <td className="p-4">
                        <span className={`font-bold text-lg ${getScoreColor(emp.productivityScore)}`}>
                          {emp.productivityScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentComparison data={departmentData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
