/**
 * Edge Function: create-checkout
 * 
 * Descrição: Cria sessão de checkout no Stripe
 * Autenticação: Requer token JWT válido do Supabase
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

// ============================================
// CONFIGURAÇÃO DE ORIGENS PERMITIDAS
// ============================================
const PRODUCTION_ORIGINS = [
  "https://nomeiai.com.br",
  "https://www.nomeiai.com.br"
];

const DEVELOPMENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080"
];

// Padrão para detectar IPs locais
const LOCAL_IP_PATTERN = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1)/;

// ============================================
// CONFIGURAÇÃO DE PLANOS E PRICES DO STRIPE
// ============================================
// Price IDs do Stripe (já criados)
const STRIPE_PRICES = {
  pro: "price_1SQtQwRwuherhQlTKYDiUcgF", // R$ 21,90/mês
  // Adicionar outros planos quando criados no Stripe
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  if (DEVELOPMENT_ORIGINS.includes(origin)) return true;
  if (LOCAL_IP_PATTERN.test(origin)) return true;
  
  return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isAllowedOrigin(origin);
  
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : PRODUCTION_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  };
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  // Tratar OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  
  // Validar método HTTP
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ 
        error: "Method not allowed",
        details: "Apenas requisições POST são permitidas" 
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[create-checkout] Auth error:", authError);
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          details: authError?.message || "Token inválido ou expirado. Por favor, faça login novamente." 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    console.log(`[create-checkout] User authenticated: ${user.id}, email: ${user.email}`);

    // Validar origem
    if (!isAllowedOrigin(origin)) {
      console.warn(`[create-checkout] Origem não permitida: ${origin}`);
      return new Response(
        JSON.stringify({ 
          error: "Forbidden",
          details: "Origem não autorizada" 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Parsear body
    let requestData: { planId: string };
    try {
      const body = await req.json();
      if (!body.planId || typeof body.planId !== "string") {
        throw new Error("planId é obrigatório");
      }
      requestData = { planId: body.planId };
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Bad Request",
          details: "Body da requisição inválido ou planId não fornecido" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Validar planId
    if (requestData.planId !== "pro") {
      return new Response(
        JSON.stringify({ 
          error: "Bad Request",
          details: "Plano inválido. Apenas 'pro' está disponível." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Obter price_id do Stripe
    const priceId = STRIPE_PRICES[requestData.planId as keyof typeof STRIPE_PRICES];
    if (!priceId) {
      throw new Error(`Price ID não encontrado para o plano: ${requestData.planId}`);
    }
    
    // Inicializar Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("[create-checkout] STRIPE_SECRET_KEY não configurado");
      throw new Error("Configuração do Stripe não encontrada");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Construir URL base
    const baseUrl = (origin && origin.trim()) ? origin : PRODUCTION_ORIGINS[0];
    const successUrl = `${baseUrl}/planos?status=success&plan=${requestData.planId}`;
    const cancelUrl = `${baseUrl}/planos?status=canceled`;
    
    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_id: requestData.planId,
      },
      // Permitir Pix e Boleto no Brasil
      payment_method_types: ["card"],
      payment_method_options: {
        card: {
          installments: {
            enabled: true,
          },
        },
      },
    });
    
    console.log(`[create-checkout] Checkout session created: ${session.id} for user ${user.id}`);
    
    if (!session.url) {
      throw new Error("URL de checkout não foi gerada pelo Stripe");
    }
    
    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("[create-checkout] Unhandled error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Erro desconhecido ao processar requisição"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});