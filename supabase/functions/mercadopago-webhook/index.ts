import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { MercadoPagoConfig, Payment } from "npm:mercadopago@^2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { type, data } = body;

    console.log("Mercado Pago webhook received:", type, data);

    // Processar apenas eventos de pagamento
    if (type === "payment") {
      const paymentId = data.id;
      
      // Inicializar SDK do Mercado Pago
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!accessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
      }

      const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: {
          timeout: 5000,
        }
      });

      const paymentSDK = new Payment(client);

      // Buscar informações do pagamento usando o SDK
      let payment;
      try {
        const paymentResponse = await paymentSDK.get({ id: paymentId });
        payment = paymentResponse;
      } catch (mpError: any) {
        console.error("Mercado Pago SDK error ao buscar pagamento:", mpError);
        throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${mpError.message || "Erro desconhecido"}`);
      }
      
      // Extrair informações do external_reference
      const externalRef = payment.external_reference;
      const [userId, planId, timestamp] = externalRef.split("_");

      if (!userId || !planId) {
        console.error("External reference inválido:", externalRef);
        return new Response(JSON.stringify({ error: "Invalid reference" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Atualizar preferência de pagamento
      await supabase
        .from("payment_preferences")
        .update({
          payment_id: paymentId,
          status: payment.status,
          updated_at: new Date().toISOString()
        })
        .eq("external_reference", externalRef)
        .catch(err => console.error("Error updating preference:", err));

      // Processar pagamento aprovado
      if (payment.status === "approved") {
        // Calcular data de expiração
        const planMonths = parseInt(payment.metadata?.plan_months || "1");
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + planMonths);

        // Atualizar ou criar assinatura
        const { error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "pro",
            is_active: true,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id"
          });

        if (subscriptionError) {
          console.error("Error updating subscription:", subscriptionError);
          throw subscriptionError;
        }

        console.log(`Subscription activated for user ${userId}, plan ${planId}, expires at ${expiresAt.toISOString()}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

