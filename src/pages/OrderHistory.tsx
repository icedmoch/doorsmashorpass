import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Clock, MapPin, Package, Loader2, User, CheckCircle2, XCircle, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DeliveryMap } from "@/components/DeliveryMap";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { MealTrackingDialog } from "@/components/MealTrackingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

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

type Order = {
  id: string;
  delivery_location: string;
  delivery_time: string;
  special_instructions: string | null;
  status: OrderStatus;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user_id: string;
  delivery_option?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  special_notes?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_session_id?: string | null;
  deliverer_id?: string | null;
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-orders");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mealTrackingDialog, setMealTrackingDialog] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('OrderHistory - Current user:', user?.id, user?.email);
      setUser(user);
      if (user) {
        fetchOrders(user.id);
        fetchAvailableDeliveries(user.id);
        fetchMyDeliveries(user.id);
      }
    };
    
    initAuth();

    // Check for payment pending in URL
    const orderId = searchParams.get('order');
    const paymentStatus = searchParams.get('payment');
    
    if (orderId && paymentStatus === 'pending') {
      // Show payment dialog
      handleShowPaymentDialog(orderId);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('OrderHistory - Auth state changed:', event, 'User:', session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchOrders(session.user.id);
        fetchAvailableDeliveries(session.user.id);
        fetchMyDeliveries(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const fetchOrders = async (userId: string) => {
    try {
      setIsLoading(true);

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
            status: order.status as OrderStatus,
            items: items || [],
          };
        })
      );

      setOrders(ordersWithItems as any);

      // Check if there's a recently delivered order to prompt meal tracking
      const recentlyDelivered = ordersWithItems.find(
        order => order.status === 'delivered' && 
        new Date(order.updated_at).getTime() > Date.now() - 60000 && // Delivered in last minute
        order.items && order.items.length > 0
      );

      if (recentlyDelivered && !mealTrackingDialog.open) {
        setMealTrackingDialog({
          open: true,
          order: recentlyDelivered as any,
        });
      }
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

  const fetchAvailableDeliveries = async (userId: string) => {
    try {
      // Fetch orders that need delivery but haven't been claimed (deliverer_id is null)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .neq('user_id', userId)
        .in('status', ['pending', 'preparing', 'ready'])
        .is('deliverer_id', null)
        .order('created_at', { ascending: false }) as any;

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

      setAvailableDeliveries(ordersWithItems as any);
    } catch (error) {
      console.error('Error fetching available deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load available deliveries",
        variant: "destructive",
      });
    }
  };

  const fetchMyDeliveries = async (userId: string) => {
    try {
      // Fetch orders that the current user has claimed for delivery
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('deliverer_id', userId)
        .order('created_at', { ascending: false }) as any;

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

      setMyDeliveries(ordersWithItems as any);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          deliverer_id: user.id,
          status: 'preparing',
        })
        .eq('id', orderId as any);

      if (error) throw error;

      toast({
        title: "Delivery claimed!",
        description: "You can now deliver this order",
      });

      // Refresh the lists
      fetchAvailableDeliveries(user.id);
      fetchMyDeliveries(user.id);
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          deliverer_id: null,
          status: 'pending',
        })
        .eq('id', orderId as any);

      if (error) throw error;

      toast({
        title: "Delivery unclaimed",
        description: "This order is now available for others to claim",
      });

      // Refresh the lists
      fetchAvailableDeliveries(user.id);
      fetchMyDeliveries(user.id);
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
    if (!user) return;

    try {
      // Call the edge function to complete delivery and handle payout
      const { error } = await supabase.functions.invoke('complete-delivery-payout', {
        body: { orderId },
      });

      if (error) throw error;

      toast({
        title: "Delivery completed!",
        description: "Payment has been processed to your account",
      });

      // Refresh the lists
      await fetchMyDeliveries(user.id);
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: "Error",
        description: "Failed to complete delivery",
        variant: "destructive",
      });
    }
  };

  const handleShowPaymentDialog = async (orderId: string) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setPendingOrder({
        ...order,
        status: order.status as OrderStatus,
      });
      setShowPaymentDialog(true);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleInitiatePayment = async () => {
    if (!pendingOrder || !user) return;

    // For now, we need to wait for a deliverer to be assigned
    // In a real app, you might create the payment upfront or have a pool of deliverers
    toast({
      title: "Waiting for delivery assignment",
      description: "Your order is waiting for a delivery person to be assigned. Payment will be processed once claimed.",
    });
    setShowPaymentDialog(false);
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
                  <div key={order.id}>
                    <OrderCard order={order} showClaimButton={false} />
                    {order.status === 'delivered' && order.items && order.items.length > 0 && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMealTrackingDialog({ open: true, order })}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Nutrition Log
                        </Button>
                      </div>
                    )}
                  </div>
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

        {/* Meal Tracking Dialog */}
        {mealTrackingDialog.order && (
          <MealTrackingDialog
            open={mealTrackingDialog.open}
            onOpenChange={(open) => setMealTrackingDialog({ open, order: null })}
            orderItems={mealTrackingDialog.order.items || []}
            orderId={mealTrackingDialog.order.id}
          />
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Required</DialogTitle>
              <DialogDescription>
                Your order has been created. Once a delivery person claims your order, you'll be able to complete payment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Order Details</p>
                <p className="text-sm text-muted-foreground">Delivery Fee: $10.00</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Platform fee (2%): $0.20 • Deliverer receives: $9.80
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleInitiatePayment} className="flex-1">
                  Understand
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                <div className="flex gap-2 items-center mt-1">
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                  {item.dining_hall && (
                    <>
                      <span className="text-muted-foreground text-sm">•</span>
                      <Badge variant="outline" className="text-xs">
                        {item.dining_hall}
                      </Badge>
                    </>
                  )}
                </div>
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
          <div className="space-y-3">
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium mb-1">Delivery Payment</p>
              <p className="text-lg font-bold text-primary">$9.80</p>
              <p className="text-xs text-muted-foreground">
                Customer pays $10.00 • Platform fee: $0.20
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => onClaim(order.id as any)}
            >
              <User className="mr-2 h-4 w-4" />
              Claim This Delivery
            </Button>
          </div>
        )}

        {showDeliveryActions && (
          <div className="flex gap-2">
            {order.status !== 'delivered' && onComplete && (
              <Button 
                className="flex-1" 
                onClick={() => onComplete(order.id as any)}
                disabled={!order.stripe_payment_intent_id}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Delivered
              </Button>
            )}
            {order.status !== 'delivered' && onUnclaim && (
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onUnclaim(order.id as any)}
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

// Add meal tracking dialog at the end of the main component before the export
// Insert before line 708
