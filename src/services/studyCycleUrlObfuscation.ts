import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { UserStudyService } from './userStudyService';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de ciclos de estudo e controlar acesso
export class StudyCycleUrlObfuscationService {
  // ✅ SEGURANÇA: Verificar variável de ambiente apenas quando necessário (lazy check)
  private static getOBFUSCATION_KEY(): string {
    const key = import.meta.env.VITE_URL_OBFUSCATION_KEY;
    if (!key) {
      // Em desenvolvimento, usar fallback temporário (NÃO SEGURO PARA PRODUÇÃO)
      if (import.meta.env.DEV) {
        devLog.warn('[studyCycleUrlObfuscation] ⚠️ VITE_URL_OBFUSCATION_KEY não configurada. Usando fallback temporário apenas para desenvolvimento. Configure a variável antes de produção.');
        return 'dev_study_cycle_fallback_key_not_secure_change_in_production';
      }
      // Em produção, lançar erro crítico
      const error = new Error('[studyCycleUrlObfuscation] ❌ CRÍTICO: VITE_URL_OBFUSCATION_KEY não configurada. Configure a variável de ambiente antes de usar em produção.');
      devLog.error(error.message);
      throw error;
    }
    return key;
  }
  
  
  // Gerar um token ofuscado para um ciclo de estudo
  static async generateStudyCycleToken(cycleId: string, userId: string): Promise<string> {
    try {
      // Buscar dados do usuário usando o serviço existente
      const userStudyData = await UserStudyService.getUserStudyData(userId);
      
      if (!userStudyData || !userStudyData.study_cycles) {
        throw new Error('Dados de estudo do usuário não encontrados');
      }
      
      // Buscar o ciclo específico
      const cycle = userStudyData.study_cycles.find((c: any) => c.id === cycleId);
      
      if (!cycle) {
        throw new Error('Ciclo de estudo não encontrado ou não autorizado');
      }
      
      // Verificar se o ciclo está ativo
      if (!cycle.is_active) {
        throw new Error('Ciclo de estudo não está mais ativo');
      }
      
      // Criar um token único baseado no ID + userId + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${cycleId}:${userId}:${timestamp}:${this.getOBFUSCATION_KEY()}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente (opcional - para validação adicional)
      await this.storeToken(obfuscatedToken, cycleId, userId);
      
      return obfuscatedToken;
    } catch (error) {
      logError('Failed to generate study cycle token', { cycleId, userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend
  static async validateStudyCycleToken(token: string, userId: string): Promise<string | null> {
    try {
      // ✅ SEGURANÇA: Tentar função segura primeiro
      const { data: secureData, error: secureError } = await supabase.rpc('validate_study_cycle_token_secure', {
        p_token: token,
        p_user_id: userId
      });
      
      // Log detalhado em desenvolvimento
      if (import.meta.env.DEV) {
        devLog.log('[validateStudyCycleToken] Resultado da função segura:', {
          hasData: !!secureData,
          hasError: !!secureError,
          data: secureData,
          dataType: typeof secureData,
          error: secureError ? {
            message: secureError.message,
            code: secureError.code
          } : null
        });
      }
      
      if (secureError) {
        // Em desenvolvimento, tentar debug para diagnóstico
        if (import.meta.env.DEV) {
          try {
            const { data: debugData } = await supabase.rpc('debug_validate_study_cycle_token', {
              p_token: token,
              p_user_id: userId
            });
            devLog.error('[validateStudyCycleToken] Erro na função segura, debug:', {
              secureError: secureError.message,
              debugInfo: debugData
            });
            
            // Se debug funcionou, usar o resultado dele
            if (debugData && debugData.success === true && debugData.valid_cycle_id) {
              devLog.log('[validateStudyCycleToken] ✅ Usando resultado do debug como fallback, cycle_id:', debugData.valid_cycle_id);
              return debugData.valid_cycle_id;
            }
          } catch (debugError) {
            // Ignorar erro de debug
          }
        }
        logError('Failed to validate study cycle token via secure RPC', { error: secureError.message }, 'STUDY_CYCLE_URL_OBFUSCATION');
        return null;
      }
      
      // Função segura retorna TEXT diretamente
      if (secureData && typeof secureData === 'string' && secureData.trim() !== '') {
        if (import.meta.env.DEV) {
          devLog.log('[validateStudyCycleToken] ✅ Token válido via função segura, cycle_id:', secureData);
        }
        return secureData.trim();
      }
      
      // Se retornou null, tentar debug como fallback em desenvolvimento
      if (import.meta.env.DEV && secureData === null) {
        try {
          const { data: debugData } = await supabase.rpc('debug_validate_study_cycle_token', {
            p_token: token,
            p_user_id: userId
          });
          
          if (debugData && debugData.success === true && debugData.valid_cycle_id) {
            devLog.warn('[validateStudyCycleToken] ⚠️ Função segura retornou null, mas debug funcionou. Usando debug como fallback.');
            return debugData.valid_cycle_id;
          }
        } catch (debugError) {
          // Ignorar
        }
      }
      
      // Se retornou null, token inválido
      if (import.meta.env.DEV) {
        devLog.warn('[validateStudyCycleToken] Token inválido ou expirado - função segura retornou null');
      }
      return null;
    } catch (error) {
      devLog.error('[validateStudyCycleToken] Erro geral:', error);
      logError('Failed to validate study cycle token', { token: token.substring(0, 10) + '...', userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, cycleId: string, userId: string): Promise<void> {
    try {
      // Em um cenário real, isso seria armazenado em um banco de dados ou cache seguro
      // ✅ SEGURANÇA: Usar sessionStorage em vez de localStorage
      // sessionStorage expira quando a aba é fechada, reduzindo risco de XSS persistente
      const tokenData = {
        cycleId,
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      sessionStorage.setItem(`study_cycle_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      logWarn('Failed to store study cycle token', { cycleId, userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
    }
  }
  
  // Gerar URL segura para ciclo de estudo
  static async generateSecureStudyCycleUrl(cycleId: string, userId: string, action: 'view' | 'edit' | 'session' | 'cronograma' | 'timer' | 'estatisticas' = 'view'): Promise<string> {
    try {
      const token = await this.generateStudyCycleToken(cycleId, userId);
      const secureUrl = `/estudos/${action}/${token}`;
      return secureUrl;
    } catch (error) {
      logError('Failed to generate secure study cycle URL', { cycleId, userId, action }, 'STUDY_CYCLE_URL_OBFUSCATION');
      return `/error?message=Failed to generate secure URL`;
    }
  }
  
  // Gerar URL segura para cronograma
  static async generateSecureCronogramaUrl(cycleId: string, userId: string): Promise<string> {
    return this.generateSecureStudyCycleUrl(cycleId, userId, 'cronograma');
  }
  
  // Gerar URL segura para timer
  static async generateSecureTimerUrl(cycleId: string, userId: string): Promise<string> {
    return this.generateSecureStudyCycleUrl(cycleId, userId, 'timer');
  }
  
  // Gerar URL segura para estatísticas
  static async generateSecureEstatisticasUrl(cycleId: string, userId: string): Promise<string> {
    return this.generateSecureStudyCycleUrl(cycleId, userId, 'estatisticas');
  }
  
  // Gerar URL segura para sessão de estudo
  static async generateSecureSessaoUrl(cycleId: string, userId: string): Promise<string> {
    return this.generateSecureStudyCycleUrl(cycleId, userId, 'session');
  }
  
  // Validar URL segura e retornar ID do ciclo
  static async validateSecureStudyCycleUrl(token: string, userId: string): Promise<string | null> {
    try {
      return await this.validateStudyCycleToken(token, userId);
    } catch (error) {
      logError('Failed to validate secure study cycle URL', { token: token.substring(0, 10) + '...', userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      return null;
    }
  }
}
