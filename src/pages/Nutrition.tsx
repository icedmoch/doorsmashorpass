import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Beef, Cookie, Salad, Calendar, TrendingUp, Award } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Nutrition Tracker
          </h1>
          <p className="text-muted-foreground">Track your progress and stay on target</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Today's Calories"
            value="1,280"
            subtitle="720 remaining"
            icon={Flame}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Protein"
            value="91g"
            subtitle="Almost at goal!"
            icon={Beef}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Swipes Used"
            value="12"
            subtitle="3 remaining this week"
            icon={Cookie}
            trend="neutral"
            color="secondary"
          />
          <StatCard
            title="Streak"
            value="7 days"
            subtitle="Keep it going!"
            icon={Award}
            trend="up"
            color="accent"
          />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Weekly Calories</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Last 7 days
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem"
                  }}
                />
                <Bar dataKey="calories" fill="hsl(155 45% 45%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Macro Breakdown</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Today
              </Button>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }}></div>
                  <span className="text-sm text-muted-foreground">{macro.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Meal History & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Today's Meals</h3>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {mealHistory.map((meal) => (
                <div 
                  key={meal.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{meal.meal}</p>
                      <Badge variant="outline" className="text-xs">{meal.hall}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{meal.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{meal.calories} cal</p>
                    <p className="text-sm text-muted-foreground">{meal.protein}g protein</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-6 shadow-md">
            <h3 className="font-semibold text-lg mb-6">Your Goals</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Daily Calories</span>
                  <span className="text-sm text-muted-foreground">2000 cal</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/80 w-[64%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm text-muted-foreground">150g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/80 w-[61%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Water Intake</span>
                  <span className="text-sm text-muted-foreground">8 cups</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-secondary to-secondary/80 w-[75%] rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-start gap-3">
                <Salad className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm mb-1">Nice work!</p>
                  <p className="text-xs text-muted-foreground">You're close to your protein goal. Try adding a snack!</p>
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-4 bg-gradient-to-r from-primary to-primary/90">
              Edit Goals
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Nutrition;
