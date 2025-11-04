import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupService } from '@/integrations/supabase/studyGroups/groups';
import type { StudyGroup, CreateGroupInput } from '@/types/studyGroups';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para buscar grupos públicos
 */
export const useStudyGroups = (searchQuery: string = '') => {
  const {
    data: groups = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['study-groups', searchQuery],
    queryFn: async () => {
      const allGroups = await studyGroupService.getPublicGroups(100);
      
      // Filtrar por busca se houver
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return allGroups.filter(group => 
          group.name.toLowerCase().includes(query) ||
          group.description?.toLowerCase().includes(query) ||
          group.focus_area?.toLowerCase().includes(query)
        );
      }
      
      return allGroups;
    },
  });

  return {
    groups,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Hook para buscar um grupo específico
 */
export const useStudyGroup = (groupId: string | undefined) => {
  const {
    data: group,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['study-group', groupId],
    queryFn: () => studyGroupService.getGroup(groupId!),
    enabled: !!groupId,
  });

  return {
    group,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Hook para criar grupo
 */
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => studyGroupService.createGroup(input),
    onSuccess: (data) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-members', data.id] });
      toast({
        title: 'Grupo criado!',
        description: 'Seu grupo foi criado com sucesso.',
      });
      return data;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar grupo',
        description: error.message || 'Não foi possível criar o grupo.',
        variant: 'destructive',
      });
    },
  });
};

