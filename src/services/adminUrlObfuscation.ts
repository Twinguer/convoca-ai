import { supabase } from '@/integrations/supabase/client';
import { adminResourcePath, type AdminResource } from '@/config/adminRoutes';
import { logError, logWarn } from '@/utils/secureLogger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

// Serviço para ofuscar URLs de administração e controlar acesso
export class AdminUrlObfuscationService {
  // ✅ REMOVIDO: getOBFUSCATION_KEY() - chaves não devem ser expostas no frontend
  // Tokens agora são gerados apenas via RPC no backend
  
  // ✅ SEGURANÇA: Gerar token via RPC no backend (sem expor chaves no frontend)
  static async generateAdminToken(adminId: string, resource: AdminResource): Promise<string> {
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
      
      // ✅ Gerar token seguro via RPC no backend
      const { data: token, error: tokenError } = await supabase.rpc('generate_secure_token', {
        p_entity_id: adminId,
        p_entity_type: 'admin',
        p_metadata: { resource },
        p_expires_in_minutes: 1440 // 24 horas
      });
      
      if (tokenError || !token) {
        logError('Failed to generate secure token via RPC', { error: tokenError, adminId, resource }, 'ADMIN_URL_OBFUSCATION');
        throw new Error('Falha ao gerar token seguro');
      }
      
      return token;
    } catch (error) {
      logError('Failed to generate admin token', { adminId, resource }, 'ADMIN_URL_OBFUSCATION');
      throw error;
    }
  }
  
  // ✅ SEGURANÇA: Validar token via RPC no backend (sem expor chaves no frontend)
  static async validateAdminToken(token: string): Promise<{adminId: string, resource: string} | null> {
    try {
      // ✅ Usar função segura de resolução de token
      const { data, error } = await supabase.rpc('resolve_secure_token', {
        p_token: token,
        p_entity_type: 'admin',
        p_consume: false
      });
      
      if (error) {
        logError('Failed to resolve secure token via RPC', { error: error.message, token: token?.substring(0, 10) }, 'ADMIN_URL_OBFUSCATION');
        return null;
      }
      
      // A função retorna uma tabela, então data é um array
      const resolved = Array.isArray(data) ? data[0] : data;
      
      if (resolved && resolved.entity_id) {
        return {
          adminId: resolved.entity_id,
          resource: resolved.metadata?.resource || 'dashboard'
        };
      }
      
      return null;
    } catch (error) {
      logError('Failed to validate admin token', { token: token?.substring(0, 10) + '...' }, 'ADMIN_URL_OBFUSCATION');
      return null;
    }
  }
  
  // ✅ REMOVIDO: storeToken() - tokens agora são armazenados apenas no banco via RPC
  
  // Gerar URL segura para administração
  static async generateSecureAdminUrl(adminId: string, resource: AdminResource): Promise<string> {
    const token = await this.generateAdminToken(adminId, resource);
    return adminResourcePath(resource, token);
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
  const generateSecureUrl = async (adminId: string, resource: AdminResource) => {
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
