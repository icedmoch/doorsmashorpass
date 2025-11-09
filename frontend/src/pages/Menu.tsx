import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MenuItemCard from "@/components/MenuItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, ShoppingCart, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nutritionApi, type FoodItem } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const Menu = () => {
  const navigate = useNavigate();
  const { items: cartItems, removeItem, updateQuantity, totals, clearCart } = useCart();
  const [selectedHall, setSelectedHall] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  const diningHalls = useMemo(() => [
    { id: "all", name: "All Dining Halls" },
    { id: "worcester", name: "Worcester" },
    { id: "franklin", name: "Franklin" },
    { id: "hampshire", name: "Hampshire" },
    { id: "berkshire", name: "Berkshire" },
  ], []);
  
  const filters = ["Vegetarian", "Vegan", "Gluten-Free", "Grab & Go", "High Protein"];

  // Fetch food items on component mount or when filters change
  const fetchFoodItems = useCallback(async () => {
    setIsLoading(true);
    try {
      let items: FoodItem[];
      
      // Always filter by date - search with empty query returns all items for that date
      console.log('Fetching items for date:', selectedDate, 'query:', searchQuery || '(all)');
      items = await nutritionApi.searchFoodItems(searchQuery || "", 100, selectedDate);
      
      console.log('Fetched items:', items.length);

      // Filter by dining hall if not "all"
      if (selectedHall !== "all") {
        const hallName = diningHalls.find(h => h.id === selectedHall)?.name;
        items = items.filter(item => 
          item.location?.toLowerCase() === hallName?.toLowerCase()
        );
        console.log('After dining hall filter:', items.length);
      }

      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching food items:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load menu items",
        variant: "destructive",
      });
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedHall, selectedDate, diningHalls]);

  useEffect(() => {
    fetchFoodItems();
  }, [fetchFoodItems]);

  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        const { dates } = await nutritionApi.getAvailableDates();
        console.log('Raw dates from API:', dates);
        
        // Dates come in format "Mon November 10, 2025" - convert to YYYY-MM-DD
        const parsedDates = dates.map(dateStr => {
          try {
            // Parse the date string and convert to YYYY-MM-DD format
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split("T")[0];
            }
            return null;
          } catch {
            return null;
          }
        }).filter(Boolean) as string[];
        
        // Sort dates chronologically
        parsedDates.sort();
        console.log('Parsed and sorted dates:', parsedDates);
        
        setAvailableDates(parsedDates);
        
        // If current selected date has no data, switch to first available date
        const today = new Date().toISOString().split("T")[0];
        if (parsedDates.length > 0 && !parsedDates.includes(today)) {
          console.log('Today has no data, switching to:', parsedDates[0]);
          setSelectedDate(parsedDates[0]);
        }
      } catch (error) {
        console.error("Error loading available dates:", error);
      }
    };
    loadAvailableDates();
  }, []);
  
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Transform API FoodItem to MenuItemCard props format
  const transformedMenuItems = menuItems.map(item => ({
    id: item.id.toString(),
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.total_carb,
    fat: item.total_fat,
    allergens: [] as string[],
    available: true,
    category: item.meal_type || "Main Dish",
    diningHall: item.location || "Unknown",
  }));
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Campus Dining Menu
          </h1>
          <p className="text-muted-foreground">Discover delicious and nutritious meals</p>
        </div>
        
        {/* Filters */}
        <Card className="p-6 mb-6 shadow-md">
          {availableDates.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                📅 Menu available from{' '}
                <strong>{new Date(availableDates[0] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                {' '}to{' '}
                <strong>{new Date(availableDates[availableDates.length - 1] + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedHall} onValueChange={setSelectedHall}>
              <SelectTrigger>
                <SelectValue placeholder="Select dining hall" />
              </SelectTrigger>
              <SelectContent>
                {diningHalls.map(hall => (
                  <SelectItem key={hall.id} value={hall.id}>
                    {hall.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Generate next 14 days
                  const dates = [];
                  for (let i = 0; i < 14; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dateStr = date.toISOString().split("T")[0];
                    const hasData = availableDates.includes(dateStr);
                    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    dates.push({ value: dateStr, label, hasData });
                  }
                  return dates.map(date => (
                    <SelectItem key={date.value} value={date.value} disabled={!date.hasData}>
                      {date.label} {date.hasData ? '✓' : '(no menu)'}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
            
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="pl-10"
              />
            </div>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <Card className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading menu items...</p>
              </Card>
            ) : transformedMenuItems.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-2">No items found matching your criteria</p>
                {!availableDates.includes(selectedDate) && availableDates.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    No menu available for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}.
                    Try selecting a date with a ✓ checkmark.
                  </p>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                {transformedMenuItems.map(item => (
                  <MenuItemCard key={item.id} {...item} />
                ))}
              </div>
            )}
          </div>
          
          {/* Cart Sidebar */}
          <div className="hidden lg:block">
            <Card className="p-6 sticky top-24 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Your Cart</h3>
                </div>
                {cartItems.length > 0 && (
                  <Badge variant="secondary">{cartItems.length}</Badge>
                )}
              </div>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Your cart is empty</p>
                  <p className="text-xs mt-2">Add items to get started!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.calories} cal • {item.protein}g protein
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-3 pt-4 mt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Calories</span>
                  <span className="font-semibold">{Math.round(totals.calories)} cal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Protein</span>
                  <span className="font-semibold">{Math.round(totals.protein)}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Carbs</span>
                  <span className="font-semibold">{Math.round(totals.carbs)}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fat</span>
                  <span className="font-semibold">{Math.round(totals.fat)}g</span>
                </div>
              </div>
              
              {cartItems.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-primary/90"
                    onClick={() => navigate("/student/checkout")}
                  >
                    Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Mobile Cart */}
        <div className="lg:hidden fixed bottom-4 right-4">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-primary to-primary/90">
            <ShoppingCart className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
