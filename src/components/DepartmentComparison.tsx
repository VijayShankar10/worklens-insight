import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DepartmentData {
  department: string;
  avgProductivity: number;
  totalActivities: number;
  employeeCount: number;
}

interface DepartmentComparisonProps {
  data: DepartmentData[];
}

const DepartmentComparison = ({ data }: DepartmentComparisonProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Department Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="avgProductivity" fill="hsl(var(--success))" name="Avg Productivity %" />
            <Bar dataKey="totalActivities" fill="hsl(var(--primary))" name="Total Activities" />
            <Bar dataKey="employeeCount" fill="hsl(var(--info))" name="Employee Count" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DepartmentComparison;
