import { supabase } from '@/integrations/supabase/client';
import { logError, logWarn } from '@/utils/secureLogger';

// Serviço para ofuscar URLs de administração e controlar acesso
export class AdminUrlObfuscationService {
  // SECURITY: Use environment variable for obfuscation key
  // ✅ SEGURANÇA: Removido fallback inseguro - variável de ambiente é obrigatória
  private static readonly OBFUSCATION_KEY = (() => {
    const key = import.meta.env.VITE_ADMIN_OBFUSCATION_KEY;
    if (!key) {
      console.error('[adminUrlObfuscation] ❌ VITE_ADMIN_OBFUSCATION_KEY não configurada!');
      throw new Error('VITE_ADMIN_OBFUSCATION_KEY environment variable is required');
    }
    return key;
  })();
  
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
      const rawToken = `${adminId}:${resource}:${timestamp}:${this.OBFUSCATION_KEY}`;
      
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
  
  // Decodificar token e validar acesso
  static async validateAdminToken(token: string): Promise<{adminId: string, resource: string} | null> {
    try {
      // Decodificar o token
      const decodedToken = atob(token);
      const [adminId, resource, timestamp, key] = decodedToken.split(':');
      
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
      
      // Verificar se o usuário ainda é admin
      const { data: userProfile, error } = await supabase
        .from('users_profiles')
        .select('id, is_admin')
        .eq('id', adminId)
        .single();
      
      if (error || !userProfile) {
        throw new Error('Perfil de administrador não encontrado');
      }
      
      if (!userProfile.is_admin) {
        throw new Error('Usuário não tem mais permissões de administrador');
      }
      
      return { adminId, resource };
    } catch (error) {
      logError('Failed to validate admin token', { token: token.substring(0, 10) + '...' }, 'ADMIN_URL_OBFUSCATION');
      return null;
    }
  }
  
  // Armazenar token temporariamente
  private static async storeToken(token: string, adminId: string, resource: string): Promise<void> {
    try {
      // Armazenar no localStorage com expiração
      const tokenData = {
        adminId,
        resource,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
      };
      
      localStorage.setItem(`admin_token_${token}`, JSON.stringify(tokenData));
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
