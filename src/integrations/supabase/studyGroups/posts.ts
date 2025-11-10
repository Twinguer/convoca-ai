import { supabase } from '@/integrations/supabase/client';
import type { GroupPost, GroupComment } from '@/types/studyGroups';
import { logError, logWarn } from '@/utils/secureLogger';

/**
 * Serviço para gerenciar posts e comentários do grupo
 */
export const studyGroupPostsService = {
  /**
   * Buscar feed do grupo
   */
  async getGroupFeed(
    groupId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<GroupPost[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_group_feed', {
          p_group_id: groupId,
          p_limit: limit,
          p_offset: offset,
        });

      if (error) {
        logError('Error in get_group_feed RPC', error, 'STUDY_GROUPS');
        throw error;
      }

      // A função retorna JSONB, então precisa ser parseado se vier como string
      // ou já vem como array
      if (!data) {
        return [];
      }

      // A função RPC retorna JSONB diretamente como array
      // Supabase pode retornar como string JSON ou como array já parseado
      // Também pode retornar um objeto de erro para grupos privados
      let posts: any[] = [];
      
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          // Verificar se é um objeto de erro
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.error) {
            logWarn('Access denied to group feed', { error: parsed.error }, 'STUDY_GROUPS');
            throw new Error(parsed.error || 'Acesso negado ao conteúdo do grupo');
          }
          posts = parsed;
        } catch (e) {
          if (e instanceof Error && e.message.includes('Acesso negado')) {
            throw e;
          }
          logError('Error parsing JSON string from get_group_feed', e, 'STUDY_GROUPS');
          return [];
        }
      } else if (Array.isArray(data)) {
        posts = data;
      } else if (data && typeof data === 'object') {
        // Verificar se é um objeto de erro (grupo privado sem acesso)
        if (data.error) {
          logWarn('Access denied to group feed', { error: data.error }, 'STUDY_GROUPS');
          throw new Error(data.error || 'Acesso negado ao conteúdo do grupo');
        }
        // Se retornou como objeto sem erro, pode estar em alguma propriedade
        logWarn('Unexpected data format from get_group_feed', { dataType: typeof data }, 'STUDY_GROUPS');
        return [];
      }

      return posts as GroupPost[];
    } catch (error) {
      logError('Error fetching group feed', error, 'STUDY_GROUPS');
      return [];
    }
  },

  /**
   * Criar post no grupo
   */
  async createPost(
    groupId: string,
    content?: string,
    attachments?: Array<{ url: string; type: 'image' | 'pdf'; name: string }>
  ): Promise<GroupPost | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('add_group_post', {
          p_group_id: groupId,
          p_author_id: user.id,
          p_content: content || '',
          p_attachments: attachments ? attachments as any : null,
        });

      if (error) throw error;
      return data?.post || null;
    } catch (error) {
      logError('Error creating post', error, 'STUDY_GROUPS');
      return null;
    }
  },

  /**
   * Adicionar comentário a um post
   */
  async addComment(
    groupId: string,
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<GroupComment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .rpc('add_post_comment', {
          p_group_id: groupId,
          p_post_id: postId,
          p_author_id: user.id,
          p_content: content,
          p_parent_comment_id: parentCommentId || null,
        });

      if (error) {
        logError('Error in add_post_comment RPC', error, 'STUDY_GROUPS');
        throw error;
      }

      // A função retorna { success: true, comment: {...}, comments_count: N }
      if (data && (data as any).success) {
        return (data as any).comment || null;
      } else {
        const errorMsg = (data as any)?.error || 'Erro desconhecido ao adicionar comentário';
        logError('Error from add_post_comment', new Error(errorMsg), 'STUDY_GROUPS');
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      logError('Error adding comment', error, 'STUDY_GROUPS');
      throw error;
    }
  },

  /**
   * Limpar posts expirados
   */
  async cleanupExpiredPosts(groupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('cleanup_expired_posts', { p_group_id: groupId });

      if (error) throw error;
      return true;
    } catch (error) {
      logError('Error cleaning up expired posts', error, 'STUDY_GROUPS');
      return false;
    }
  },
};

