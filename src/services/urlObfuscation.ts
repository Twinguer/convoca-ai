import { supabase } from '@/integrations/supabase/client';

// Serviço para ofuscar URLs e controlar acesso
export class UrlObfuscationService {
  private static readonly OBFUSCATION_KEY = 'convoca_obfuscation_2024';
  
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
      const rawToken = `${concursoId}:${timestamp}:${this.OBFUSCATION_KEY}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente (opcional - para validação adicional)
      await this.storeToken(obfuscatedToken, concursoId);
      
      return obfuscatedToken;
    } catch (error) {
      console.error('Erro ao gerar token de concurso:', error);
      throw error;
    }
  }
  
  // Decodificar token e validar acesso
  static async validateConcursoToken(token: string): Promise<string | null> {
    try {
      // Decodificar o token
      const decodedToken = atob(token);
      const [concursoId, timestamp, key] = decodedToken.split(':');
      
      // Validar a chave
      if (key !== this.OBFUSCATION_KEY) {
        throw new Error('Token inválido');
      }
      
      // Verificar se o token não é muito antigo (24 horas)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (tokenAge > maxAge) {
        throw new Error('Token expirado');
      }
      
      // Verificar se o concurso ainda existe e está ativo
      const { data: concurso, error } = await supabase
        .from('concursos')
        .select('id, status')
        .eq('id', concursoId)
        .single();
      
      if (error || !concurso) {
        throw new Error('Concurso não encontrado');
      }
      
      // Verificar se o concurso ainda está ativo
      if (concurso.status === 'Finalizado' || concurso.status === 'Suspenso') {
        throw new Error('Concurso não está mais ativo');
      }
      
      return concursoId;
    } catch (error) {
      console.error('Erro ao validar token:', error);
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, concursoId: string): Promise<void> {
    try {
      // Armazenar no localStorage com expiração
      const tokenData = {
        concursoId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      localStorage.setItem(`concurso_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      console.warn('Erro ao armazenar token:', error);
    }
  }
  
  // Gerar URL segura para concurso
  static async generateSecureConcursoUrl(concursoId: string, action: 'resultados' | 'participar' = 'resultados'): Promise<string> {
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
}

// Hook para usar o serviço de ofuscação
export const useSecureUrls = () => {
  const generateSecureUrl = async (concursoId: string, action: 'resultados' | 'participar' = 'resultados') => {
    return await UrlObfuscationService.generateSecureConcursoUrl(concursoId, action);
  };
  
  const validateToken = async (token: string) => {
    return await UrlObfuscationService.validateConcursoToken(token);
  };
  
  return {
    generateSecureUrl,
    validateToken
  };
};
