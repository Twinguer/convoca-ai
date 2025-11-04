import { supabase } from '@/integrations/supabase/client';

interface EditTokenData {
  concursoId: string;
  timestamp: number;
  userId: string;
}

export class EditUrlObfuscationService {
  private static readonly TOKEN_PREFIX = 'edit_';
  private static readonly TOKEN_EXPIRY_HOURS = 24;

  /**
   * Gera um token seguro para edição de ranking
   */
  static async generateEditToken(concursoId: string, userId: string): Promise<string> {
    try {
      // Log removido por segurança
      
      // Verificar se o usuário tem permissão para editar este concurso
      const { data: concurso, error } = await supabase
        .from('concursos')
        .select('id, created_by_user_id')
        .eq('id', concursoId)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar concurso: ${error.message}`);
      }

      if (!concurso) {
        throw new Error('Concurso não encontrado');
      }

      // Verificar se o usuário é o criador do concurso
      if (!concurso.created_by_user_id || concurso.created_by_user_id !== userId) {
        throw new Error('Usuário não tem permissão para editar este concurso');
      }

      const tokenData: EditTokenData = {
        concursoId,
        timestamp: Date.now(),
        userId
      };

      const tokenString = JSON.stringify(tokenData);
      const encodedToken = btoa(tokenString);
      
      return `${this.TOKEN_PREFIX}${encodedToken}`;
    } catch (error) {
      console.error('Erro ao gerar token de edição:', error);
      throw new Error('Falha ao gerar token de edição');
    }
  }

  /**
   * Valida e decodifica um token de edição
   */
  static async validateEditToken(token: string, userId: string): Promise<string | null> {
    try {
      if (!token.startsWith(this.TOKEN_PREFIX)) {
        return null;
      }

      const encodedToken = token.substring(this.TOKEN_PREFIX.length);
      const tokenString = atob(encodedToken);
      const tokenData: EditTokenData = JSON.parse(tokenString);

      // Verificar se o token não expirou
      const now = Date.now();
      const tokenAge = now - tokenData.timestamp;
      const maxAge = this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000; // 24 horas em ms

      if (tokenAge > maxAge) {
        return null;
      }

      // Verificar se o usuário é o mesmo que gerou o token
      if (tokenData.userId !== userId) {
        return null;
      }

      // Verificar se o concurso ainda existe e o usuário ainda tem permissão
      const { data: concurso, error } = await supabase
        .from('concursos')
        .select('id, created_by_user_id')
        .eq('id', tokenData.concursoId)
        .single();

      if (error || !concurso || !concurso.created_by_user_id || concurso.created_by_user_id !== userId) {
        return null;
      }

      return tokenData.concursoId;
    } catch (error) {
      console.error('Erro ao validar token de edição:', error);
      return null;
    }
  }

  /**
   * Gera URL segura para edição de ranking
   */
  static async generateEditUrl(concursoId: string, userId: string): Promise<string> {
    const token = await this.generateEditToken(concursoId, userId);
    return `/criar-ranking?edit=${token}`;
  }
}

export const { generateEditToken, validateEditToken, generateEditUrl } = EditUrlObfuscationService;
