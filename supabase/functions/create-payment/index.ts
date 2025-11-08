import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*, profiles!orders_deliverer_id_fkey(stripe_account_id)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or unauthorized");
    }

    logStep("Order fetched", { orderId, delivererId: order.deliverer_id });

    // Check if order has a deliverer assigned
    if (!order.deliverer_id) {
      throw new Error("Order must have a deliverer assigned before payment");
    }

    // Get deliverer's Stripe account
    const delivererStripeAccount = order.profiles?.stripe_account_id;
    
    if (!delivererStripeAccount) {
      throw new Error("Deliverer has not connected their Stripe account");
    }

    logStep("Deliverer Stripe account found", { accountId: delivererStripeAccount });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    logStep("Customer check", { customerId });

    // Create a payment session with destination charge
    // $10 total: $9.80 to deliverer, $0.20 platform fee
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Delivery Fee",
              description: `Delivery for Order #${orderId}`,
            },
            unit_amount: 1000, // $10.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: 20, // Platform fee: $0.20 in cents
        transfer_data: {
          destination: delivererStripeAccount, // Deliverer gets $9.80
        },
        metadata: {
          order_id: orderId,
          deliverer_id: order.deliverer_id,
        },
      },
      metadata: {
        order_id: orderId,
        deliverer_id: order.deliverer_id,
      },
      success_url: `${req.headers.get("origin")}/student/order-history?payment=success&order=${orderId}`,
      cancel_url: `${req.headers.get("origin")}/student/order-history?payment=cancelled&order=${orderId}`,
    });

    logStep("Checkout session created", { sessionId: session.id, paymentIntentId: session.payment_intent });

    // Update order with Stripe session ID
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ 
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", orderId);

    if (updateError) {
      logStep("Error updating order", { error: updateError });
      throw updateError;
    }

    logStep("Order updated with payment info");

    return new Response(JSON.stringify({ url: session.url }), {
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
