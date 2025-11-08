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
    <Card className="p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{value}</p>
          <p className={`text-xs font-medium ${trendColors[trend]}`}>{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
