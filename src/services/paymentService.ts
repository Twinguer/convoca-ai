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
      console.error("[paymentService] Session error:", sessionError);
      throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    }

    // Validação de segurança: verificar se o token está presente
    if (!session.access_token) {
      console.error("[paymentService] No access token in session");
      throw new Error("Token de autenticação inválido. Por favor, faça login novamente.");
    }

    // Tentar refresh da sessão se necessário (para garantir que o token está válido)
    try {
      const { data: { user }, error: refreshError } = await supabase.auth.getUser();
      if (refreshError || !user) {
        console.error("[paymentService] Token validation error:", refreshError);
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
    } catch (error: any) {
      console.error("[paymentService] Error validating session:", error);
      throw new Error("Erro ao validar sessão. Por favor, faça login novamente.");
    }

    // Usar supabase.functions.invoke() que gerencia automaticamente os headers de autenticação
    // Isso é mais seguro e garante que os headers sejam enviados corretamente
    try {
      const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
        body: {
          planId,
          email: email || session.user.email,
          name: name || session.user.user_metadata?.name
        }
      });

      if (error) {
        // Tentar extrair detalhes do erro da resposta
        let errorDetails = error.message;
        let responseBody = null;
        
        if (error.context && error.context instanceof Response) {
          try {
            // Ler o corpo da resposta (pode ser usado apenas uma vez)
            responseBody = await error.context.clone().text();
            try {
              const parsedError = JSON.parse(responseBody);
              errorDetails = parsedError.details || parsedError.error || parsedError.message || errorDetails;
            } catch {
              // Se não for JSON, usar o texto direto
              errorDetails = responseBody || errorDetails;
            }
          } catch (e) {
            console.warn("[paymentService] Could not read error response body:", e);
          }
        }
        
        console.error("[paymentService] Error invoking create-mercadopago-preference:", {
          error: error.message,
          errorDetails: errorDetails,
          responseBody: responseBody,
          status: error.context?.status,
          statusText: error.context?.statusText,
          hasSession: !!session,
          hasToken: !!session.access_token,
          userId: session.user.id,
          tokenPrefix: session.access_token?.substring(0, 20) + "..."
        });
        
        // Usar a mensagem de detalhes se disponível, senão usar a mensagem padrão
        const finalError = errorDetails || error.message || "Erro ao criar preferência de pagamento.";
        throw new Error(finalError);
      }

      if (!data) {
        throw new Error("Resposta vazia do servidor.");
      }

      return data as CreatePreferenceResponse;
    } catch (error: any) {
      // Se for um erro do Supabase Functions
      if (error.message) {
        console.error("[paymentService] Function invocation error:", error);
        throw error;
      }
      
      // Se for outro tipo de erro
      console.error("[paymentService] Unexpected error:", error);
      throw new Error(`Erro ao comunicar com o servidor: ${error.message || 'Erro desconhecido'}`);
    }
  }
};

