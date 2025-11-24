import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de administração e controlar acesso
export class AdminUrlObfuscationService {
  // ✅ SEGURANÇA: Verificar variável de ambiente apenas quando necessário (lazy check)
  private static getOBFUSCATION_KEY(): string {
    const key = import.meta.env.VITE_ADMIN_OBFUSCATION_KEY;
    if (!key) {
      // Em desenvolvimento, usar fallback temporário (NÃO SEGURO PARA PRODUÇÃO)
      if (import.meta.env.DEV) {
        devLog.warn('[adminUrlObfuscation] ⚠️ VITE_ADMIN_OBFUSCATION_KEY não configurada. Usando fallback temporário apenas para desenvolvimento. Configure a variável antes de produção.');
        return 'dev_admin_fallback_key_not_secure_change_in_production';
      }
      // Em produção, lançar erro crítico
      const error = new Error('[adminUrlObfuscation] ❌ CRÍTICO: VITE_ADMIN_OBFUSCATION_KEY não configurada. Configure a variável de ambiente antes de usar em produção.');
      devLog.error(error.message);
      throw error;
    }
    return key;
  }
  
  // Gerar um token ofuscado para administração
  static async generateAdminToken(adminId: string, resource: 'dashboard' | 'concursos' | 'usuarios' | 'vouchers'): Promise<string> {
    try {
      // Verificar se o usuário é admin
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id, is_admin')
        .eq('id', adminId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de administrador não encontrado');
      }
      
      if (!userProfile.is_admin) {
        throw new Error('Usuário não tem permissões de administrador');
      }
      
      // Criar um token único baseado no ID + resource + timestamp + chave
      const timestamp = Date.now().toString();
      const rawToken = `${adminId}:${resource}:${timestamp}:${this.getOBFUSCATION_KEY()}`;
      
      // Usar btoa para codificar (não é criptografia real, mas ofusca)
      const obfuscatedToken = btoa(rawToken);
      
      // Armazenar o token temporariamente
      await this.storeToken(obfuscatedToken, adminId, resource);
      
      return obfuscatedToken;
    } catch (error) {
      logError('Failed to generate admin token', { adminId, resource }, 'ADMIN_URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend
  static async validateAdminToken(token: string): Promise<{adminId: string, resource: string} | null> {
    try {
      // Chamar RPC no backend para validar token
      const { data, error } = await supabase.rpc('validate_admin_token', {
        p_token: token
      });
      
      if (error) {
        logError('Failed to validate admin token via RPC', { error: error.message }, 'ADMIN_URL_OBFUSCATION');
        return null;
      }
      
      // RPC retorna JSONB com admin_id e resource se válido, NULL se inválido
      if (!data) {
        return null;
      }
      
      return {
        adminId: data.admin_id,
        resource: data.resource
      };
    } catch (error) {
      logError('Failed to validate admin token', { token: token.substring(0, 10) + '...' }, 'ADMIN_URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente
  private static async storeToken(token: string, adminId: string, resource: string): Promise<void> {
    try {
      // ✅ SEGURANÇA: Usar sessionStorage em vez de localStorage
      // sessionStorage expira quando a aba é fechada, reduzindo risco de XSS persistente
      const tokenData = {
        adminId,
        resource,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      sessionStorage.setItem(`admin_token_${token}`, JSON.stringify(tokenData));
    } catch (error) {
      // Falha silenciosa - não é crítico
      logWarn('Failed to store admin token', { adminId, resource }, 'ADMIN_URL_OBFUSCATION');
    }
  }
  
  // Gerar URL segura para administração
  static async generateSecureAdminUrl(adminId: string, resource: string): Promise<string> {
    const token = await this.generateAdminToken(adminId, resource as any);
    return `/project/admin/man/${resource}/${token}`;
  }
  
  // Gerar URL segura para dashboard
  static async generateSecureDashboardUrl(adminId: string): Promise<string> {
    return this.generateSecureAdminUrl(adminId, 'dashboard');
  }
  
  // Gerar URL segura para concursos
  static async generateSecureConcursosUrl(adminId: string): Promise<string> {
    return this.generateSecureAdminUrl(adminId, 'concursos');
  }
  
  // Gerar URL segura para usuários
  static async generateSecureUsuariosUrl(adminId: string): Promise<string> {
    return this.generateSecureAdminUrl(adminId, 'usuarios');
  }
  
  // Gerar URL segura para vouchers
  static async generateSecureVouchersUrl(adminId: string): Promise<string> {
    return this.generateSecureAdminUrl(adminId, 'vouchers');
  }
}

// Hook para usar o serviço de ofuscação de admin
export const useSecureAdminUrls = () => {
  const generateSecureUrl = async (adminId: string, resource: 'dashboard' | 'concursos' | 'usuarios' | 'vouchers') => {
    return await AdminUrlObfuscationService.generateSecureAdminUrl(adminId, resource);
  };
  
  const validateToken = async (token: string) => {
    return await AdminUrlObfuscationService.validateAdminToken(token);
  };
  
  return {
    generateSecureUrl,
    validateToken
  };
};
