import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

// SECURITY: Restrict CORS to specific origins only
const allowedOrigins = [
  "https://nomeiai.lovable.app",
  "https://nomeiai.com.br",
  "http://localhost:3000", // Development only
  "http://localhost:5173"  // Development only
];

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "https://nomeiai.lovable.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400"
};

serve(async (req) => {
  // SECURITY: Validate origin before processing any request
  const origin = req.headers.get("origin");
  const isAllowedOrigin = allowedOrigins.includes(origin || "");
  
  if (origin && !isAllowedOrigin) {
    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, planId } = await req.json();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Plan configuration
    const plans = {
      mensal: {
        price: 3490, // R$ 34,90 in cents
        name: "Plano Mensal",
        interval: "month"
      },
      trimestral: {
        price: 29990, // R$ 299,90 in cents
        name: "Plano Trimestral",
        interval: "month",
        interval_count: 3
      },
      semestral: {
        price: 27990, // R$ 279,90 in cents
        name: "Plano Semestral",
        interval: "month",
        interval_count: 6
      },
      anual: {
        price: 23990, // R$ 239,90 in cents
        name: "Plano Anual",
        interval: "year"
      }
    };

    const selectedPlan = plans[planId as keyof typeof plans];
    if (!selectedPlan) {
      throw new Error("Plano inválido");
    }

    // Create a subscription checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: selectedPlan.name,
              description: `Acesso premium por ${'interval_count' in selectedPlan ? selectedPlan.interval_count : 1} ${
                selectedPlan.interval === 'month' ? 'mês' : 
                selectedPlan.interval === 'year' ? 'ano' : selectedPlan.interval
              }${'interval_count' in selectedPlan && selectedPlan.interval_count > 1 ? 'es' : ''}`
            },
            unit_amount: selectedPlan.price,
            recurring: {
              interval: selectedPlan.interval as "month" | "year",
              interval_count: 'interval_count' in selectedPlan ? selectedPlan.interval_count : 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/planos?success=true&plan=${planId}`,
      cancel_url: `${req.headers.get("origin")}/planos?canceled=true`,
      metadata: {
        plan_id: planId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});