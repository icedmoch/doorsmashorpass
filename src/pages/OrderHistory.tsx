import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Clock, MapPin, Package, Loader2, User, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DeliveryMap } from "@/components/DeliveryMap";

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

type OrderItem = {
  id: number;
  food_item_name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Order = {
  id: number;
  delivery_option: string;
  delivery_location: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_time: string;
  special_notes: string | null;
  status: OrderStatus;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  items?: OrderItem[];
  user_id: number;
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-orders");

  // TODO: Replace with actual authenticated user ID when auth is implemented
  const currentUserId = 1;

  useEffect(() => {
    fetchOrders();
    fetchAvailableDeliveries();
    fetchMyDeliveries();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const userId = currentUserId;

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            items: items || [],
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load order history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableDeliveries = async () => {
    try {
      // Fetch orders that need delivery but haven't been claimed
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_option', 'delivery')
        .is('delivery_person_id', null)
        .neq('user_id', currentUserId)
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            items: items || [],
          };
        })
      );

      setAvailableDeliveries(ordersWithItems);
    } catch (error) {
      console.error('Error fetching available deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load available deliveries",
        variant: "destructive",
      });
    }
  };

  const fetchMyDeliveries = async () => {
    try {
      // Fetch orders that the current user has claimed for delivery
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_person_id', currentUserId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) throw itemsError;

          return {
            ...order,
            items: items || [],
          };
        })
      );

      setMyDeliveries(ordersWithItems);
    } catch (error) {
      console.error('Error fetching my deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load your deliveries",
        variant: "destructive",
      });
    }
  };

  const handleClaimDelivery = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_person_id: currentUserId,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Delivery claimed!",
        description: "You can now deliver this order",
      });

      // Refresh the lists
      fetchAvailableDeliveries();
      fetchMyDeliveries();
    } catch (error) {
      console.error('Error claiming delivery:', error);
      toast({
        title: "Error",
        description: "Failed to claim delivery",
        variant: "destructive",
      });
    }
  };

  const handleUnclaimDelivery = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_person_id: null,
          claimed_at: null,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Delivery unclaimed",
        description: "This order is now available for others to claim",
      });

      // Refresh the lists
      fetchAvailableDeliveries();
      fetchMyDeliveries();
    } catch (error) {
      console.error('Error unclaiming delivery:', error);
      toast({
        title: "Error",
        description: "Failed to unclaim delivery",
        variant: "destructive",
      });
    }
  };

  const handleCompleteDelivery = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Delivery completed!",
        description: "Great job delivering this order",
      });

      // Refresh the lists
      fetchMyDeliveries();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "Error",
        description: "Failed to complete delivery",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ready':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'out_for_delivery':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered':
        return 'bg-green-600/10 text-green-600 border-green-600/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/student/menu")}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Orders & Deliveries</h1>
          <p className="text-muted-foreground">Manage your orders and help deliver to others</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="my-orders">My Orders</TabsTrigger>
            <TabsTrigger value="available-deliveries">
              Available Deliveries
              {availableDeliveries.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {availableDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-deliveries">
              My Deliveries
              {myDeliveries.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {myDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-orders">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Button onClick={() => navigate("/student/menu")}>
                    Browse Menu
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} showClaimButton={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available-deliveries">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No deliveries available to claim</p>
                  <p className="text-sm text-muted-foreground">Check back later for delivery opportunities</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {availableDeliveries.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    showClaimButton={true}
                    onClaim={handleClaimDelivery}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-deliveries">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myDeliveries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No deliveries claimed yet</p>
                  <p className="text-sm text-muted-foreground">Go to Available Deliveries to claim your first delivery</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {myDeliveries.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    showClaimButton={false}
                    showDeliveryActions={true}
                    onUnclaim={handleUnclaimDelivery}
                    onComplete={handleCompleteDelivery}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

type OrderCardProps = {
  order: Order;
  showClaimButton: boolean;
  showDeliveryActions?: boolean;
  onClaim?: (orderId: number) => void;
  onUnclaim?: (orderId: number) => void;
  onComplete?: (orderId: number) => void;
};

const OrderCard = ({ 
  order, 
  showClaimButton, 
  showDeliveryActions = false,
  onClaim, 
  onUnclaim,
  onComplete 
}: OrderCardProps) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ready':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'out_for_delivery':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered':
        return 'bg-green-600/10 text-green-600 border-green-600/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg mb-2">
              Order #{order.id}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(order.status)} w-fit`}
          >
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Delivery Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                {order.delivery_option === 'delivery' ? 'Delivery' : 'Pickup'}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.delivery_option === 'delivery' 
                  ? order.delivery_location 
                  : 'Dining Hall'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Scheduled Time</p>
              <p className="text-sm text-muted-foreground">
                {order.delivery_time}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Map - Show for deliveries with coordinates */}
        {order.delivery_option === 'delivery' && 
         order.delivery_latitude && 
         order.delivery_longitude && 
         order.delivery_location && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Delivery Location</h4>
            <DeliveryMap 
              lat={order.delivery_latitude}
              lng={order.delivery_longitude}
              address={order.delivery_location}
            />
          </div>
        )}

        {order.special_notes && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Special Instructions</p>
            <p className="text-sm text-muted-foreground">{order.special_notes}</p>
          </div>
        )}

        <Separator className="mb-6" />

        {/* Order Items */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold">Items</h4>
          {order.items?.map((item) => (
            <div 
              key={item.id} 
              className="flex justify-between items-start p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{item.food_item_name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>{Math.round(item.calories * item.quantity)} cal</p>
                <p className="text-muted-foreground">
                  {Math.round(item.protein * item.quantity)}g protein
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="mb-6" />

        {/* Nutrition Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {Math.round(order.total_calories)}
            </p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">
              {Math.round(order.total_protein)}g
            </p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">
              {Math.round(order.total_carbs)}g
            </p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">
              {Math.round(order.total_fat)}g
            </p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
        </div>

        {/* Action Buttons */}
        {showClaimButton && onClaim && (
          <Button 
            className="w-full" 
            onClick={() => onClaim(order.id)}
          >
            <User className="mr-2 h-4 w-4" />
            Claim This Delivery
          </Button>
        )}

        {showDeliveryActions && (
          <div className="flex gap-2">
            {order.status !== 'delivered' && onComplete && (
              <Button 
                className="flex-1" 
                onClick={() => onComplete(order.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Delivered
              </Button>
            )}
            {order.status !== 'delivered' && onUnclaim && (
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onUnclaim(order.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Unclaim
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderHistory;
