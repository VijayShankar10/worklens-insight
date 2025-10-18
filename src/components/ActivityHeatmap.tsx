import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
  const getColor = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count <= 5) return "bg-success/20";
    if (count <= 10) return "bg-success/40";
    if (count <= 20) return "bg-success/60";
    return "bg-success";
  };

  const getLast90Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = data.find((d) => d.date === dateStr);
      days.push({
        date: dateStr,
        count: dayData?.count || 0,
        day: date.getDay(),
      });
    }
    return days;
  };

  const days = getLast90Days();
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap (Last 90 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex gap-1">
                {week.map((day) => (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-4 h-4 rounded-sm ${getColor(day.count)} transition-all hover:scale-110 cursor-pointer`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {new Date(day.date).toLocaleDateString()}: {day.count} activities
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-muted rounded-sm" />
                <div className="w-3 h-3 bg-success/20 rounded-sm" />
                <div className="w-3 h-3 bg-success/40 rounded-sm" />
                <div className="w-3 h-3 bg-success/60 rounded-sm" />
                <div className="w-3 h-3 bg-success rounded-sm" />
              </div>
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default ActivityHeatmap;
