import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { MercadoPagoConfig, Preference } from "npm:mercadopago@^2.0.0";

// SECURITY: Restrict CORS to specific origins only
const allowedOrigins = [
  "https://nomeiai.com.br",
  "https://www.nomeiai.com.br",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080"
];

// Função para verificar se é uma origem de desenvolvimento local (localhost ou IP local)
const isLocalDevelopmentOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  // Permitir localhost com qualquer porta
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return true;
  }
  
  // Permitir qualquer IP local (192.168.x.x, 10.x.x.x, 172.16-31.x.x) com qualquer porta
  // Padrão: http://[IP]:[PORTA]
  const localIPPattern = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+):\d+$/;
  if (localIPPattern.test(origin)) {
    return true;
  }
  
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  const isAllowedOrigin = origin && (
    allowedOrigins.includes(origin) || 
    isLocalDevelopmentOrigin(origin)
  );
  
  // Para desenvolvimento local, usar a origem exata; para produção, usar a lista
  const allowOrigin = isAllowedOrigin && origin ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400"
  };
};

interface PlanConfig {
  price: number;
  name: string;
  months: number;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  
  // SEMPRE tratar OPTIONS primeiro, ANTES de qualquer validação
  // Isso garante que o preflight sempre passe, independente da origem
  if (req.method === "OPTIONS") {
    // Para OPTIONS, sempre retornar 200 com headers CORS permissivos
    // A validação real de origem acontece apenas nas requisições POST
    const corsHeadersForOptions = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400"
    };
    
    return new Response(null, { 
      status: 200,
      headers: corsHeadersForOptions
    });
  }

  // Validar origem apenas para requisições reais
  const isAllowedOrigin = !origin || 
    allowedOrigins.includes(origin) || 
    isLocalDevelopmentOrigin(origin);
  const corsHeaders = getCorsHeaders(origin);
  
  if (!isAllowedOrigin) {
    console.warn(`Blocked request from unauthorized origin: ${origin}`);
    return new Response(JSON.stringify({ error: "Unauthorized origin" }), {
      status: 403,
      headers: { 
        ...corsHeaders,
        "Content-Type": "application/json" 
      }
    });
  }

  try {
    // Obter header Authorization (seguindo o padrão da função calculate-ranking-score que funciona)
    const authHeader = req.headers.get('Authorization');
    
    // Log para debug - ver quais headers estão chegando
    console.log("[create-mercadopago-preference] Request received:", {
      method: req.method,
      origin: origin,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 30) + "..." : "none",
      allHeaders: Array.from(req.headers.keys())
    });
    
    if (!authHeader) {
      console.error("[create-mercadopago-preference] No Authorization header received");
      // Listar todos os headers para debug
      const allHeaders: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        allHeaders[key] = key.toLowerCase().includes('auth') ? '***' : value;
      });
      console.error("[create-mercadopago-preference] Available headers:", Object.keys(allHeaders));
      
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        details: "Token de autenticação não fornecido. Por favor, faça login novamente."
      }), {
        status: 401,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }
      });
    }
    
    // Criar cliente Supabase com o header Authorization passado diretamente
    // (seguindo o padrão da função calculate-ranking-score que funciona)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[create-mercadopago-preference] Missing Supabase configuration");
      return new Response(JSON.stringify({ 
        error: "Internal Server Error",
        details: "Configuração do servidor incompleta."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação (seguindo o padrão da função calculate-ranking-score)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[create-mercadopago-preference] Auth error:", {
        error: authError?.message || "No user found",
        status: authError?.status,
        code: authError?.status,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 50) || "none"
      });
      return new Response(JSON.stringify({ 
        error: "Unauthorized",
        details: authError?.message || "Token inválido ou expirado. Por favor, faça login novamente."
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log(`[create-mercadopago-preference] Authenticated user: ${user.id}, email: ${user.email}`);

    const { planId, email, name } = await req.json();

    // Configuração de planos
    const plans: Record<string, PlanConfig> = {
      pro: {
        price: 21.90,
        name: "Plano Pro - Mensal - Nomeia Aí",
        months: 1
      },
      trimestral: {
        price: 59.90,
        name: "Plano Pro - Trimestral - Nomeia Aí",
        months: 3
      },
      semestral: {
        price: 99.90,
        name: "Plano Pro - Semestral - Nomeia Aí",
        months: 6
      },
      anual: {
        price: 179.90,
        name: "Plano Pro - Anual - Nomeia Aí",
        months: 12
      }
    };

    const selectedPlan = plans[planId];
    if (!selectedPlan) {
      throw new Error("Plano inválido");
    }

    // Configurar URLs de retorno
    const baseUrl = origin || Deno.env.get("ALLOWED_ORIGIN") || "https://nomeiai.com.br";
    const successUrl = `${baseUrl}/planos?status=approved&plan=${planId}`;
    const pendingUrl = `${baseUrl}/planos?status=pending&plan=${planId}`;
    const failureUrl = `${baseUrl}/planos?status=rejected&plan=${planId}`;

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

    const preferenceSDK = new Preference(client);

    // Extrair primeiro e último nome do usuário
    const userName = name || user.user_metadata?.name || user.email?.split("@")[0] || "Cliente";
    const nameParts = userName.split(" ");
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "";

    const preferenceData = {
      items: [
        {
          id: `plano-${planId}`,
          title: selectedPlan.name,
          description: `Acesso premium ao Nomeia Aí por ${selectedPlan.months} ${selectedPlan.months > 1 ? 'meses' : 'mês'}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: selectedPlan.price,
          category_id: "services" // Categoria: serviços (recomendado pela checklist)
        }
      ],
      payer: {
        name: firstName,
        surname: lastName,
        email: email || user.email || "",
        // Adicionar mais campos do payer se disponíveis (melhora taxa de aprovação)
        ...(user.user_metadata?.phone && { phone: { number: user.user_metadata.phone } })
      },
      back_urls: {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl
      },
      auto_return: "approved",
      external_reference: `${user.id}_${planId}_${Date.now()}`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_months: selectedPlan.months.toString()
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "NOMEIA-AI",
      // Boas práticas adicionais
      binary_mode: false, // Permitir pagamentos pendentes (boleto, etc)
      installments: 12 // Máximo de parcelas
    };

    // Criar preferência usando o SDK do Mercado Pago
    let preference;
    try {
      const preferenceResponse = await preferenceSDK.create({ body: preferenceData });
      preference = preferenceResponse;
    } catch (mpError: any) {
      console.error("Mercado Pago SDK error:", mpError);
      throw new Error(`Erro ao criar preferência: ${mpError.message || "Erro desconhecido"}`);
    }

    // Salvar referência da preferência no banco (para rastreamento)
    const { error: insertError } = await supabase.from("payment_preferences").insert({
      user_id: user.id,
      plan_id: planId,
      preference_id: preference.id,
      external_reference: preferenceData.external_reference,
      amount: selectedPlan.price,
      status: "pending"
    });

    if (insertError) {
      console.error("[create-mercadopago-preference] Error saving preference to database:", {
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        userId: user.id
      });
      // Não bloquear o retorno da preferência se o insert falhar
      // O pagamento ainda pode ser processado, apenas não teremos o registro no banco
    } else {
      console.log(`[create-mercadopago-preference] Payment preference saved for user ${user.id}, preference_id: ${preference.id}`);
    }

    return new Response(JSON.stringify({ 
      init_point: preference.init_point,
      preference_id: preference.id,
      sandbox_init_point: preference.sandbox_init_point
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Error creating Mercado Pago preference:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

