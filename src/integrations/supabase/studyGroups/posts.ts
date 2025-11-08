import { supabase } from '@/integrations/supabase/client';
import type { GroupPost, GroupComment } from '@/types/studyGroups';

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
        console.error('Error in get_group_feed RPC:', error);
        throw error;
      }

      // A função retorna JSONB, então precisa ser parseado se vier como string
      // ou já vem como array
      if (!data) {
        console.log('No data returned from get_group_feed');
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
            console.warn('Access denied to group feed:', parsed.error);
            throw new Error(parsed.error || 'Acesso negado ao conteúdo do grupo');
          }
          posts = parsed;
        } catch (e) {
          if (e instanceof Error && e.message.includes('Acesso negado')) {
            throw e;
          }
          console.error('Error parsing JSON string:', e);
          return [];
        }
      } else if (Array.isArray(data)) {
        posts = data;
      } else if (data && typeof data === 'object') {
        // Verificar se é um objeto de erro (grupo privado sem acesso)
        if (data.error) {
          console.warn('Access denied to group feed:', data.error);
          throw new Error(data.error || 'Acesso negado ao conteúdo do grupo');
        }
        // Se retornou como objeto sem erro, pode estar em alguma propriedade
        console.warn('Unexpected data format from get_group_feed:', data);
        return [];
      }

      // Log detalhado dos posts e comentários
      console.log(`Found ${posts.length} posts in feed`);
      posts.forEach((post, idx) => {
        console.log(`Post ${idx + 1}:`, {
          id: post.id,
          content: post.content?.substring(0, 50),
          commentsCount: post.comments_count,
          commentsArrayLength: Array.isArray(post.comments) ? post.comments.length : 0,
          comments: post.comments,
        });
      });

      return posts as GroupPost[];
    } catch (error) {
      console.error('Error fetching group feed:', error);
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
      console.error('Error creating post:', error);
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
        console.error('Error in add_post_comment RPC:', error);
        throw error;
      }

      // A função retorna { success: true, comment: {...}, comments_count: N }
      if (data && (data as any).success) {
        console.log('Comment added successfully:', (data as any).comment);
        return (data as any).comment || null;
      } else {
        const errorMsg = (data as any)?.error || 'Erro desconhecido ao adicionar comentário';
        console.error('Error from add_post_comment:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
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
      console.error('Error cleaning up expired posts:', error);
      return false;
    }
  },
};

