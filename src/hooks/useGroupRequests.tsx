import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyGroupMembersService } from '@/integrations/supabase/studyGroups/members';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

/**
 * Hook para buscar pedidos pendentes
 */
export const usePendingRequests = (groupId: string | undefined) => {
  const {
    data: requests = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['pending-requests', groupId],
    queryFn: () => studyGroupMembersService.getPendingRequests(groupId!),
    enabled: !!groupId,
  });

  return {
    requests,
    isLoading,
    isError,
    refetch,
  };
};

/**
 * Hook para responder a pedidos (aceitar/rejeitar)
 */
export const useRespondToRequest = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      memberId, 
      groupId, 
      accept 
    }: { 
      memberId: string; 
      groupId: string; 
      accept: boolean 
    }) =>
      studyGroupMembersService.respondToJoinRequest(memberId, groupId, user!.id, accept),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['study-group', variables.groupId] });
      
      toast({
        title: result.success ? 'Sucesso!' : 'Erro',
        description: result.message || result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o pedido.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook para convidar usuário
 */
export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      studyGroupMembersService.inviteUserToGroup(groupId, userId, user!.id),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['study-group', variables.groupId] });
      
      toast({
        title: result.success ? 'Convite enviado!' : 'Erro',
        description: result.message || result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o convite.',
        variant: 'destructive',
      });
    },
  });
};

