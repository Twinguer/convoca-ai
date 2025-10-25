import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { UserStudyService } from './userStudyService';

// Serviço para ofuscar URLs de ciclos de estudo e controlar acesso
export class StudyCycleUrlObfuscationService {
  // SECURITY: Use environment variable for obfuscation key
  private static readonly OBFUSCATION_KEY = import.meta.env.VITE_URL_OBFUSCATION_KEY || 'fallback_key_change_in_production';
  
  
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
      const rawToken = `${cycleId}:${userId}:${timestamp}:${this.OBFUSCATION_KEY}`;
      
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
  
  // Decodificar token e validar acesso
  static async validateStudyCycleToken(token: string, userId: string): Promise<string | null> {
    try {
      // Decodificar o token
      const decodedToken = atob(token);
      const [cycleId, tokenUserId, timestamp, key] = decodedToken.split(':');
      
      // Validar a chave
      if (key !== this.OBFUSCATION_KEY) {
        throw new Error('Token inválido');
      }
      
      // Verificar se o token pertence ao usuário atual
      if (tokenUserId !== userId) {
        throw new Error('Token não autorizado para este usuário');
      }
      
      // Verificar se o token não é muito antigo (24 horas)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (tokenAge > maxAge) {
        throw new Error('Token expirado');
      }
      
      // Buscar dados do usuário usando o serviço existente
      const userStudyData = await UserStudyService.getUserStudyData(userId);
      
      if (!userStudyData || !userStudyData.study_cycles) {
        throw new Error('Dados de estudo do usuário não encontrados');
      }
      
      // Buscar o ciclo específico
      const cycle = userStudyData.study_cycles.find((c: any) => c.id === cycleId);
      
      if (!cycle) {
        throw new Error('Ciclo de estudo não encontrado');
      }
      
      // Verificar se o ciclo ainda está ativo
      if (!cycle.is_active) {
        throw new Error('Ciclo de estudo não está mais ativo');
      }
      
      return cycleId;
    } catch (error) {
      logError('Failed to validate study cycle token', { token: token.substring(0, 10) + '...', userId }, 'STUDY_CYCLE_URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente (opcional)
  private static async storeToken(token: string, cycleId: string, userId: string): Promise<void> {
    try {
      // Em um cenário real, isso seria armazenado em um banco de dados ou cache seguro
      // Para este exemplo, usaremos localStorage (apenas para demonstração)
      const tokenData = {
        cycleId,
        userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      localStorage.setItem(`study_cycle_token_${token}`, JSON.stringify(tokenData));
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

// Hook para usar o serviço de ofuscação de ciclos de estudo
export const useSecureStudyCycleUrls = () => {
  const generateSecureUrl = async (cycleId: string, userId: string, action: 'view' | 'edit' | 'session' | 'cronograma' | 'timer' | 'estatisticas' = 'view') => {
    return await StudyCycleUrlObfuscationService.generateSecureStudyCycleUrl(cycleId, userId, action);
  };
  
  const validateToken = async (token: string, userId: string) => {
    return await StudyCycleUrlObfuscationService.validateStudyCycleToken(token, userId);
  };
  
  const generateCronogramaUrl = async (cycleId: string, userId: string) => {
    return await StudyCycleUrlObfuscationService.generateSecureCronogramaUrl(cycleId, userId);
  };
  
  const generateTimerUrl = async (cycleId: string, userId: string) => {
    return await StudyCycleUrlObfuscationService.generateSecureTimerUrl(cycleId, userId);
  };
  
  const generateEstatisticasUrl = async (cycleId: string, userId: string) => {
    return await StudyCycleUrlObfuscationService.generateSecureEstatisticasUrl(cycleId, userId);
  };
  
  const generateSessaoUrl = async (cycleId: string, userId: string) => {
    return await StudyCycleUrlObfuscationService.generateSecureSessaoUrl(cycleId, userId);
  };
  
  return {
    generateSecureUrl,
    validateToken,
    generateCronogramaUrl,
    generateTimerUrl,
    generateEstatisticasUrl,
    generateSessaoUrl
  };
};
