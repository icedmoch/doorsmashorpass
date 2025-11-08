import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

type MenuItemCardProps = {
  id: string;
  name: string;
  image: string;
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
  image, 
  calories, 
  protein, 
  carbs, 
  fat, 
  allergens, 
  available,
  category 
}: MenuItemCardProps) => {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative overflow-hidden aspect-video bg-muted">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!available && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm">Sold Out</Badge>
          </div>
        )}
        <Badge className="absolute top-3 right-3 bg-card/90 text-foreground border-border">
          {category}
        </Badge>
      </div>
      
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{calories}</span> cal
          </div>
          <div className="h-1 w-1 rounded-full bg-border"></div>
          <div>P: {protein}g</div>
          <div>C: {carbs}g</div>
          <div>F: {fat}g</div>
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
