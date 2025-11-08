import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
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

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error("Order not found or unauthorized");
    }

    logStep("Order fetched", { orderId, sessionId: order.stripe_session_id });

    // If already has payment intent, return success
    if (order.stripe_payment_intent_id) {
      logStep("Payment already verified");
      return new Response(JSON.stringify({ 
        success: true, 
        alreadyPaid: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if order has a session ID
    if (!order.stripe_session_id) {
      throw new Error("No payment session found for this order");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      paymentIntent: session.payment_intent 
    });

    // Check if payment was successful
    if (session.payment_status === "paid" && session.payment_intent) {
      // Update order with payment intent ID
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ 
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'out_for_delivery'
        })
        .eq("id", orderId);

      if (updateError) {
        logStep("Error updating order", { error: updateError });
        throw updateError;
      }

      logStep("Order updated with payment verification");

      return new Response(JSON.stringify({ 
        success: true,
        paymentIntentId: session.payment_intent 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
