import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupPostsService } from '@/integrations/supabase/studyGroups/posts';
import type { GroupPost, GroupComment } from '@/types/studyGroups';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/utils/secureLogger';

/**
 * Hook para buscar feed do grupo
 */
export const useGroupFeed = (groupId: string | undefined, limit: number = 20) => {
  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['group-feed', groupId],
    queryFn: () => studyGroupPostsService.getGroupFeed(groupId!, limit, 0),
    enabled: !!groupId,
    retry: 1,
  });

  // Log de erro usando secureLogger
  if (isError && error) {
    logError('Error in useGroupFeed', error, 'STUDY_GROUPS');
  }

  return {
    posts,
    isLoading,
    isError,
    error,
    refetch,
  };
};

/**
 * Hook para criar post no grupo
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      groupId, 
      content, 
      attachments 
    }: { 
      groupId: string; 
      content?: string;
      attachments?: Array<{ url: string; type: 'image' | 'pdf'; name: string }>;
    }) =>
      studyGroupPostsService.createPost(groupId, content, attachments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-feed', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['study-group', variables.groupId] });
      toast({
        title: 'Post criado!',
        description: 'Seu post foi publicado no grupo.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao criar post',
        description: 'Não foi possível criar o post.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para adicionar comentário
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      groupId, 
      postId, 
      content, 
      parentCommentId 
    }: { 
      groupId: string; 
      postId: string; 
      content: string; 
      parentCommentId?: string 
    }) =>
      studyGroupPostsService.addComment(groupId, postId, content, parentCommentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-feed', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['study-group', variables.groupId] });
    },
    onError: () => {
      toast({
        title: 'Erro ao comentar',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    },
  });
};

