import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Activity, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Employee {
  id: string;
  name: string;
  employee_code: string;
  email: string;
  department: string;
  position: string;
  is_active: boolean;
}

interface ActivityData {
  id: string;
  url: string;
  title: string;
  category: string;
  timestamp: string;
  duration: number;
}

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    productive: 0,
    unproductive: 0,
    neutral: 0,
    productivityScore: 0,
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
    if (id) {
      fetchEmployeeData();
    }
  }, [id, navigate]);

  const fetchEmployeeData = async () => {
    // Fetch employee
    const { data: empData } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (empData) {
      setEmployee(empData);
    }

    // Fetch activities
    const { data: actData } = await supabase
      .from("activities")
      .select("*")
      .eq("employee_id", id)
      .order("timestamp", { ascending: false })
      .limit(10);

    if (actData) {
      setActivities(actData);

      const productive = actData.filter((a) => a.category === "productive").length;
      const unproductive = actData.filter((a) => a.category === "unproductive").length;
      const neutral = actData.filter((a) => a.category === "neutral").length;
      const total = actData.length;
      const score = total > 0 ? Math.round((productive / total) * 100) : 0;

      setStats({
        total,
        productive,
        unproductive,
        neutral,
        productivityScore: score,
      });
    }
  };

  const pieData = [
    { name: "Productive", value: stats.productive, color: "#4caf50" },
    { name: "Unproductive", value: stats.unproductive, color: "#f44336" },
    { name: "Neutral", value: stats.neutral, color: "#ff9800" },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "productive":
        return "bg-success/20 text-success border-success";
      case "unproductive":
        return "bg-error/20 text-error border-error";
      default:
        return "bg-warning/20 text-warning border-warning";
    }
  };

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/employees")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>

        {/* Employee Profile Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-3xl">
                {employee.name.charAt(0)}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{employee.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{employee.employee_code}</Badge>
                    <Badge variant="outline">{employee.department}</Badge>
                    <Badge variant="outline">{employee.position}</Badge>
                    <Badge variant={employee.is_active ? "default" : "destructive"}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <p className="text-muted-foreground">{employee.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Activities"
            value={stats.total}
            icon={Activity}
            gradient="gradient-primary"
          />
          <StatCard
            title="Productive"
            value={stats.productive}
            icon={TrendingUp}
            gradient="gradient-success"
          />
          <StatCard
            title="Unproductive"
            value={stats.unproductive}
            icon={Activity}
            gradient="gradient-error"
          />
          <StatCard
            title="Productivity Score"
            value={`${stats.productivityScore}%`}
            icon={TrendingUp}
            gradient="gradient-info"
          />
        </div>

        {/* Charts and Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium truncate">{activity.title || activity.url}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getCategoryColor(activity.category)}>
                      {activity.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
