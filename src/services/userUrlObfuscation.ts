import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';

// Serviço para ofuscar URLs de usuários e controlar acesso
export class UserUrlObfuscationService {
  // SECURITY: Use environment variable for obfuscation key
  private static readonly OBFUSCATION_KEY = import.meta.env.VITE_OBFUSCATION_KEY || 'fallback_key_change_in_production';
  
  // Gerar um token ofuscado para um usuário
  static async generateUserToken(userId: string): Promise<string> {
    try {
      // Verificar se o usuário existe e tem perfil público
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id, name, privacy_settings')
        .eq('id', userId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de usuário não encontrado');
      }
      
      // Verificar se o perfil é público (por padrão, todos os perfis são públicos)
      const privacySettings = userProfile.privacy_settings || {};
      const isPublic = privacySettings.is_public !== false; // Padrão: público
      
      if (!isPublic) {
        throw new Error('Perfil privado - acesso negado');
      }
      
      // Criar um token único baseado no ID + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${userId}:${timestamp}:${this.OBFUSCATION_KEY}`;
      
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
      if (key !== this.OBFUSCATION_KEY) {
        throw new Error('Token inválido');
      }
      
      // Verificar se o token não é muito antigo (24 horas)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (tokenAge > maxAge) {
        throw new Error('Token expirado');
      }
      
      // Verificar se o usuário ainda existe e tem perfil público
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id, privacy_settings')
        .eq('id', userId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de usuário não encontrado');
      }
      
      // Verificar se o perfil ainda é público (por padrão, todos os perfis são públicos)
      const privacySettings = userProfile.privacy_settings || {};
      const isPublic = privacySettings.is_public !== false; // Padrão: público
      
      if (!isPublic) {
        throw new Error('Perfil privado - acesso negado');
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
