import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studyGroupService } from '@/integrations/supabase/studyGroups/groups';
import type { StudyGroup, CreateGroupInput } from '@/types/studyGroups';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      // VALIDAÇÃO: Verificar plano antes de criar grupo
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar subscription diretamente (APENAS Pro)
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan, is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const userIsPro = subscription?.plan === 'pro' && subscription?.is_active === true;
      
      // APENAS Pro pode criar grupos (Coach NÃO pode)
      if (!userIsPro) {
        toast({
          title: 'Grupos disponíveis apenas no plano Pro',
          description: 'Faça upgrade para Pro para criar grupos de estudos.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/planos');
        }, 2000);
        throw new Error('Grupos de estudos estão disponíveis apenas no plano Pro.');
      }

      return studyGroupService.createGroup(input);
    },
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
      const errorMessage = error?.message || '';
      if (errorMessage.includes('plano Pro') || errorMessage.includes('Modo Coach') || errorMessage.includes('upgrade')) {
        toast({
          title: 'Grupos disponíveis apenas no plano Pro ou Modo Coach',
          description: 'Faça upgrade para criar grupos de estudos.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/planos');
        }, 2000);
      } else {
        toast({
          title: 'Erro ao criar grupo',
          description: error.message || 'Não foi possível criar o grupo.',
          variant: 'destructive',
        });
      }
    },
  });
};

