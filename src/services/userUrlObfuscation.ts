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
  
  // ✅ SEGURANÇA: Validar token via RPC no backend
  static async validateUserToken(token: string): Promise<string | null> {
    try {
      // ✅ SEGURANÇA: Tentar função segura primeiro
      const { data: secureData, error: secureError } = await supabase.rpc('validate_user_token_secure', {
        p_token: token
      });
      
      // Log detalhado em desenvolvimento
      if (import.meta.env.DEV) {
        devLog.log('[validateUserToken] Resultado da função segura:', {
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
            const { data: debugData } = await supabase.rpc('debug_validate_user_token', {
              p_token: token
            });
            devLog.error('[validateUserToken] Erro na função segura, debug:', {
              secureError: secureError.message,
              debugInfo: debugData
            });
            
            // Se debug funcionou, usar o resultado dele
            if (debugData && debugData.success === true && debugData.user_id) {
              devLog.log('[validateUserToken] ✅ Usando resultado do debug como fallback, user_id:', debugData.user_id);
              return debugData.user_id;
            }
          } catch (debugError) {
            // Ignorar erro de debug
          }
        }
        logError('Failed to validate user token via secure RPC', { error: secureError.message }, 'URL_OBFUSCATION');
        return null;
      }
      
      // Função segura retorna TEXT diretamente
      if (secureData && typeof secureData === 'string' && secureData.trim() !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(secureData.trim())) {
          if (import.meta.env.DEV) {
            devLog.log('[validateUserToken] ✅ Token válido via função segura, user_id:', secureData);
          }
          return secureData.trim();
        }
      }
      
      // Se retornou null, tentar debug como fallback em desenvolvimento
      if (import.meta.env.DEV && secureData === null) {
        try {
          const { data: debugData } = await supabase.rpc('debug_validate_user_token', {
            p_token: token
          });
          
          if (debugData && debugData.success === true && debugData.user_id) {
            devLog.warn('[validateUserToken] ⚠️ Função segura retornou null, mas debug funcionou. Usando debug como fallback.');
            return debugData.user_id;
          }
        } catch (debugError) {
          // Ignorar
        }
      }
      
      // Se retornou null, token inválido
      if (import.meta.env.DEV) {
        devLog.warn('[validateUserToken] Token inválido ou expirado - função segura retornou null');
      }
      return null;
    } catch (error) {
      logError('Failed to validate user token', { token: token.substring(0, 10) + '...' }, 'URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, userId: string): Promise<void> {
    try {
      // ✅ SEGURANÇA: Usar sessionStorage em vez de localStorage
      // sessionStorage expira quando a aba é fechada, reduzindo risco de XSS persistente
      const tokenData = {
        userId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      sessionStorage.setItem(`user_token_${token}`, JSON.stringify(tokenData));
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
