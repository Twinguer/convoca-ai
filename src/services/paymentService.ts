import { supabase } from "@/integrations/supabase/client";

export interface CreatePreferenceResponse {
  init_point: string;
  preference_id: string;
  sandbox_init_point?: string;
}

// SECURITY: Usar variáveis de ambiente quando disponíveis
// Fallback para valores hardcoded apenas para compatibilidade
// Nota: A chave anon é pública e segura para uso no frontend (protegida por RLS no backend)
// IMPORTANTE: NUNCA exponha SERVICE_ROLE_KEY ou tokens privados no frontend
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ppsymqrdtjyaguftracc.supabase.co";

export const paymentService = {
  async createPreference(planId: string, email?: string, name?: string): Promise<CreatePreferenceResponse> {
    // Obter sessão atual (com refresh automático se necessário)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Validação de segurança: verificar autenticação antes de prosseguir
    if (sessionError || !session) {
      throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    }

    // Validação de segurança: verificar se o token está presente
    if (!session.access_token) {
      throw new Error("Token de autenticação inválido. Por favor, faça login novamente.");
    }

    // Usar fetch diretamente para ter controle total sobre os headers
    // Nota: Esta é uma prática segura desde que validemos a sessão antes
    const functionUrl = `${SUPABASE_URL}/functions/v1/create-mercadopago-preference`;

    // Garantir que o token tenha o formato correto (Bearer {token})
    const authToken = session.access_token.startsWith("Bearer ") 
      ? session.access_token 
      : `Bearer ${session.access_token}`;
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authToken,
        "apikey": SUPABASE_ANON_KEY,
        "x-client-info": "nomeiai-web"
      },
      body: JSON.stringify({
        planId, 
        email: email || session.user.email,
        name: name || session.user.user_metadata?.name
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      
      // Log de erro detalhado
      console.error("[paymentService] Error invoking create-mercadopago-preference:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData?.error || errorData?.message || "Unknown error",
        details: errorData?.details
      });
      
      // Melhorar mensagem de erro baseada no status
      let errorMessage = errorData.details || errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = errorData.details || errorData.error || "Erro de autenticação. Por favor, faça login novamente.";
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }
};

