import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Activity, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import StatCard from "@/components/StatCard";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import DateRangePicker from "@/components/DateRangePicker";
import AIInsights from "@/components/AIInsights";
import { Mail } from 'lucide-react';
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
  domain?: string;
  clicks?: number;
  scrolls?: number;
  keystrokes?: number;
  mouse_movements?: number;
  active_time?: number;
  idle_time?: number;
  engagement_score?: number;
}

interface AIInsightsData {
  name: string;
  totalActivities: number;
  productiveCount: number;
  unproductiveCount: number;
  neutralCount: number;
  productivityScore: number;
  topDomains: { domain: string; count: number; category: string }[];
  engagementScore: number;
  totalIdleTime: number;
  totalActiveTime: number;
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
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [aiInsightsData, setAiInsightsData] = useState<AIInsightsData | null>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
    if (id) {
      fetchEmployeeData();
    }
  }, [id, navigate, startDate, endDate]);

  const fetchEmployeeData = async () => {
    const { data: empData } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (empData) {
      setEmployee(empData);
    }

    const { data: allActData } = await supabase
      .from("activities")
      .select("*")
      .eq("employee_id", id)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: false });

    const { data: actData } = await supabase
      .from("activities")
      .select("*")
      .eq("employee_id", id)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: false })
      .limit(10);

    if (actData) {
      setActivities(actData);
    }

    if (allActData && allActData.length > 0) {
      const productive = allActData.filter((a) => a.category === "productive").length;
      const unproductive = allActData.filter((a) => a.category === "unproductive").length;
      const neutral = allActData.filter((a) => a.category === "neutral").length;
      const total = allActData.length;
      const score = total > 0 ? Math.round((productive / total) * 100) : 0;

      setStats({
        total,
        productive,
        unproductive,
        neutral,
        productivityScore: score,
      });

      const heatmap: { [key: string]: number } = {};
      allActData.forEach((activity) => {
        const date = new Date(activity.timestamp).toISOString().split("T")[0];
        heatmap[date] = (heatmap[date] || 0) + 1;
      });

      const heatmapArray = Object.entries(heatmap).map(([date, count]) => ({
        date,
        count,
      }));
      setHeatmapData(heatmapArray);

      // Prepare AI Insights Data
      const domainMap = allActData.reduce((acc: any, activity) => {
        const domain = activity.domain || 'unknown';
        if (!acc[domain]) {
          acc[domain] = { count: 0, category: activity.category || 'neutral' };
        }
        acc[domain].count++;
        return acc;
      }, {});

      const topDomains = Object.entries(domainMap)
        .map(([domain, data]: [string, any]) => ({
          domain,
          count: data.count,
          category: data.category
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const avgEngagement = allActData.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / total || 0;
      const totalIdle = allActData.reduce((sum, a) => sum + (a.idle_time || 0), 0);
      const totalActive = allActData.reduce((sum, a) => sum + (a.active_time || 0), 0);

      if (empData) {
        setAiInsightsData({
          name: empData.name,
          totalActivities: total,
          productiveCount: productive,
          unproductiveCount: unproductive,
          neutralCount: neutral,
          productivityScore: score,
          topDomains,
          engagementScore: Math.round(avgEngagement),
          totalIdleTime: totalIdle,
          totalActiveTime: totalActive
        });
      }
    }
  };

  const [emailPreview, setEmailPreview] = useState(false);

  const generateEmailPreview = () => {
    if (!employee || !aiInsightsData) {
      toast.error('Please generate AI insights first');
      return;
    }

    setEmailPreview(true);
    toast.success('📧 Email preview generated! (In production, this would send a real email)');
  };

  const closeEmailPreview = () => {
    setEmailPreview(false);
  };

  const pieData = [
    { name: "Productive", value: stats.productive, color: "#4caf50" },
    { name: "Unproductive", value: stats.unproductive, color: "#f44336" },
    { name: "Neutral", value: stats.neutral, color: "#ff9800" },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "productive":
        return "bg-green-100 text-green-800 border-green-300";
      case "unproductive":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-orange-100 text-orange-800 border-orange-300";
    }
  };

  if (!employee) return null;

  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <div className="lg:ml-64 p-8 pt-20 lg:pt-8">
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
                    <Badge className="bg-purple-100 text-purple-800">{employee.employee_code}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{employee.department}</Badge>
                    <Badge className="bg-gray-100 text-gray-800">{employee.position}</Badge>
                    <Badge className={employee.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
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

        {/* Date Range Filter */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* Activity Heatmap */}
        <ActivityHeatmap data={heatmapData} />

        {/* Charts and Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
                  <div key={activity.id} className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium truncate">{activity.title || activity.url}</p>
                        <Badge className={getCategoryColor(activity.category)}>
                          {activity.category}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      
                      {/* Interaction Metrics */}
                      {(activity.clicks || activity.scrolls || activity.keystrokes || activity.mouse_movements || activity.idle_time || activity.engagement_score) && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          {activity.clicks !== undefined && activity.clicks > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>🖱️</span>
                              <span>{activity.clicks} clicks</span>
                            </div>
                          )}
                          {activity.scrolls !== undefined && activity.scrolls > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>📜</span>
                              <span>{activity.scrolls} scrolls</span>
                            </div>
                          )}
                          {activity.keystrokes !== undefined && activity.keystrokes > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>⌨️</span>
                              <span>{activity.keystrokes} keys</span>
                            </div>
                          )}
                          {activity.mouse_movements !== undefined && activity.mouse_movements > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>↔️</span>
                              <span>{activity.mouse_movements} moves</span>
                            </div>
                          )}
                          {activity.idle_time !== undefined && activity.idle_time > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span>⏸️</span>
                              <span>{Math.floor(activity.idle_time / 60)}m {activity.idle_time % 60}s idle</span>
                            </div>
                          )}
                          {activity.engagement_score !== undefined && activity.engagement_score > 0 && (
                            <div className="flex items-center gap-1">
                              <span>⚡</span>
                              <span className={`font-medium ${
                                activity.engagement_score >= 70 ? 'text-green-600' :
                                activity.engagement_score >= 40 ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {activity.engagement_score}% engaged
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* AI Insights */}
        {aiInsightsData && (
          <AIInsights employeeData={aiInsightsData} />
        )}
        {/* Email Reports */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                Email Reports
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Send productivity reports directly to employee email
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={generateEmailPreview}
                className="gradient-primary text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Preview Email Report
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  toast.info('Weekly report feature available in premium version');
                }}
              >
                Send Weekly Report
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Email Preview Modal */}
        {emailPreview && aiInsightsData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEmailPreview}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">📧 Email Preview</h2>
                    <p className="text-sm opacity-90">Daily Productivity Summary</p>
                  </div>
                  <button 
                    onClick={closeEmailPreview}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Email Header */}
                <div className="text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <h1 className="text-3xl font-bold">WorkLens</h1>
                  <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
                </div>

                {/* Greeting */}
                <div>
                  <p className="text-lg">Hi <strong>{employee.name}</strong>,</p>
                  <p className="text-gray-600">Here's your productivity summary for today:</p>
                </div>

                {/* Productivity Score */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-8 rounded-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">Productivity Score</h3>
                  <div className="text-7xl font-bold">{aiInsightsData.productivityScore}%</div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-gray-800">{aiInsightsData.totalActivities}</div>
                    <div className="text-sm text-gray-600">Total Activities</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{aiInsightsData.productiveCount}</div>
                    <div className="text-sm text-gray-600">Productive</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">{aiInsightsData.unproductiveCount}</div>
                    <div className="text-sm text-gray-600">Unproductive</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-orange-600">{aiInsightsData.neutralCount}</div>
                    <div className="text-sm text-gray-600">Neutral</div>
                  </div>
                </div>

                {/* Time Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{Math.floor(aiInsightsData.totalActiveTime / 60)}m</div>
                    <div className="text-sm text-gray-600">Active Time</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">{aiInsightsData.engagementScore}%</div>
                    <div className="text-sm text-gray-600">Engagement Score</div>
                  </div>
                </div>

                {/* Top Activities */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">📊 Top Activities Today</h3>
                  <div className="space-y-2">
                    {aiInsightsData.topDomains.slice(0, 5).map((act, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <span className="text-gray-700">{act.domain}</span>
                        <span className="font-semibold">{act.count} times</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights Note */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600">
                    🤖 <strong>AI Insights:</strong> This email includes personalized productivity recommendations generated by Google Gemini AI.
                  </p>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <button 
                    onClick={() => window.open('/dashboard', '_blank')}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  >
                    View Full Dashboard
                  </button>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500 pt-6 border-t">
                  <p>This email was sent by WorkLens Productivity Analytics</p>
                  <p className="mt-1">To: {employee.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-b-lg text-center">
                <p className="text-sm text-gray-600">
                  📧 In production, this email would be sent to <strong>{employee.email}</strong>
                </p>
                <button 
                  onClick={closeEmailPreview}
                  className="mt-3 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetail;
