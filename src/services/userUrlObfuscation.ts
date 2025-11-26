import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de usuários e controlar acesso
export class UserUrlObfuscationService {
  // ✅ REMOVIDO: getOBFUSCATION_KEY() - chaves não devem ser expostas no frontend
  // Tokens agora são gerados apenas via RPC no backend
  
  // ✅ SEGURANÇA: Gerar token via RPC no backend (sem expor chaves no frontend)
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
      
      // ✅ Gerar token seguro via RPC no backend
      const { data: token, error: tokenError } = await supabase.rpc('generate_secure_token', {
        p_entity_id: userId,
        p_entity_type: 'user',
        p_metadata: {},
        p_expires_in_minutes: 1440 // 24 horas
      });
      
      if (tokenError || !token) {
        logError('Failed to generate secure token via RPC', { error: tokenError, userId }, 'URL_OBFUSCATION');
        throw new Error('Falha ao gerar token seguro');
      }
      
      return token;
    } catch (error) {
      logError('Failed to generate user token', { userId }, 'URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend (sem expor chaves no frontend)
  static async validateUserToken(token: string): Promise<string | null> {
    try {
      // ✅ Usar função segura de resolução de token
      const { data, error } = await supabase.rpc('resolve_secure_token', {
        p_token: token,
        p_entity_type: 'user',
        p_consume: false
      });
      
      if (error) {
        logError('Failed to resolve secure token via RPC', { error: error.message, token: token?.substring(0, 10) }, 'URL_OBFUSCATION');
        return null;
      }
      
      // A função retorna uma tabela, então data é um array
      const resolved = Array.isArray(data) ? data[0] : data;
      
      if (resolved && resolved.entity_id) {
        return resolved.entity_id;
      }
      
      return null;
    } catch (error) {
      logError('Failed to validate user token', { token: token?.substring(0, 10) + '...' }, 'URL_OBFUSCATION');
      return null;
    }
  }
  
  // ✅ REMOVIDO: storeToken() - tokens agora são armazenados apenas no banco via RPC
  
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
