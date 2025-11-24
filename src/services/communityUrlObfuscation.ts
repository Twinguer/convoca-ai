import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs da comunidade e controlar acesso
export class CommunityUrlObfuscationService {
  // ✅ SEGURANÇA: Verificar variável de ambiente apenas quando necessário (lazy check)
  private static getOBFUSCATION_KEY(): string {
    const key = import.meta.env.VITE_COMMUNITY_OBFUSCATION_KEY;
    if (!key) {
      // Em desenvolvimento, usar fallback temporário (NÃO SEGURO PARA PRODUÇÃO)
      if (import.meta.env.DEV) {
        devLog.warn('[communityUrlObfuscation] ⚠️ VITE_COMMUNITY_OBFUSCATION_KEY não configurada. Usando fallback temporário apenas para desenvolvimento. Configure a variável antes de produção.');
        return 'dev_community_fallback_key_not_secure_change_in_production';
      }
      // Em produção, lançar erro crítico
      const error = new Error('[communityUrlObfuscation] ❌ CRÍTICO: VITE_COMMUNITY_OBFUSCATION_KEY não configurada. Configure a variável de ambiente antes de usar em produção.');
      devLog.error(error.message);
      throw error;
    }
    return key;
  }
  
  // Gerar um token ofuscado para funcionalidades da comunidade
  static async generateCommunityToken(userId: string, action: 'followers' | 'following' | 'profile'): Promise<string> {
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
      
      // Criar um token único baseado no ID + action + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${userId}:${action}:${timestamp}:${this.getOBFUSCATION_KEY()}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente
      await this.storeToken(obfuscatedToken, userId, action);
      
      return obfuscatedToken;
    } catch (error) {
      logError('Failed to generate community token', { userId, action }, 'COMMUNITY_URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend
  static async validateCommunityToken(token: string): Promise<{userId: string, action: string} | null> {
    try {
      // ✅ SEGURANÇA: Tentar função segura primeiro
      const { data: secureData, error: secureError } = await supabase.rpc('validate_community_token_secure', {
        p_token: token
      });
      
      // Log detalhado em desenvolvimento
      if (import.meta.env.DEV) {
        devLog.log('[validateCommunityToken] Resultado da função segura:', {
          hasData: !!secureData,
          hasError: !!secureError,
          data: secureData,
          dataType: typeof secureData,
          error: secureError ? {
            message: secureError.message,
            code: secureError.code,
            details: secureError.details
          } : null
        });
      }
      
      if (secureError) {
        // Em desenvolvimento, tentar debug para diagnóstico
        if (import.meta.env.DEV) {
          try {
            const { data: debugData } = await supabase.rpc('debug_validate_community_token', {
              p_token: token
            });
            devLog.error('[validateCommunityToken] Erro na função segura, debug:', {
              secureError: secureError.message,
              debugInfo: debugData
            });
            
            // Se debug funcionou, usar o resultado dele
            if (debugData && debugData.success === true && debugData.user_id) {
              devLog.log('[validateCommunityToken] ✅ Usando resultado do debug como fallback, user_id:', debugData.user_id);
              return {
                userId: debugData.user_id,
                action: debugData.action || 'profile'
              };
            }
          } catch (debugError) {
            // Ignorar erro de debug
          }
        }
        logError('Failed to validate community token via secure RPC', { error: secureError.message }, 'COMMUNITY_URL_OBFUSCATION');
        return null;
      }
      
      // Função segura retorna JSONB com user_id e action
      if (secureData && typeof secureData === 'object' && secureData !== null) {
        const userId = secureData.user_id || secureData.userId;
        const action = secureData.action || 'profile';
        
        if (userId && typeof userId === 'string') {
          if (import.meta.env.DEV) {
            devLog.log('[validateCommunityToken] ✅ Token válido via função segura, user_id:', userId, 'action:', action);
          }
          return {
            userId: userId,
            action: action
          };
        }
      }
      
      // Se retornou null, tentar função antiga como fallback (apenas em desenvolvimento)
      if (import.meta.env.DEV && secureData === null) {
        try {
          const { data: fallbackData, error: fallbackError } = await supabase.rpc('validate_community_token', {
            p_token: token
          });
          
          if (!fallbackError && fallbackData && fallbackData.user_id) {
            devLog.warn('[validateCommunityToken] ⚠️ Função segura retornou null, mas função antiga funcionou. Usando como fallback.');
            return {
              userId: fallbackData.user_id,
              action: fallbackData.action || 'profile'
            };
          }
        } catch (fallbackError) {
          // Ignorar
        }
      }
      
      // Se retornou null, token inválido
      if (import.meta.env.DEV) {
        devLog.warn('[validateCommunityToken] Token inválido ou expirado - função segura retornou null');
      }
      return null;
    } catch (error) {
      logError('Failed to validate community token', { token: token.substring(0, 10) + '...' }, 'COMMUNITY_URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente
  private static async storeToken(token: string, userId: string, action: string): Promise<void> {
    try {
      // ✅ SEGURANÇA: Usar sessionStorage em vez de localStorage
      // sessionStorage expira quando a aba é fechada, reduzindo risco de XSS persistente
      const tokenData = {
        userId,
        action,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      sessionStorage.setItem(`community_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      logWarn('Failed to store community token', { userId, action }, 'COMMUNITY_URL_OBFUSCATION');
    }
  }
  
  // Gerar URL segura para perfil
  static async generateSecureProfileUrl(userId: string): Promise<string> {
    const token = await this.generateCommunityToken(userId, 'profile');
    return `/usuario/profile/${token}`;
  }
  
  // Gerar URL segura para seguidores
  static async generateSecureFollowersUrl(userId: string): Promise<string> {
    const token = await this.generateCommunityToken(userId, 'followers');
    return `/usuario/followers/${token}`;
  }
  
  // Gerar URL segura para seguindo
  static async generateSecureFollowingUrl(userId: string): Promise<string> {
    const token = await this.generateCommunityToken(userId, 'following');
    return `/usuario/following/${token}`;
  }
  
  // Gerar URL segura genérica
  static async generateSecureCommunityUrl(userId: string, action: 'followers' | 'following' | 'profile'): Promise<string> {
    const token = await this.generateCommunityToken(userId, action);
    return `/usuario/${action}/${token}`;
  }
}

// Hook para usar o serviço de ofuscação da comunidade
export const useSecureCommunityUrls = () => {
  const generateSecureUrl = async (userId: string, action: 'followers' | 'following' | 'profile') => {
    return await CommunityUrlObfuscationService.generateSecureCommunityUrl(userId, action);
  };
  
  const validateToken = async (token: string) => {
    return await CommunityUrlObfuscationService.validateCommunityToken(token);
  };
  
  return {
    generateSecureUrl,
    validateToken
  };
};
