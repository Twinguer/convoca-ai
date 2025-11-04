import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupMembersService } from '@/integrations/supabase/studyGroups/members';
import type { GroupMember } from '@/types/studyGroups';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

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

  return useMutation({
    mutationFn: (groupId: string) => 
      studyGroupMembersService.requestToJoinGroup(groupId, user!.id),
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
        toast({
          title: 'Aviso',
          description: result.error || 'Não foi possível enviar o pedido.',
          variant: 'destructive',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Erro ao solicitar entrada',
        description: 'Não foi possível enviar o pedido.',
        variant: 'destructive',
      });
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

