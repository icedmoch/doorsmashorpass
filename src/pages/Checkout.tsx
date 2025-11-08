import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, MapPin, Clock, Loader2 } from "lucide-react";

const Checkout = () => {
  const { items, totals, clearCart } = useCart();
  const navigate = useNavigate();
  const [deliveryOption, setDeliveryOption] = useState("pickup");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (deliveryOption === "delivery" && !deliveryLocation) {
      toast({
        title: "Missing information",
        description: "Please enter a delivery location",
        variant: "destructive",
      });
      return;
    }

    if (!deliveryTime) {
      toast({
        title: "Missing information",
        description: "Please select a delivery/pickup time",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the current user (for now, using a default user ID of 1)
      // TODO: Replace with actual authenticated user when auth is implemented
      const userId = 1;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          delivery_option: deliveryOption,
          delivery_location: deliveryOption === 'delivery' ? deliveryLocation : null,
          delivery_time: deliveryTime,
          special_notes: notes || null,
          status: 'pending',
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        food_item_name: item.name,
        quantity: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order placed!",
        description: `Your order will be ${deliveryOption === "delivery" ? "delivered" : "ready for pickup"} at ${deliveryTime}`,
      });

      clearCart();
      navigate("/student/order-history");
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add items to your cart before checking out.
            </p>
            <Button onClick={() => navigate("/student/menu")} className="w-full">
              Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/student/menu")}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{item.calories * item.quantity} cal</p>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Calories:</span>
                    <span className="font-semibold">{totals.calories}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Protein:</span>
                    <span className="font-semibold">{totals.protein}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Carbs:</span>
                    <span className="font-semibold">{totals.carbs}g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Fat:</span>
                    <span className="font-semibold">{totals.fat}g</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Pickup at Dining Hall</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pick up your order at the selected dining hall
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Campus Delivery</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deliver to your campus location
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryOption === "delivery" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Delivery Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Smith Hall Room 302"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {deliveryOption === "delivery" ? "Delivery" : "Pickup"} Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any allergies or special requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handlePlaceOrder} className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
