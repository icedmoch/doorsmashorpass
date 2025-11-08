import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-DELIVERY-PAYOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error("Missing orderId");
    }

    logStep("Request params", { orderId });

    // Verify the user is the customer who placed the order
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, stripe_payment_intent_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or unauthorized");
    }

    if (order.status === "delivered") {
      logStep("Order already delivered");
      return new Response(JSON.stringify({ success: true, message: "Order already delivered" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update order status to delivered
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    logStep("Order marked as delivered", { orderId });

    // Note: The payment was already transferred to the deliverer when the payment was made
    // Stripe Connect with destination charges handles this automatically
    // We just need to mark the order as delivered

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
