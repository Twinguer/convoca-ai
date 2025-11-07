import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { studyGroupMembersService } from '@/integrations/supabase/studyGroups/members';
import type { GroupMember } from '@/types/studyGroups';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar membros do grupo
 */
export const useGroupMembers = (groupId: string | undefined) => {
  const {
    data: members = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => studyGroupMembersService.getGroupMembers(groupId!),
    enabled: !!groupId,
  });

  return {
    members,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Hook para verificar se usuário é membro do grupo
 */
export const useIsGroupMember = (groupId: string | undefined) => {
  const { user } = useAuth();
  const { members, isLoading: isLoadingMembers } = useGroupMembers(groupId);
  
  // Usar query separada para verificar status completo do usuário
  const { data: userStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['user-group-status', groupId, user?.id],
    queryFn: () => studyGroupMembersService.getUserGroupStatus(groupId!, user!.id),
    enabled: !!groupId && !!user,
  });

  // A função get_group_members retorna apenas membros com status 'active'
  // Usar a função de status para verificação completa
  const userMember = members.find(m => (m.user_id === user?.id || m.id === user?.id));
  
  const isMember = userStatus?.is_member ?? (!!userMember);
  const memberRole = userMember?.role ?? userStatus?.role;
  
  return {
    isMember,
    memberRole,
    isCoach: memberRole === 'coach',
    isAdmin: memberRole === 'admin' || memberRole === 'coach',
    hasRequested: userStatus?.has_requested ?? false,
    isInvited: userStatus?.is_invited ?? false,
    isLoading: isLoadingMembers || isLoadingStatus,
  };
};

/**
 * Hook para solicitar entrada no grupo
 */
export const useRequestToJoin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (groupId: string) => {
      // VALIDAÇÃO: Verificar plano antes de solicitar entrada
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
      
      // APENAS Pro pode participar de grupos (Coach NÃO pode)
      if (!userIsPro) {
        toast({
          title: 'Grupos disponíveis apenas no plano Pro',
          description: 'Faça upgrade para Pro para participar de grupos de estudos.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/planos');
        }, 2000);
        throw new Error('Grupos de estudos estão disponíveis apenas no plano Pro.');
      }

      return studyGroupMembersService.requestToJoinGroup(groupId, user.id);
    },
    onSuccess: (result, groupId) => {
        queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
        queryClient.invalidateQueries({ queryKey: ['study-group', groupId] });
        queryClient.invalidateQueries({ queryKey: ['user-groups', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['pending-requests', groupId] });
        queryClient.invalidateQueries({ queryKey: ['user-group-status', groupId] });
      
      if (result.success) {
        toast({
          title: result.message || 'Pedido enviado!',
          description: 'Aguarde a aprovação do administrador.',
        });
      } else {
        // Verificar se o erro requer upgrade
        if (result.error?.includes('plano Pro') || result.error?.includes('Modo Coach') || result.error?.includes('upgrade') || result.requires_upgrade) {
          toast({
            title: 'Grupos disponíveis apenas no plano Pro ou Modo Coach',
            description: 'Faça upgrade para participar de grupos de estudos.',
            variant: 'destructive',
          });
          setTimeout(() => {
            navigate('/planos');
          }, 2000);
        } else {
          toast({
            title: 'Aviso',
            description: result.error || 'Não foi possível enviar o pedido.',
            variant: 'destructive',
          });
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('plano Pro') || errorMessage.includes('Modo Coach') || errorMessage.includes('upgrade')) {
        toast({
          title: 'Grupos disponíveis apenas no plano Pro ou Modo Coach',
          description: 'Faça upgrade para participar de grupos de estudos.',
          variant: 'destructive',
        });
        setTimeout(() => {
          navigate('/planos');
        }, 2000);
      } else {
        toast({
          title: 'Erro ao solicitar entrada',
          description: 'Não foi possível enviar o pedido.',
          variant: 'destructive',
        });
      }
    },
  });
};

/**
 * Hook para sair do grupo
 */
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (groupId: string) => 
      studyGroupMembersService.leaveGroup(groupId, user!.id),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['study-group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['user-groups', user?.id] });
      toast({
        title: 'Você saiu do grupo',
        description: 'Você não é mais membro deste grupo.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao sair do grupo',
        description: 'Não foi possível sair do grupo.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para buscar grupos do usuário
 */
export const useUserGroups = (userId: string | undefined) => {
  const {
    data: groups = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['user-groups', userId],
    queryFn: () => studyGroupMembersService.getUserGroups(userId!),
    enabled: !!userId,
  });

  return {
    groups,
    isLoading,
    isError,
    refetch,
  };
};

