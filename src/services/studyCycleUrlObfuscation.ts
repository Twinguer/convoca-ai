import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { UserStudyService } from './userStudyService';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de ciclos de estudo e controlar acesso
export class StudyCycleUrlObfuscationService {
  // ✅ REMOVIDO: getOBFUSCATION_KEY() - chaves não devem ser expostas no frontend
  // Tokens agora são gerados apenas via RPC no backend
  
  // ✅ SEGURANÇA: Gerar token via RPC no backend (sem expor chaves no frontend)
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
      
      // ✅ Gerar token seguro via RPC no backend
      const { data: token, error: tokenError } = await supabase.rpc('generate_secure_token', {
        p_entity_id: cycleId,
        p_entity_type: 'study_cycle',
        p_metadata: { userId },
        p_expires_in_minutes: 1440 // 24 horas
      });
      
      if (tokenError || !token) {
        logError('Failed to generate secure token via RPC', { error: tokenError, cycleId, userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
        throw new Error('Falha ao gerar token seguro');
      }
      
      return token;
    } catch (error) {
      logError('Failed to generate study cycle token', { cycleId, userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend (sem expor chaves no frontend)
  static async validateStudyCycleToken(token: string, userId: string): Promise<string | null> {
    try {
      // ✅ Usar função segura de resolução de token
      const { data, error } = await supabase.rpc('resolve_secure_token', {
        p_token: token,
        p_entity_type: 'study_cycle',
        p_consume: false
      });
      
      if (error) {
        logError('Failed to resolve secure token via RPC', { error: error.message, token: token?.substring(0, 10) }, 'STUDY_CYCLE_URL_OBFUSCATION');
        return null;
      }
      
      // A função retorna uma tabela, então data é um array
      const resolved = Array.isArray(data) ? data[0] : data;
      
      // Verificar se o token pertence ao usuário
      if (resolved && resolved.entity_id && resolved.metadata?.userId === userId) {
        return resolved.entity_id;
      }
      
      return null;
    } catch (error) {
      logError('Failed to validate study cycle token', { token: token?.substring(0, 10) + '...', userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      return null;
    }
  }
  
  // ✅ REMOVIDO: storeToken() - tokens agora são armazenados apenas no banco via RPC
  
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
