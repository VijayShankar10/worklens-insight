import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";

interface RealtimeActivity {
  id: string;
  employee_id: string;
  title: string;
  category: string;
  timestamp: string;
}

const RealtimeFeed = () => {
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Fetch initial activities
    fetchRecentActivities();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          setActivities((prev) => [payload.new as RealtimeActivity, ...prev.slice(0, 9)]);
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentActivities = async () => {
    const { data } = await supabase
      .from("activities")
      .select("id, employee_id, title, category, timestamp")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (data) {
      setActivities(data);
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Live Activity Feed</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-muted"}`} />
            <span className="text-xs text-muted-foreground">{isLive ? "Live" : "Connected"}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border animate-in fade-in slide-in-from-top-2">
              <Activity className="w-4 h-4 mt-1 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium truncate">{activity.title || "Untitled Activity"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <Badge className={getCategoryColor(activity.category)}>{activity.category}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeFeed;
