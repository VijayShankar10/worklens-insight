import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendData {
  date: string;
  productive: number;
  unproductive: number;
  neutral: number;
}

interface ActivityTrendChartProps {
  data: TrendData[];
}

const ActivityTrendChart = ({ data }: ActivityTrendChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Activity Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="productive" 
              stroke="#4caf50" 
              strokeWidth={2}
              name="Productive"
              dot={{ fill: "#4caf50" }}
            />
            <Line 
              type="monotone" 
              dataKey="unproductive" 
              stroke="#f44336" 
              strokeWidth={2}
              name="Unproductive"
              dot={{ fill: "#f44336" }}
            />
            <Line 
              type="monotone" 
              dataKey="neutral" 
              stroke="#ff9800" 
              strokeWidth={2}
              name="Neutral"
              dot={{ fill: "#ff9800" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActivityTrendChart;
