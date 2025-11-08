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
      <div className="p-5 flex items-center gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-xl">{name}</h3>
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              {category}
            </Badge>
            {!available && (
              <Badge variant="secondary" className="ml-auto">Sold Out</Badge>
            )}
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
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex gap-6">
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
          
          <Button 
            className="bg-gradient-to-r from-primary to-primary/90 hover:shadow-md transition-all whitespace-nowrap"
            disabled={!available}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MenuItemCard;
