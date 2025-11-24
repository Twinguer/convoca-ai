import { supabase } from '@/integrations/supabase/client';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs e controlar acesso
export class UrlObfuscationService {
  // ✅ SEGURANÇA: Verificar variável de ambiente apenas quando necessário (lazy check)
  private static getOBFUSCATION_KEY(): string {
    const key = import.meta.env.VITE_URL_OBFUSCATION_KEY;
    if (!key) {
      // Em desenvolvimento, usar fallback temporário (NÃO SEGURO PARA PRODUÇÃO)
      if (import.meta.env.DEV) {
        devLog.warn('[urlObfuscation] ⚠️ VITE_URL_OBFUSCATION_KEY não configurada. Usando fallback temporário apenas para desenvolvimento. Configure a variável antes de produção.');
        return 'dev_url_fallback_key_not_secure_change_in_production';
      }
      // Em produção, lançar erro crítico
      const error = new Error('[urlObfuscation] ❌ CRÍTICO: VITE_URL_OBFUSCATION_KEY não configurada. Configure a variável de ambiente antes de usar em produção.');
      devLog.error(error.message);
      throw error;
    }
    return key;
  }
  
  // Gerar um token ofuscado para um concurso
  static async generateConcursoToken(concursoId: string): Promise<string> {
    try {
      // Verificar se o concurso existe e está ativo
      const { data: concurso, error } = await supabase
        .from('concursos')
        .select('id, titulo, status')
        .eq('id', concursoId)
        .single();
      
      if (error || !concurso) {
        throw new Error('Concurso não encontrado');
      }
      
      // Verificar se o concurso está ativo (não finalizado ou suspenso)
      if (concurso.status === 'Finalizado' || concurso.status === 'Suspenso') {
        throw new Error('Concurso não está mais ativo');
      }
      
      // Criar um token único baseado no ID + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${concursoId}:${timestamp}:${this.getOBFUSCATION_KEY()}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente (opcional - para validação adicional)
      await this.storeToken(obfuscatedToken, concursoId);
      
      return obfuscatedToken;
    } catch (error) {
      devLog.error('Erro ao gerar token de concurso:', error);
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend
  static async validateConcursoToken(token: string): Promise<string | null> {
    try {
      // Chamar RPC no backend para validar token
      const { data, error } = await supabase.rpc('validate_concurso_token', {
        p_token: token
      });
      
      if (error) {
        devLog.error('Erro ao validar token via RPC:', error);
        return null;
      }
      
      // RPC retorna UUID do concurso se válido, NULL se inválido
      return data || null;
    } catch (error) {
      devLog.error('Erro ao validar token:', error);
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, concursoId: string): Promise<void> {
    try {
      // ✅ SEGURANÇA: Usar sessionStorage em vez de localStorage
      // sessionStorage expira quando a aba é fechada, reduzindo risco de XSS persistente
      const tokenData = {
        concursoId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      sessionStorage.setItem(`concurso_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      devLog.warn('Erro ao armazenar token:', error);
    }
  }
  
  // Gerar URL segura para concurso
  static async generateSecureConcursoUrl(concursoId: string, action: 'resultados' | 'participar' | 'ranking' | 'estatisticas' | 'historico' = 'resultados'): Promise<string> {
    const token = await this.generateConcursoToken(concursoId);
    return `/concurso/${action}/${token}`;
  }
  
  // Gerar URL segura para resultados
  static async generateSecureResultadosUrl(concursoId: string): Promise<string> {
    return this.generateSecureConcursoUrl(concursoId, 'resultados');
  }
  
  // Gerar URL segura para participação
  static async generateSecureParticiparUrl(concursoId: string): Promise<string> {
    return this.generateSecureConcursoUrl(concursoId, 'participar');
  }
  
  // Gerar URL segura para ranking
  static async generateSecureRankingUrl(concursoId: string): Promise<string> {
    return this.generateSecureConcursoUrl(concursoId, 'ranking');
  }
  
  // Gerar URL segura para página de cargos (pre-classificacao)
  static async generateSecureCargosUrl(concursoId: string, state?: string): Promise<string> {
    const token = await this.generateConcursoToken(concursoId);
    const stateParam = state ? `?state=${encodeURIComponent(state)}` : '';
    return `/pre-classificacao/${token}/cargos${stateParam}`;
  }
  
  // Gerar URL segura para estatísticas
  static async generateSecureEstatisticasUrl(concursoId: string): Promise<string> {
    return this.generateSecureConcursoUrl(concursoId, 'estatisticas');
  }
  
  // Gerar URL segura para histórico
  static async generateSecureHistoricoUrl(concursoId: string): Promise<string> {
    return this.generateSecureConcursoUrl(concursoId, 'historico');
  }
}

// Hook para usar o serviço de ofuscação
export const useSecureUrls = () => {
  const generateSecureUrl = async (concursoId: string, action: 'resultados' | 'participar' | 'ranking' | 'estatisticas' | 'historico' = 'resultados') => {
    return await UrlObfuscationService.generateSecureConcursoUrl(concursoId, action);
  };
  
  const validateToken = async (token: string) => {
    return await UrlObfuscationService.validateConcursoToken(token);
  };
  
  const generateResultadosUrl = async (concursoId: string) => {
    return await UrlObfuscationService.generateSecureResultadosUrl(concursoId);
  };
  
  const generateParticiparUrl = async (concursoId: string) => {
    return await UrlObfuscationService.generateSecureParticiparUrl(concursoId);
  };
  
  const generateRankingUrl = async (concursoId: string) => {
    return await UrlObfuscationService.generateSecureRankingUrl(concursoId);
  };
  
  const generateEstatisticasUrl = async (concursoId: string) => {
    return await UrlObfuscationService.generateSecureEstatisticasUrl(concursoId);
  };
  
  const generateHistoricoUrl = async (concursoId: string) => {
    return await UrlObfuscationService.generateSecureHistoricoUrl(concursoId);
  };
  
  return {
    generateSecureUrl,
    validateToken,
    generateResultadosUrl,
    generateParticiparUrl,
    generateRankingUrl,
    generateEstatisticasUrl,
    generateHistoricoUrl
  };
};
