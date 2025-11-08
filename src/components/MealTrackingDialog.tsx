import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type OrderItem = {
  id: string;
  food_item_name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dining_hall?: string | null;
};

type MealTrackingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: OrderItem[];
  orderId: string;
};

export function MealTrackingDialog({
  open,
  onOpenChange,
  orderItems,
  orderId,
}: MealTrackingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [mealName, setMealName] = useState("");
  const [servings, setServings] = useState("1");

  const totalCalories = orderItems.reduce((sum, item) => sum + (item.calories * item.quantity), 0);
  const totalProtein = orderItems.reduce((sum, item) => sum + (item.protein * item.quantity), 0);
  const totalCarbs = orderItems.reduce((sum, item) => sum + (item.carbs * item.quantity), 0);
  const totalFat = orderItems.reduce((sum, item) => sum + (item.fat * item.quantity), 0);

  const handleAddToNutrition = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Get or create food item for this meal
      const foodItemName = mealName || orderItems.map(item => item.food_item_name).join(", ");
      const servingMultiplier = parseFloat(servings);
      const location = orderItems[0]?.dining_hall || "Custom";
      const currentDate = new Date().toISOString().split('T')[0];
      const mealType = "Lunch";

      // Check if food item already exists
      const { data: existingFoodItem } = await supabase
        .from("food_items")
        .select()
        .eq("name", foodItemName)
        .eq("location", location)
        .eq("date", currentDate)
        .eq("meal_type", mealType)
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
            name: foodItemName,
            calories: Math.round(totalCalories / servingMultiplier),
            total_fat: totalFat / servingMultiplier,
            sodium: 0,
            total_carb: totalCarbs / servingMultiplier,
            dietary_fiber: 0,
            sugars: 0,
            protein: totalProtein / servingMultiplier,
            serving_size: "1 meal",
            location: location,
            meal_type: mealType,
            date: currentDate,
          })
          .select()
          .single();

        if (foodError) throw foodError;
        foodItem = newFoodItem;
      }

      // Add to meal entries
      const { data: mealEntry, error: entryError } = await supabase
        .from("meal_entries")
        .insert({
          profile_id: user.id,
          food_item_id: foodItem.id,
          meal_category: "Lunch",
          entry_date: new Date().toISOString().split('T')[0],
          servings: servingMultiplier,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Add individual items to meal_entry_items table
      const mealEntryItems = orderItems.map(item => ({
        meal_entry_id: mealEntry.id,
        order_item_id: item.id,
        food_item_name: item.food_item_name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        dining_hall: item.dining_hall,
      }));

      const { error: itemsError } = await supabase
        .from("meal_entry_items")
        .insert(mealEntryItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Meal added to nutrition tracking!",
        description: "You can view it on your Nutrition page.",
      });

      onOpenChange(false);
      setMealName("");
      setServings("1");
    } catch (error: any) {
      console.error("Error adding meal:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Track this meal?</DialogTitle>
          <DialogDescription>
            Would you like to add the details of this meal to your Nutrition Page for tracking?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meal Items Summary */}
          <div className="rounded-lg border border-border p-3 bg-muted/30">
            <p className="text-sm font-semibold mb-2">Items in this order:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {orderItems.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.food_item_name}
                </li>
              ))}
            </ul>
          </div>

          {/* Nutritional Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalCalories}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalProtein.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalCarbs.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{totalFat.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>

          {/* Meal Name Input */}
          <div>
            <Label htmlFor="mealName">Meal Name (optional)</Label>
            <Input
              id="mealName"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Lunch from Commons"
              className="mt-1"
            />
          </div>

          {/* Servings */}
          <div>
            <Label htmlFor="servings">Number of Servings</Label>
            <Input
              id="servings"
              type="number"
              min="0.1"
              step="0.1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adjust if you shared this meal or ate multiple portions
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            No, thanks
          </Button>
          <Button onClick={handleAddToNutrition} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Nutrition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
