import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Flame,
  Beef,
  Cookie,
  Salad,
  Calendar,
  TrendingUp,
  Award,
  Droplet,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type MealEntry = {
  id: number;
  profile_id: string;
  food_item_id: number;
  meal_category: string;
  entry_date: string;
  servings: number;
  food_item?: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    total_carb: number;
    total_fat: number;
    serving_size: string;
    location?: string;
  };
};

const Nutrition = () => {
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [editMealDialog, setEditMealDialog] = useState<{ open: boolean; entry: MealEntry | null }>({
    open: false,
    entry: null,
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form state for adding/editing meals
  const [mealForm, setMealForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    servings: "1",
    category: "Lunch",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Fetch user profile for TDEE
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch meal entries for today
      const today = new Date().toISOString().split("T")[0];
      const { data: entries, error: entriesError } = await supabase
        .from("meal_entries")
        .select(
          `
          *,
          food_item:food_items(*)
        `,
        )
        .eq("profile_id", user.id)
        .eq("entry_date", today);

      if (entriesError) throw entriesError;
      setMealEntries((entries as any) || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const currentDate = new Date().toISOString().split("T")[0];

      // Check if food item already exists
      const { data: existingFoodItem } = await supabase
        .from("food_items")
        .select()
        .eq("name", mealForm.name)
        .eq("location", "Custom")
        .eq("date", currentDate)
        .eq("meal_type", mealForm.category)
        .maybeSingle();

      let foodItem;

      if (existingFoodItem) {
        // Use existing food item
        foodItem = existingFoodItem;
      } else {
        // Create new food item
        const { data: newFoodItem, error: foodError } = await supabase
          .from("food_items")
          .insert({
            name: mealForm.name,
            calories: parseInt(mealForm.calories) || 0,
            protein: parseFloat(mealForm.protein) || 0,
            total_carb: parseFloat(mealForm.carbs) || 0,
            total_fat: parseFloat(mealForm.fat) || 0,
            sodium: 0,
            dietary_fiber: 0,
            sugars: 0,
            serving_size: "1 serving",
            location: "Custom",
            meal_type: mealForm.category,
            date: currentDate,
          })
          .select()
          .single();

        if (foodError) throw foodError;
        foodItem = newFoodItem;
      }

      // Create meal entry
      const { error: entryError } = await supabase.from("meal_entries").insert({
        profile_id: user.id,
        food_item_id: foodItem.id,
        meal_category: mealForm.category,
        entry_date: new Date().toISOString().split("T")[0],
        servings: parseFloat(mealForm.servings),
      });

      if (entryError) throw entryError;

      toast({
        title: "Meal added!",
        description: "Your meal has been added to your nutrition log.",
      });

      setAddMealDialog(false);
      setMealForm({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        servings: "1",
        category: "Lunch",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeal = async (entryId: number) => {
    try {
      const { error } = await supabase.from("meal_entries").delete().eq("id", entryId);

      if (error) throw error;

      toast({
        title: "Meal deleted",
        description: "The meal has been removed from your log.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateServings = async (entryId: number, newServings: number) => {
    try {
      const { error } = await supabase.from("meal_entries").update({ servings: newServings }).eq("id", entryId);

      if (error) throw error;

      toast({
        title: "Servings updated",
        description: "The serving size has been updated.",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Calculate totals
  const todayTotals = mealEntries.reduce(
    (acc, entry) => {
      const multiplier = entry.servings || 1;
      return {
        calories: acc.calories + (entry.food_item?.calories || 0) * multiplier,
        protein: acc.protein + (entry.food_item?.protein || 0) * multiplier,
        carbs: acc.carbs + (entry.food_item?.total_carb || 0) * multiplier,
        fat: acc.fat + (entry.food_item?.total_fat || 0) * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const tdeeGoal = userProfile?.tdee || 2000;
  const proteinGoal = userProfile?.weight_lbs ? Math.round(userProfile.weight_lbs * 0.8) : 150;

  const macroData = [
    { name: "Protein", value: Math.round(todayTotals.protein), color: "hsl(155 45% 45%)" },
    { name: "Carbs", value: Math.round(todayTotals.carbs), color: "hsl(25 75% 65%)" },
    { name: "Fat", value: Math.round(todayTotals.fat), color: "hsl(45 95% 60%)" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Nutrition Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">Monitor your daily intake and reach your fitness goals</p>
          </div>
          <Button onClick={() => setAddMealDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Meal
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today's Calories"
            value={Math.round(todayTotals.calories).toString()}
            subtitle={`of ${tdeeGoal} kcal`}
            icon={Flame}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Protein"
            value={`${Math.round(todayTotals.protein)}g`}
            subtitle={`of ${proteinGoal}g goal`}
            icon={Beef}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Carbs"
            value={`${Math.round(todayTotals.carbs)}g`}
            subtitle="Total today"
            icon={Cookie}
            trend="up"
            color="secondary"
          />
          <StatCard
            title="Fat"
            value={`${Math.round(todayTotals.fat)}g`}
            subtitle="Total today"
            icon={Droplet}
            trend="up"
            color="accent"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-xl mb-1">Macronutrients</h3>
                <p className="text-sm text-muted-foreground">Today's breakdown</p>
              </div>
              <Badge variant="outline" className="gap-2 px-3 py-1">
                <TrendingUp className="h-3 w-3" />
                {Math.round(todayTotals.protein + todayTotals.carbs + todayTotals.fat)}g total
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
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {macroData.map((macro) => (
                <div key={macro.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: macro.color }}
                  ></div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{macro.name}</span>
                    <span className="text-sm font-semibold">{macro.value}g</span>
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
                  <span className="text-sm font-bold text-primary">
                    {Math.round(todayTotals.calories)} / {tdeeGoal}
                  </span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((todayTotals.calories / tdeeGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((todayTotals.calories / tdeeGoal) * 100)}% of daily goal
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Protein</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(todayTotals.protein)} / {proteinGoal}g
                  </span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((todayTotals.protein / proteinGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((todayTotals.protein / proteinGoal) * 100)}% of daily goal
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Salad className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">
                    {todayTotals.calories < tdeeGoal ? "Keep going!" : "Great job!"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {todayTotals.calories < tdeeGoal
                      ? `You have ${Math.round(tdeeGoal - todayTotals.calories)} calories left for today.`
                      : "You've reached your calorie goal for today!"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Meal History */}
        <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-xl mb-1">Today's Meals</h3>
              <p className="text-sm text-muted-foreground">Your nutrition intake for today</p>
            </div>
          </div>
          {mealEntries.length === 0 ? (
            <div className="text-center py-12">
              <Salad className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No meals logged yet today</p>
              <Button onClick={() => setAddMealDialog(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Meal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mealEntries.map((entry) => {
                const item = entry.food_item;
                if (!item) return null;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-base group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {entry.meal_category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Servings: {entry.servings}</span>
                        {item.location && <span>{item.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right bg-muted/50 px-4 py-3 rounded-lg">
                        <p className="font-bold text-lg text-primary">{Math.round(item.calories * entry.servings)}</p>
                        <p className="text-xs text-muted-foreground">calories</p>
                        <p className="text-sm font-semibold mt-1">{Math.round(item.protein * entry.servings)}g</p>
                        <p className="text-xs text-muted-foreground">protein</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMeal(entry.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={addMealDialog} onOpenChange={setAddMealDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Meal</DialogTitle>
            <DialogDescription>Enter the details of your meal to track your nutrition</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Meal Name</Label>
              <Input
                id="name"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                placeholder="e.g., Grilled Chicken Salad"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  step="0.1"
                  value={mealForm.servings}
                  onChange={(e) => setMealForm({ ...mealForm, servings: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={mealForm.protein}
                  onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={mealForm.carbs}
                  onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={mealForm.fat}
                  onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Meal Category</Label>
              <Select
                value={mealForm.category}
                onValueChange={(value) => setMealForm({ ...mealForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMealDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMeal}>Add Meal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Nutrition;
