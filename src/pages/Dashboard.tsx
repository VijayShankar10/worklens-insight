import { useEffect, useState } from "react";
import { Users, Activity as ActivityIcon, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import RealtimeFeed from "@/components/RealtimeFeed";
import StatCard from "@/components/StatCard";
import DateRangePicker from "@/components/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  employee_code: string;
  department: string;
  position: string;
  is_active: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [avgProductivity, setAvgProductivity] = useState(0);
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default: last 7 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    fetchData();

    // Real-time subscription
    const subscription = supabase
      .channel("activities_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          console.log("New activity detected:", payload.new);
          fetchData();
          toast.success("New activity logged!", {
            description: "Dashboard data has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, startDate, endDate]);

  const fetchData = async () => {
    // Fetch employees
    const { data: employeesData } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (employeesData) {
      setEmployees(employeesData);
    }

    // Fetch activities count with date filter
    const { count } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString());

    setTotalActivities(count || 0);

    // Calculate average productivity with date filter
    const { data: activities } = await supabase
      .from("activities")
      .select("category")
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString());
    
    if (activities && activities.length > 0) {
      const productive = activities.filter((a) => a.category === "productive").length;
      const productivity = (productive / activities.length) * 100;
      setAvgProductivity(Math.round(productivity));
    } else {
      setAvgProductivity(0);
    }
  };

  const activeEmployees = employees.filter((e) => e.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <div className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! Here's what's happening with your team.
          </p>
        </div>

        {/* Date Range Filter */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            gradient="gradient-primary"
          />
          <StatCard
            title="Active Employees"
            value={activeEmployees}
            icon={Users}
            gradient="gradient-error"
          />
          <StatCard
            title="Total Activities"
            value={totalActivities}
            icon={ActivityIcon}
            gradient="gradient-info"
          />
          <StatCard
            title="Avg Productivity"
            value={`${avgProductivity}%`}
            icon={TrendingUp}
            gradient="gradient-success"
          />
        </div>

        {/* Realtime Feed and Employee Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <RealtimeFeed />
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <Card
                      key={employee.id}
                      className="card-hover cursor-pointer"
                      onClick={() => navigate(`/employees/${employee.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                            {employee.name.charAt(0)}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="font-semibold text-lg">{employee.name}</h3>
                              <p className="text-sm text-muted-foreground">{employee.employee_code}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {employee.department}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {employee.position}
                              </Badge>
                              <Badge
                                variant={employee.is_active ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {employee.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
