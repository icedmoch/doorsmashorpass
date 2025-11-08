import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

type MenuItemCardProps = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allergens: string[];
  available: boolean;
  category: string;
};

const MenuItemCard = ({ 
  name, 
  calories, 
  protein, 
  carbs, 
  fat, 
  allergens, 
  available,
  category 
}: MenuItemCardProps) => {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xl">{name}</h3>
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {category}
          </Badge>
        </div>
        
        {!available && (
          <Badge variant="secondary" className="w-fit">Sold Out</Badge>
        )}
        
        <div className="grid grid-cols-4 gap-3 py-3 border-y border-border/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{calories}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{protein}g</div>
            <div className="text-xs text-muted-foreground mt-0.5">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{carbs}g</div>
            <div className="text-xs text-muted-foreground mt-0.5">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{fat}g</div>
            <div className="text-xs text-muted-foreground mt-0.5">Fat</div>
          </div>
        </div>
        
        {allergens.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allergens.map((allergen, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {allergen}
              </Badge>
            ))}
          </div>
        )}
        
        <Button 
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:shadow-md transition-all"
          disabled={!available}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};

export default MenuItemCard;
