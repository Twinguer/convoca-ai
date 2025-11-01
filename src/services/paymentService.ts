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
    
    if (sessionError || !session) {
      throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
    }

    // Chamar a edge function via supabase.functions.invoke (lida com headers e CORS)
    const { data, error } = await supabase.functions.invoke('create-mercadopago-preference', {
      body: {
        planId,
        email: email || session.user.email,
        name: name || session.user.user_metadata?.name
      }
    });

    if (error) {
      // Mensagens amigáveis
      const message = (error as any)?.context?.details || error.message || 'Erro ao criar preferência de pagamento';
      throw new Error(message);
    }

    // Validação básica da resposta
    if (!data || (!data.init_point && !data.sandbox_init_point)) {
      throw new Error('Resposta inválida do servidor de pagamentos.');
    }

    return data as CreatePreferenceResponse;
  }
};

