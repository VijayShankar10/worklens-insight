import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
}

const StatCard = ({ title, value, icon: Icon, gradient }: StatCardProps) => {
  return (
    <Card className={`${gradient} text-white card-hover cursor-pointer`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-4xl font-bold">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
