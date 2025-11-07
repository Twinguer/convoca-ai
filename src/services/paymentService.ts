/**
 * Payment Service
 * 
 * Serviço para integração com pagamentos via Stripe
 * Segurança: Validação de sessão, tratamento de erros robusto, logging
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface CreateCheckoutResponse {
  url: string;
  session_id: string;
}

export interface CreatePreferenceParams {
  planId: string;
  email?: string;
  name?: string;
  voucherCode?: string;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

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
    console.error("[paymentService] Erro ao validar sessão");
    throw new Error("Erro ao validar autenticação. Por favor, faça login novamente.");
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
    try {
      // Tentar fazer refresh da sessão
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession(session);
      
      if (refreshError) {
        // Se o refresh falhou, pode ser que a sessão esteja realmente inválida
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }
      
      if (refreshedSession?.session?.access_token) {
        return refreshedSession.session.access_token;
      } else {
        throw new Error("Não foi possível atualizar a sessão. Por favor, faça login novamente.");
      }
    } catch (refreshError: any) {
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
 * Trata erros da API de forma padronizada
 */
function handleApiError(error: any): Error {
  // Extrair informações sem expor detalhes técnicos
  const errorMessage = error?.message || "";
  
  // Log genérico sem expor detalhes do backend
  if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
    console.error("[paymentService] Erro de autenticação");
    return new Error("Erro de autenticação. Por favor, faça login novamente.");
  }
  
  if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
    console.error("[paymentService] Acesso negado");
    return new Error("Acesso negado. Verifique suas permissões.");
  }
  
  if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
    console.error("[paymentService] Dados inválidos");
    return new Error("Dados inválidos. Verifique os campos e tente novamente.");
  }
  
  if (errorMessage.includes("500") || errorMessage.includes("Internal Server")) {
    console.error("[paymentService] Erro no servidor ao processar pagamento");
    return new Error("Erro no servidor. Tente novamente em alguns instantes.");
  }
  
  // Erro genérico para outros casos
  console.error("[paymentService] Erro ao processar requisição de pagamento");
  return new Error("Erro ao processar pagamento. Tente novamente.");
}

// ============================================
// SERVIÇO PÚBLICO
// ============================================

export const paymentService = {
  /**
   * Cria sessão de checkout no Stripe
   */
  async createCheckout(
    planId: string
  ): Promise<CreateCheckoutResponse> {
    try {
      // Validar parâmetros
      if (!planId || typeof planId !== "string") {
        throw new Error("ID do plano é obrigatório");
      }
      
      // Garantir sessão válida (para garantir que o usuário está autenticado)
      await ensureValidSession();
      
      // Usar supabase.functions.invoke para criar sessão de checkout no Stripe
      console.log("[paymentService] Criando checkout no Stripe para plano:", planId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId
        }
      });
      
      // Tratar erro
      if (error) {
        throw handleApiError(error);
      }
      
      // Validar resposta
      if (!data || typeof data !== 'object') {
        throw new Error("Resposta inválida do servidor");
      }
      
      // Validar dados de resposta
      if (!data.url || !data.session_id) {
        throw new Error("Resposta incompleta do servidor");
      }
      
      // Log genérico de sucesso (sem expor IDs específicos)
      console.log("[paymentService] Sessão de checkout criada com sucesso");
      
      return data as CreateCheckoutResponse;
      
    } catch (error) {
      // Re-lançar erros já tratados
      if (error instanceof Error && 
          (error.message.includes("Erro de autenticação") ||
           error.message.includes("Acesso negado") ||
           error.message.includes("Dados inválidos") ||
           error.message.includes("Erro no servidor") ||
           error.message.includes("Erro ao processar pagamento") ||
           error.message.includes("ID do plano") ||
           error.message.includes("Resposta inválida") ||
           error.message.includes("Resposta incompleta"))) {
        throw error;
      }
      
      // Tratar erros desconhecidos (log genérico)
      console.error("[paymentService] Erro ao processar pagamento");
      throw new Error("Erro inesperado ao processar pagamento. Tente novamente.");
    }
  }
};

