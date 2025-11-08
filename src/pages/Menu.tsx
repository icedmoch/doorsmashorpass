import { useState } from "react";
import Navbar from "@/components/Navbar";
import MenuItemCard from "@/components/MenuItemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Menu = () => {
  const [selectedHall, setSelectedHall] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const diningHalls = [
    { id: "all", name: "All Dining Halls" },
    { id: "worcester", name: "Worcester" },
    { id: "franklin", name: "Franklin" },
    { id: "hampshire", name: "Hampshire" },
    { id: "berkshire", name: "Berkshire" },
  ];
  
  const filters = ["Vegetarian", "Vegan", "Gluten-Free", "Grab & Go", "High Protein"];
  
  const menuItems = [
    {
      id: "1",
      name: "Grilled Chicken Bowl",
      calories: 520,
      protein: 45,
      carbs: 42,
      fat: 18,
      allergens: ["Dairy"],
      available: true,
      category: "Main Dish",
    },
    {
      id: "2",
      name: "Mediterranean Wrap",
      calories: 380,
      protein: 22,
      carbs: 48,
      fat: 12,
      allergens: ["Gluten", "Dairy"],
      available: true,
      category: "Grab & Go",
    },
    {
      id: "3",
      name: "Quinoa Power Salad",
      calories: 340,
      protein: 14,
      carbs: 52,
      fat: 10,
      allergens: [],
      available: true,
      category: "Salad",
    },
    {
      id: "4",
      name: "BBQ Pulled Pork Sandwich",
      calories: 680,
      protein: 38,
      carbs: 62,
      fat: 28,
      allergens: ["Gluten"],
      available: false,
      category: "Main Dish",
    },
    {
      id: "5",
      name: "Veggie Stir Fry",
      calories: 280,
      protein: 12,
      carbs: 38,
      fat: 8,
      allergens: ["Soy"],
      available: true,
      category: "Vegetarian",
    },
    {
      id: "6",
      name: "Protein Smoothie Bowl",
      calories: 420,
      protein: 32,
      carbs: 54,
      fat: 8,
      allergens: ["Dairy", "Tree Nuts"],
      available: true,
      category: "Grab & Go",
    },
  ];
  
  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };
  
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
            
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menu items..."
                className="pl-10"
              />
            </div>
            
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Sort by
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.map(filter => (
              <Badge
                key={filter}
                variant={selectedFilters.includes(filter) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Menu Grid */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {menuItems.map(item => (
                <MenuItemCard key={item.id} {...item} />
              ))}
            </div>
          </div>
          
          {/* Cart Sidebar */}
          <div className="hidden lg:block">
            <Card className="p-6 sticky top-24 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Your Cart</h3>
              </div>
              
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Your cart is empty</p>
                <p className="text-xs mt-2">Add items to get started!</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Calories</span>
                  <span className="font-semibold">0 cal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Protein</span>
                  <span className="font-semibold">0g</span>
                </div>
              </div>
              
              <Button className="w-full mt-4 bg-gradient-to-r from-primary to-primary/90" disabled>
                Checkout
              </Button>
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
