import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Beef, Cookie, Salad, Calendar, TrendingUp, Award, Droplet } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Nutrition = () => {
  const weeklyData = [
    { day: "Mon", calories: 1850 },
    { day: "Tue", calories: 2100 },
    { day: "Wed", calories: 1920 },
    { day: "Thu", calories: 2250 },
    { day: "Fri", calories: 2050 },
    { day: "Sat", calories: 1780 },
    { day: "Sun", calories: 2180 },
  ];
  
  const macroData = [
    { name: "Protein", value: 140, color: "hsl(155 45% 45%)" },
    { name: "Carbs", value: 250, color: "hsl(25 75% 65%)" },
    { name: "Fat", value: 70, color: "hsl(45 95% 60%)" },
  ];
  
  const mealHistory = [
    { id: 1, time: "8:30 AM", meal: "Protein Smoothie Bowl", hall: "The Commons", calories: 420, protein: 32 },
    { id: 2, time: "12:45 PM", meal: "Grilled Chicken Bowl", hall: "West Campus", calories: 520, protein: 45 },
    { id: 3, time: "7:15 PM", meal: "Quinoa Power Salad", hall: "East Side Eats", calories: 340, protein: 14 },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Nutrition Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Monitor your daily intake and reach your fitness goals</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today's Calories"
            value="1,280"
            subtitle="of 2,000 kcal"
            icon={Flame}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Protein"
            value="91g"
            subtitle="of 150g goal"
            icon={Beef}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Water Intake"
            value="6 cups"
            subtitle="of 8 cups"
            icon={Droplet}
            trend="up"
            color="secondary"
          />
          <StatCard
            title="Active Streak"
            value="7 days"
            subtitle="Personal best!"
            icon={Award}
            trend="up"
            color="accent"
          />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-xl mb-1">Weekly Calories</h3>
                <p className="text-sm text-muted-foreground">Your 7-day intake trend</p>
              </div>
              <Badge variant="outline" className="gap-2 px-3 py-1">
                <Calendar className="h-3 w-3" />
                Last 7 days
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                />
                <Bar 
                  dataKey="calories" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-xl mb-1">Macronutrients</h3>
                <p className="text-sm text-muted-foreground">Today's breakdown</p>
              </div>
              <Badge variant="outline" className="gap-2 px-3 py-1">
                <TrendingUp className="h-3 w-3" />
                460g total
              </Badge>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${value}g`}
                    outerRadius={85}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: macro.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{macro.name}</span>
                    <span className="text-sm font-semibold">{macro.value}g</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Meal History & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-xl mb-1">Today's Meals</h3>
                <p className="text-sm text-muted-foreground">Your nutrition intake for today</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                View History
              </Button>
            </div>
            <div className="space-y-3">
              {mealHistory.map((meal) => (
                <div 
                  key={meal.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-base group-hover:text-primary transition-colors">{meal.meal}</p>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">{meal.hall}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {meal.time}
                    </p>
                  </div>
                  <div className="text-right bg-muted/50 px-4 py-3 rounded-lg">
                    <p className="font-bold text-lg text-primary">{meal.calories}</p>
                    <p className="text-xs text-muted-foreground">calories</p>
                    <p className="text-sm font-semibold mt-1">{meal.protein}g</p>
                    <p className="text-xs text-muted-foreground">protein</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="font-semibold text-xl mb-1">Daily Goals</h3>
              <p className="text-sm text-muted-foreground">Track your progress</p>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Calories</span>
                  <span className="text-sm font-bold text-primary">1,280 / 2,000</span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 w-[64%] rounded-full transition-all duration-500"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">64% of daily goal</p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Protein</span>
                  <span className="text-sm font-bold text-primary">91 / 150g</span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 w-[61%] rounded-full transition-all duration-500"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">61% of daily goal</p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Water</span>
                  <span className="text-sm font-bold text-secondary">6 / 8 cups</span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div className="h-full bg-gradient-to-r from-secondary via-secondary to-secondary/90 w-[75%] rounded-full transition-all duration-500"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">75% of daily goal</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Salad className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">You're doing great!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Almost at your protein goal. Keep up the momentum!</p>
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md">
              Customize Goals
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
