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
// Price IDs do Stripe
const STRIPE_PRICES = {
  pro: "price_1SQukZQOI1Sr9J1AGjhIjXur", // R$ 21,90/mês - Plano Pro
  // Outros planos disponíveis:
  // coach_starter: "price_1SQumMQOI1Sr9J1AmXgN1l2g", // R$ 49,90/mês
  // coach_professional: "price_1SQun3QOI1Sr9J1A2PAOmLOW", // R$ 149,90/mês
  // coach_enterprise: "price_1SQunxQOI1Sr9J1AKgm2zDvc", // R$ 249,90/mês
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
    // Verificar se Stripe está disponível
    if (typeof Stripe === "undefined" || !Stripe) {
      console.error("[create-checkout] Stripe não está disponível");
      throw new Error("Módulo Stripe não foi carregado corretamente");
    }
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
    
    console.log(`[create-checkout] Inicializando Stripe com chave: ${stripeSecretKey.substring(0, 12)}...`);
    
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2023-10-16",
      });
    } catch (error) {
      console.error("[create-checkout] Erro ao inicializar cliente Stripe:", error);
      throw new Error(`Erro ao inicializar Stripe: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
    
    // Construir URL base
    const baseUrl = (origin && origin.trim()) ? origin : PRODUCTION_ORIGINS[0];
    const successUrl = `${baseUrl}/planos?status=success&plan=${requestData.planId}`;
    const cancelUrl = `${baseUrl}/planos?status=canceled`;
    
    console.log(`[create-checkout] Criando sessão de checkout com:`, {
      priceId,
      mode: "subscription",
      successUrl,
      cancelUrl,
      customerEmail: user.email ? `${user.email.substring(0, 3)}***` : "none"
    });
    
    // Criar sessão de checkout no Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.create({
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
        payment_method_types: ["card"],
        payment_method_options: {
          card: {
            installments: {
              enabled: true,
            },
          },
        },
      });
    } catch (stripeError: any) {
      console.error("[create-checkout] Erro ao criar sessão no Stripe:", {
        error: stripeError,
        message: stripeError?.message,
        type: stripeError?.type,
        code: stripeError?.code,
        statusCode: stripeError?.statusCode,
        raw: stripeError?.raw
      });
      
      const errorMessage = stripeError?.message || "Erro desconhecido ao criar sessão no Stripe";
      throw new Error(`Erro do Stripe: ${errorMessage}`);
    }
    
    console.log(`[create-checkout] Checkout session created: ${session.id} for user ${user.id}`);
    
    if (!session.url) {
      console.error("[create-checkout] Sessão criada mas sem URL:", {
        sessionId: session.id,
        hasUrl: !!session.url
      });
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
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("[create-checkout] Unhandled error:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});