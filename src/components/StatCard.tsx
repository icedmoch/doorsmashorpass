import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "secondary" | "accent";
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend = "neutral", color = "primary" }: StatCardProps) => {
  const colorClasses = {
    primary: "from-primary/20 to-primary/10 text-primary",
    secondary: "from-secondary/20 to-secondary/10 text-secondary",
    accent: "from-accent/20 to-accent/10 text-accent",
  };
  
  const trendColors = {
    up: "text-primary",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };
  
  return (
    <Card className="p-6 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          <p className={`text-sm ${trendColors[trend]}`}>{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
