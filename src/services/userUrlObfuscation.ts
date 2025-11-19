import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de usuários e controlar acesso
export class UserUrlObfuscationService {
  // ✅ SEGURANÇA: Verificar variável de ambiente apenas quando necessário (lazy check)
  private static getOBFUSCATION_KEY(): string {
    const key = import.meta.env.VITE_OBFUSCATION_KEY;
    if (!key) {
      // Em desenvolvimento, usar fallback temporário (NÃO SEGURO PARA PRODUÇÃO)
      if (import.meta.env.DEV) {
        devLog.warn('[userUrlObfuscation] ⚠️ VITE_OBFUSCATION_KEY não configurada. Usando fallback temporário apenas para desenvolvimento. Configure a variável antes de produção.');
        return 'dev_fallback_key_not_secure_change_in_production';
      }
      // Em produção, lançar erro crítico
      const error = new Error('[userUrlObfuscation] ❌ CRÍTICO: VITE_OBFUSCATION_KEY não configurada. Configure a variável de ambiente antes de usar em produção.');
      devLog.error(error.message);
      throw error;
    }
    return key;
  }
  
  // Gerar um token ofuscado para um usuário
  static async generateUserToken(userId: string): Promise<string> {
    try {
      // Verificar se o usuário existe (verificação básica)
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id, name')
        .eq('id', userId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de usuário não encontrado');
      }
      
      // Criar um token único baseado no ID + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${userId}:${timestamp}:${this.getOBFUSCATION_KEY()}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente (opcional - para validação adicional)
      await this.storeToken(obfuscatedToken, userId);
      
      return obfuscatedToken;
    } catch (error) {
      logError('Failed to generate user token', { userId }, 'URL_OBFUSCATION');
      throw error;
    }
  }
  
  // Decodificar token e validar acesso
  static async validateUserToken(token: string): Promise<string | null> {
    try {
      // Decodificar o token
      const decodedToken = atob(token);
      const [userId, timestamp, key] = decodedToken.split(':');
      
      // Validar a chave
      if (key !== this.getOBFUSCATION_KEY()) {
        throw new Error('Token inválido');
      }
      
      // Verificar se o token não é muito antigo (24 horas)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (tokenAge > maxAge) {
        throw new Error('Token expirado');
      }
      
      // Verificar se o usuário ainda existe (verificação básica)
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de usuário não encontrado');
      }
      
      return userId;
    } catch (error) {
      logError('Failed to validate user token', { token: token.substring(0, 10) + '...' }, 'URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, userId: string): Promise<void> {
    try {
      // Armazenar no localStorage com expiração
      const tokenData = {
        userId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      localStorage.setItem(`user_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      logWarn('Failed to store user token', { userId }, 'URL_OBFUSCATION');
    }
  }
  
  // Gerar URL segura para usuário
  static async generateSecureUserUrl(userId: string, action: 'profile' | 'followers' | 'following' = 'profile'): Promise<string> {
    const token = await this.generateUserToken(userId);
    return `/usuario/${action}/${token}`;
  }
  
  // Gerar URL segura para perfil
  static async generateSecureProfileUrl(userId: string): Promise<string> {
    return this.generateSecureUserUrl(userId, 'profile');
  }
  
  // Gerar URL segura para seguidores
  static async generateSecureFollowersUrl(userId: string): Promise<string> {
    return this.generateSecureUserUrl(userId, 'followers');
  }
  
  // Gerar URL segura para seguindo
  static async generateSecureFollowingUrl(userId: string): Promise<string> {
    return this.generateSecureUserUrl(userId, 'following');
  }
}

// Hook para usar o serviço de ofuscação de usuários
export const useSecureUserUrls = () => {
  const generateSecureUserUrl = async (userId: string, action: 'profile' | 'followers' | 'following' = 'profile') => {
    return await UserUrlObfuscationService.generateSecureUserUrl(userId, action);
  };
  
  const validateUserToken = async (token: string) => {
    return await UserUrlObfuscationService.validateUserToken(token);
  };
  
  return {
    generateSecureUserUrl,
    validateUserToken
  };
};
