import { useEffect, useState, useCallback } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronDown,
  Search,
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
import { nutritionApi, type MealEntry as ApiMealEntry, type FoodItem } from "@/lib/api";
import { calculateBMR, calculateTDEE } from "@/lib/calculations";

type MealEntryItem = {
  id: string;
  meal_entry_id: number;
  food_item_name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dining_hall?: string | null;
};

type MealEntry = ApiMealEntry & {
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
  meal_entry_items?: MealEntryItem[];
};

const Nutrition = () => {
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMealDialog, setAddMealDialog] = useState(false);
  const [editMealDialog, setEditMealDialog] = useState<{ open: boolean; entry: MealEntry | null }>({
    open: false,
    entry: null,
  });
  const [userProfile, setUserProfile] = useState<{
    age?: number;
    sex?: string;
    height_inches?: number;
    weight_lbs?: number;
    activity_level?: number;
    goal_calories?: number;
    goal_protein?: number;
    goal_carbs?: number;
    goal_fat?: number;
  } | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);

  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedEntryDate, setSelectedEntryDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('single'); // Toggle between single day and multi-day view
  const [multiDayMeals, setMultiDayMeals] = useState<Record<string, MealEntry[]>>({});

  // Helper to check if a date is in the past
  const isDateInPast = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr < today;
  };

  // Helper to generate date range (today + next 14 days)
  const getNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  // Search state for Add Meal dialog
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");
  const [mealCategory, setMealCategory] = useState("Lunch");

  // Form state for manual entry (legacy, kept for reference)
  const [mealForm, setMealForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    servings: "1",
    category: "Lunch",
  });

  const fetchAvailableDates = useCallback(async () => {
    try {
      const { dates } = await nutritionApi.getAvailableDates();
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Fetch user profile
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setUserProfile({
            age: profile.age,
            sex: profile.sex,
            height_inches: profile.height_inches,
            weight_lbs: profile.weight_lbs,
            activity_level: profile.activity_level,
            goal_calories: profile.goal_calories,
            goal_protein: profile.goal_protein,
            goal_carbs: profile.goal_carbs,
            goal_fat: profile.goal_fat,
          });
        }
      } catch (profileError) {
        console.warn("Profile not found, using defaults");
        setUserProfile({ weight_lbs: 150 });
      }

      // Fetch meal entries for selected date using API
      const mealsData = await nutritionApi.getMealsByDate(user.id, selectedDate);
      
      // Convert the grouped meals back to a flat array with food_item details
      const allMeals: MealEntry[] = [];
      for (const category of ['Breakfast', 'Lunch', 'Dinner']) {
        const categoryMeals = mealsData[category as keyof typeof mealsData] || [];
        categoryMeals.forEach(meal => {
          allMeals.push({
            ...meal,
            food_item: {
              id: meal.food_item_id,
              name: meal.food_name || '',
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              total_carb: meal.total_carb || 0,
              total_fat: meal.total_fat || 0,
              serving_size: meal.serving_size || '',
              location: meal.location,
            }
          });
        });
      }
      
      setMealEntries(allMeals);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load nutrition data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchMultiDayData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Fetch user profile
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setUserProfile({
            age: profile.age,
            sex: profile.sex,
            height_inches: profile.height_inches,
            weight_lbs: profile.weight_lbs,
            activity_level: profile.activity_level,
            goal_calories: profile.goal_calories,
            goal_protein: profile.goal_protein,
            goal_carbs: profile.goal_carbs,
            goal_fat: profile.goal_fat,
          });
        }
      } catch (profileError) {
        console.warn("Profile not found, using defaults");
        setUserProfile({ weight_lbs: 150 });
      }

      // Fetch meal entries for next 14 days
      const dates = getNext14Days();
      const mealsByDate: Record<string, MealEntry[]> = {};

      for (const date of dates) {
        const mealsData = await nutritionApi.getMealsByDate(user.id, date);
        
        const allMeals: MealEntry[] = [];
        for (const category of ['Breakfast', 'Lunch', 'Dinner']) {
          const categoryMeals = mealsData[category as keyof typeof mealsData] || [];
          categoryMeals.forEach(meal => {
            allMeals.push({
              ...meal,
              food_item: {
                id: meal.food_item_id,
                name: meal.food_name || '',
                calories: meal.calories || 0,
                protein: meal.protein || 0,
                total_carb: meal.total_carb || 0,
                total_fat: meal.total_fat || 0,
                serving_size: meal.serving_size || '',
                location: meal.location,
              }
            });
          });
        }
        
        mealsByDate[date] = allMeals;
      }
      
      setMultiDayMeals(mealsByDate);
    } catch (error) {
      console.error("Error fetching multi-day data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load nutrition data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableDates();
    if (viewMode === 'single') {
      fetchData();
    } else {
      fetchMultiDayData();
    }
  }, [viewMode, fetchAvailableDates, fetchData, fetchMultiDayData]);

  useEffect(() => {
    if (viewMode === 'single') {
      fetchData();
    }
  }, [selectedDate, viewMode, fetchData]);

  // Search for food items in the database (filtered by selected entry date)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search only for foods available on the selected entry date
      const results = await nutritionApi.searchFoodItems(query, 50, selectedEntryDate);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to search food items",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select a food item from search results
  const handleSelectFoodItem = (item: FoodItem) => {
    setSelectedFoodItem(item);
    setSearchQuery(item.name);
    setSearchResults([]);
  };

  // Add the selected meal to user's log
  const handleAddMeal = async () => {
    try {
      if (!selectedFoodItem) {
        toast({
          title: "No food selected",
          description: "Please search and select a food item first",
          variant: "destructive",
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Create meal entry using the selected entry date
      await nutritionApi.createMealEntry({
        profile_id: user.id,
        food_item_id: selectedFoodItem.id,
        meal_category: mealCategory,
        servings: parseFloat(servings),
        entry_date: selectedEntryDate,
      });

      toast({
        title: "Meal added!",
        description: `${selectedFoodItem.name} has been added to your nutrition log for ${selectedEntryDate}.`,
      });

      // Reset form
      setAddMealDialog(false);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedFoodItem(null);
      setServings("1");
      setMealCategory("Lunch");
      
      // If adding to the current selected date, refresh
      if (selectedEntryDate === selectedDate) {
        fetchData();
      }
    } catch (error) {
      console.error('❌ Error adding meal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add meal",
        variant: "destructive",
      });
    }
  };

  // Reset search state when dialog opens
  const handleOpenAddMealDialog = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedFoodItem(null);
    setServings("1");
    setMealCategory("Lunch");
    setSelectedEntryDate(selectedDate); // Default to currently viewed date
    setAddMealDialog(true);
  };

  const handleDeleteMeal = async (entryId: number) => {
    try {
      await nutritionApi.deleteMealEntry(entryId);

      toast({
        title: "Meal deleted",
        description: "The meal has been removed from your log.",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete meal",
        variant: "destructive",
      });
    }
  };

  const handleUpdateServings = async (entryId: number, newServings: number) => {
    try {
      await nutritionApi.updateMealEntry(entryId, newServings);

      toast({
        title: "Servings updated",
        description: "The serving size has been updated.",
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update servings",
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

  // Calculate nutritional goals based on user profile
  // Priority: 1) Custom goals from profile, 2) Calculated from TDEE/BMR, 3) Defaults
  const calculateNutritionalGoals = () => {
    // If user has set custom goals, use them
    if (userProfile?.goal_calories) {
      return {
        calories: userProfile.goal_calories,
        protein: userProfile.goal_protein || (userProfile.weight_lbs ? Math.round(userProfile.weight_lbs * 0.8) : 150),
        carbs: userProfile.goal_carbs || 250,
        fat: userProfile.goal_fat || 70,
      };
    }

    // If user has complete profile info, calculate goals
    if (userProfile?.age && userProfile?.height_inches && userProfile?.weight_lbs && userProfile?.sex && userProfile?.activity_level) {
      const bmr = calculateBMR(
        userProfile.height_inches,
        userProfile.weight_lbs,
        userProfile.age,
        userProfile.sex
      );
      const tdee = calculateTDEE(bmr, userProfile.activity_level);
      
      // Calculate macros based on standard ratios
      // Protein: 0.8g per lb of body weight
      // Fat: 25-30% of calories (using 30%)
      // Carbs: remaining calories
      const protein = Math.round(userProfile.weight_lbs * 0.8);
      const fatCalories = Math.round(tdee * 0.30);
      const fat = Math.round(fatCalories / 9); // 9 calories per gram of fat
      const proteinCalories = protein * 4; // 4 calories per gram of protein
      const carbCalories = tdee - proteinCalories - fatCalories;
      const carbs = Math.round(carbCalories / 4); // 4 calories per gram of carbs

      return {
        calories: Math.round(tdee),
        protein,
        carbs,
        fat,
      };
    }

    // Fallback to default values
    const defaultWeight = userProfile?.weight_lbs || 150;
    return {
      calories: 2000,
      protein: Math.round(defaultWeight * 0.8),
      carbs: 250,
      fat: 70,
    };
  };

  const nutritionalGoals = calculateNutritionalGoals();

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Nutrition Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">Monitor your daily intake and reach your fitness goals</p>
            </div>
            {!isDateInPast(selectedDate) && (
              <Button onClick={handleOpenAddMealDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Meal
              </Button>
            )}
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Viewing Date: 
                <span className="text-xs text-muted-foreground ml-2">(Past 7 days + Next 14 days)</span>
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevDate = new Date(selectedDate);
                  prevDate.setDate(prevDate.getDate() - 1);
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  const minDate = sevenDaysAgo.toISOString().split("T")[0];
                  const newDate = prevDate.toISOString().split("T")[0];
                  if (newDate >= minDate) {
                    setSelectedDate(newDate);
                  }
                }}
                disabled={(() => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return selectedDate <= sevenDaysAgo.toISOString().split("T")[0];
                })()}
              >
                ← Previous
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={(() => {
                  const fourteenDaysLater = new Date();
                  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
                  return fourteenDaysLater.toISOString().split("T")[0];
                })()}
                min={(() => {
                  const sevenDaysAgo = new Date();
                  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                  return sevenDaysAgo.toISOString().split("T")[0];
                })()}
                className="w-40"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextDate = new Date(selectedDate);
                  nextDate.setDate(nextDate.getDate() + 1);
                  const fourteenDaysLater = new Date();
                  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
                  const maxDate = fourteenDaysLater.toISOString().split("T")[0];
                  const newDate = nextDate.toISOString().split("T")[0];
                  if (newDate <= maxDate) {
                    setSelectedDate(newDate);
                  }
                }}
                disabled={(() => {
                  const fourteenDaysLater = new Date();
                  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
                  return selectedDate >= fourteenDaysLater.toISOString().split("T")[0];
                })()}
              >
                Next →
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              >
                Today
              </Button>
            </div>
            {isDateInPast(selectedDate) && (
              <Badge variant="outline" className="ml-2">
                📖 View Only - Past Date
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title={selectedDate === new Date().toISOString().split("T")[0] ? "Today's Calories" : "Calories"}
            value={Math.round(todayTotals.calories).toString()}
            subtitle={`of ${nutritionalGoals.calories} kcal`}
            icon={Flame}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Protein"
            value={`${Math.round(todayTotals.protein)}g`}
            subtitle={`of ${nutritionalGoals.protein}g goal`}
            icon={Beef}
            trend="up"
            color="primary"
          />
          <StatCard
            title="Carbs"
            value={`${Math.round(todayTotals.carbs)}g`}
            subtitle={`of ${nutritionalGoals.carbs}g goal`}
            icon={Cookie}
            trend="up"
            color="secondary"
          />
          <StatCard
            title="Fat"
            value={`${Math.round(todayTotals.fat)}g`}
            subtitle={`of ${nutritionalGoals.fat}g goal`}
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
                    {Math.round(todayTotals.calories)} / {nutritionalGoals.calories}
                  </span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((todayTotals.calories / nutritionalGoals.calories) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((todayTotals.calories / nutritionalGoals.calories) * 100)}% of daily goal
                </p>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Protein</span>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(todayTotals.protein)} / {nutritionalGoals.protein}g
                  </span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((todayTotals.protein / nutritionalGoals.protein) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((todayTotals.protein / nutritionalGoals.protein) * 100)}% of daily goal
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
                    {todayTotals.calories < nutritionalGoals.calories ? "Keep going!" : "Great job!"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {todayTotals.calories < nutritionalGoals.calories
                      ? `You have ${Math.round(nutritionalGoals.calories - todayTotals.calories)} calories left for today.`
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
              <h3 className="font-semibold text-xl mb-1">
                {selectedDate === new Date().toISOString().split("T")[0] 
                  ? "Today's Meals" 
                  : `Meals for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedDate === new Date().toISOString().split("T")[0]
                  ? "Your nutrition intake for today"
                  : isDateInPast(selectedDate)
                    ? "View past meals (read-only)"
                    : "Plan your meals for this date"
                }
              </p>
            </div>
          </div>
          {mealEntries.length === 0 ? (
            <div className="text-center py-12">
              <Salad className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No meals logged yet today</p>
              <Button onClick={handleOpenAddMealDialog} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Meal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mealEntries.map((entry) => {
                const item = entry.food_item;
                if (!item) return null;
                const isExpanded = expandedMealId === entry.id;

                return (
                  <Collapsible
                    key={entry.id}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedMealId(open ? entry.id : null)}
                  >
                    <div className="rounded-xl border border-border bg-background/50 hover:bg-muted/30 hover:border-primary/20 transition-all duration-200 group">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-base group-hover:text-primary transition-colors">
                                {item.name}
                              </p>
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {entry.meal_category}
                              </Badge>
                              <ChevronDown 
                                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
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
                            {!isDateInPast(selectedDate) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMeal(entry.id);
                                }}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 border-t border-border/50">
                          {/* Show individual items if they exist */}
                          {entry.meal_entry_items && entry.meal_entry_items.length > 0 ? (
                            <>
                              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Items in this meal</h4>
                              <div className="space-y-2 mb-4">
                                {entry.meal_entry_items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{item.quantity}x</span>
                                      <span className="text-sm">{item.food_item_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span>{item.calories}cal</span>
                                      <span>{item.protein}g protein</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Total Nutritional Breakdown</h4>
                            </>
                          ) : (
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Nutritional Breakdown</h4>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <span className="text-sm text-muted-foreground">Calories</span>
                              <span className="font-semibold">{Math.round(item.calories * entry.servings)}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <span className="text-sm text-muted-foreground">Protein</span>
                              <span className="font-semibold">{Math.round(item.protein * entry.servings)}g</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <span className="text-sm text-muted-foreground">Carbs</span>
                              <span className="font-semibold">{Math.round(item.total_carb * entry.servings)}g</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <span className="text-sm text-muted-foreground">Fat</span>
                              <span className="font-semibold">{Math.round(item.total_fat * entry.servings)}g</span>
                            </div>
                          </div>
                          {item.serving_size && (
                            <p className="text-xs text-muted-foreground mt-3">
                              Serving size: {item.serving_size}
                            </p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Meal Plans (Next 14 Days) */}
      <div className="mb-8">
        <Card className="p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-xl mb-1">Upcoming Meal Plans</h3>
              <p className="text-sm text-muted-foreground">Your planned meals for the next 14 days</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (viewMode === 'single') {
                  fetchMultiDayData();
                  setViewMode('multi');
                } else {
                  fetchData();
                  setViewMode('single');
                }
              }}
            >
              {viewMode === 'single' ? 'Load Upcoming Meals' : 'Hide'}
            </Button>
          </div>

          {viewMode === 'multi' && (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading meal plans...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getNext14Days().slice(1).map((date) => {
                  const meals = multiDayMeals[date] || [];
                  const dateObj = new Date(date + 'T00:00:00');
                  const dayLabel = date === new Date().toISOString().split("T")[0] 
                    ? "Today" 
                    : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                  
                  const dayTotals = meals.reduce(
                    (acc, entry) => {
                      const item = entry.food_item;
                      if (!item) return acc;
                      return {
                        calories: acc.calories + (item.calories * entry.servings),
                        protein: acc.protein + (item.protein * entry.servings),
                        carbs: acc.carbs + (item.total_carb * entry.servings),
                        fat: acc.fat + (item.total_fat * entry.servings),
                      };
                    },
                    { calories: 0, protein: 0, carbs: 0, fat: 0 }
                  );

                  return (
                    <Collapsible key={date}>
                      <div className="rounded-lg border border-border bg-background/50 hover:bg-muted/20 transition-all duration-200">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-semibold">{dayLabel}</p>
                                <p className="text-sm text-muted-foreground">
                                  {meals.length} meal{meals.length !== 1 ? 's' : ''} planned
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {meals.length > 0 && (
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="text-right">
                                    <p className="font-semibold text-primary">{Math.round(dayTotals.calories)} cal</p>
                                    <p className="text-xs text-muted-foreground">{Math.round(dayTotals.protein)}g protein</p>
                                  </div>
                                </div>
                              )}
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {meals.length === 0 ? (
                            <div className="px-4 pb-4 border-t border-border/50">
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No meals planned for this day yet
                              </p>
                            </div>
                          ) : (
                            <div className="px-4 pb-4 border-t border-border/50 space-y-2">
                              {meals.map((entry) => {
                                const item = entry.food_item;
                                if (!item) return null;

                                return (
                                  <div 
                                    key={entry.id} 
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{item.name}</p>
                                        <Badge variant="outline" className="text-xs">
                                          {entry.meal_category}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                                        {item.location && ` • ${item.location}`}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-sm">{Math.round(item.calories * entry.servings)} cal</p>
                                      <p className="text-xs text-muted-foreground">
                                        {Math.round(item.protein * entry.servings)}g protein
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )
          )}
        </Card>
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={addMealDialog} onOpenChange={setAddMealDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Meal</DialogTitle>
            <DialogDescription>Search for a food item from the dining hall database</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date Selector for Entry */}
            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Input
                type="date"
                value={selectedEntryDate}
                onChange={(e) => {
                  setSelectedEntryDate(e.target.value);
                  // Reset search when date changes
                  setSearchQuery("");
                  setSearchResults([]);
                  setSelectedFoodItem(null);
                }}
                min={new Date().toISOString().split("T")[0]}
                max={(() => {
                  const fourteenDaysLater = new Date();
                  fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);
                  return fourteenDaysLater.toISOString().split("T")[0];
                })()}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Select today or up to 14 days in the future. Only foods available on this date will be shown.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for food items (e.g., chicken, salad, pizza)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!isSearching && searchResults.length > 0 && !selectedFoodItem && (
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-2">
                  {searchResults.map((item) => (
                    <Card
                      key={item.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectFoodItem(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.location && `${item.location} • `}
                            {item.serving_size}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{item.calories} cal</p>
                          <p className="text-xs text-muted-foreground">
                            P: {item.protein}g • C: {item.total_carb}g • F: {item.total_fat}g
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {!isSearching && searchQuery && searchResults.length === 0 && !selectedFoodItem && (
              <div className="text-center py-8 text-muted-foreground">
                No food items found. Try a different search term.
              </div>
            )}

            {/* Selected Food Item */}
            {selectedFoodItem && (
              <Card className="p-4 bg-accent">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{selectedFoodItem.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedFoodItem.location && `${selectedFoodItem.location} • `}
                        {selectedFoodItem.serving_size}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFoodItem(null);
                        setSearchQuery("");
                      }}
                    >
                      Change
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Calories</p>
                      <p className="font-semibold">{selectedFoodItem.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Protein</p>
                      <p className="font-semibold">{selectedFoodItem.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                      <p className="font-semibold">{selectedFoodItem.total_carb}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fat</p>
                      <p className="font-semibold">{selectedFoodItem.total_fat}g</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={servings}
                        onChange={(e) => setServings(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Meal Category</Label>
                      <Select value={mealCategory} onValueChange={setMealCategory}>
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

                  {parseFloat(servings) !== 1 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Total Nutrition ({servings} servings):</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Calories</p>
                          <p className="font-semibold text-primary">
                            {Math.round(selectedFoodItem.calories * parseFloat(servings))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Protein</p>
                          <p className="font-semibold">
                            {(selectedFoodItem.protein * parseFloat(servings)).toFixed(1)}g
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carbs</p>
                          <p className="font-semibold">
                            {(selectedFoodItem.total_carb * parseFloat(servings)).toFixed(1)}g
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fat</p>
                          <p className="font-semibold">
                            {(selectedFoodItem.total_fat * parseFloat(servings)).toFixed(1)}g
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMealDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMeal} disabled={!selectedFoodItem}>
              Add Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Nutrition;
