/**
 * Payment Service
 * 
 * Serviço para integração com pagamentos via Mercado Pago
 * Segurança: Validação de sessão, tratamento de erros robusto, logging
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface CreatePreferenceResponse {
  init_point: string;
  preference_id: string;
  sandbox_init_point?: string;
}

export interface CreatePreferenceParams {
  planId: string;
  email?: string;
  name?: string;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ppsymqrdtjyaguftracc.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Valida se a sessão está válida e atualiza se necessário
 */
async function ensureValidSession(): Promise<string> {
  // Obter sessão atual
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("[paymentService] Session error:", sessionError);
    throw new Error(`Erro ao obter sessão: ${sessionError.message}`);
  }
  
  if (!session) {
    throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
  }

  // Verificar se o token está expirado ou próximo de expirar
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || 0;
  const timeUntilExpiry = expiresAt - now;
  
  // Se o token está expirado ou vai expirar em menos de 5 minutos, fazer refresh
  if (timeUntilExpiry < 300 || expiresAt <= now) {
    console.log("[paymentService] Token expirado ou próximo de expirar, fazendo refresh...");
    
    try {
      // Tentar fazer refresh da sessão
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession(session);
      
      if (refreshError) {
        console.error("[paymentService] Refresh error:", refreshError);
        // Se o refresh falhou, pode ser que a sessão esteja realmente inválida
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
      
      if (refreshedSession?.session?.access_token) {
        console.log("[paymentService] Token atualizado com sucesso");
        return refreshedSession.session.access_token;
      } else {
        throw new Error("Não foi possível atualizar a sessão. Por favor, faça login novamente.");
      }
    } catch (refreshError: any) {
      console.error("[paymentService] Erro ao fazer refresh:", refreshError);
      
      // Se o erro for de sessão expirada/inválida, forçar novo login
      if (refreshError?.message?.includes("expired") || refreshError?.message?.includes("invalid")) {
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
      
      throw new Error("Erro ao atualizar sessão. Por favor, faça login novamente.");
    }
  }
  
  // Verificar se o token existe
  if (!session.access_token) {
    throw new Error("Token de autenticação inválido. Por favor, faça login novamente.");
  }
  
  return session.access_token;
}

/**
 * Formata token de autenticação
 */
function formatAuthToken(token: string): string {
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

/**
 * Trata erros da API de forma padronizada
 */
function handleApiError(response: Response, errorText: string): Error {
  let errorData: any;
  
  try {
    errorData = JSON.parse(errorText);
  } catch {
    errorData = { message: errorText || `HTTP ${response.status}` };
  }
  
  const status = response.status;
  const details = errorData.details || errorData.error || errorData.message || response.statusText;
  
  // Log detalhado para debugging
  console.error("[paymentService] API Error:", {
    status,
    statusText: response.statusText,
    details,
    url: response.url
  });
  
  // Mensagens de erro específicas por status
  if (status === 401) {
    return new Error("Erro de autenticação. Por favor, faça login novamente.");
  }
  
  if (status === 403) {
    return new Error("Acesso negado. Verifique suas permissões.");
  }
  
  if (status === 400) {
    return new Error(details || "Dados inválidos. Verifique os campos e tente novamente.");
  }
  
  if (status >= 500) {
    return new Error("Erro no servidor. Tente novamente em alguns instantes.");
  }
  
  return new Error(details || `Erro ao processar requisição (${status})`);
}

// ============================================
// SERVIÇO PÚBLICO
// ============================================

export const paymentService = {
  /**
   * Cria preferência de pagamento no Mercado Pago
   */
  async createPreference(
    planId: string,
    email?: string,
    name?: string
  ): Promise<CreatePreferenceResponse> {
    try {
      // Validar parâmetros
      if (!planId || typeof planId !== "string") {
        throw new Error("ID do plano é obrigatório");
      }
      
      // Garantir sessão válida
      const accessToken = await ensureValidSession();
      
      // Construir URL da Edge Function
      const functionUrl = `${SUPABASE_URL}/functions/v1/create-mp-preference`;
      
      // Fazer requisição
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": formatAuthToken(accessToken),
          "apikey": SUPABASE_ANON_KEY,
          "x-client-info": "nomeiai-web"
        },
        body: JSON.stringify({
          planId,
          email,
          name
        })
      });
      
      // Tratar resposta
      const responseText = await response.text();
      
      if (!response.ok) {
        throw handleApiError(response, responseText);
      }
      
      // Parsear resposta de sucesso
      let data: CreatePreferenceResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Resposta inválida do servidor");
      }
      
      // Validar dados de resposta
      if (!data.init_point || !data.preference_id) {
        throw new Error("Resposta incompleta do servidor");
      }
      
      console.log(`[paymentService] Preferência criada: ${data.preference_id}`);
      
      return data;
      
    } catch (error) {
      // Re-lançar erros conhecidos
      if (error instanceof Error) {
        throw error;
      }
      
      // Tratar erros desconhecidos
      console.error("[paymentService] Erro não tratado:", error);
      throw new Error("Erro inesperado ao processar pagamento. Tente novamente.");
    }
  }
};

