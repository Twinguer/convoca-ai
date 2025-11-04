import { supabase } from '@/integrations/supabase/client';
import type { GroupMember } from '@/types/studyGroups';

/**
 * Serviço para gerenciar membros de grupos
 * Seguindo padrão de FollowUserService
 */
export const studyGroupMembersService = {
  /**
   * Buscar membros do grupo (similar a getFollowers)
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_group_members', { p_group_id: groupId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  },

  /**
   * Verificar status do usuário no grupo
   */
  async getUserGroupStatus(groupId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_group_status', { 
          p_group_id: groupId,
          p_user_id: userId 
        });

      if (error) throw error;
      return (data && data.length > 0) ? data[0] : {
        is_member: false,
        role: null,
        status: null,
        has_requested: false,
        is_invited: false,
      };
    } catch (error) {
      console.error('Error fetching user group status:', error);
      return {
        is_member: false,
        role: null,
        status: null,
        has_requested: false,
        is_invited: false,
      };
    }
  },

  /**
   * Contar membros do grupo (similar a count_user_followers)
   */
  async countGroupMembers(groupId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('count_group_members', { p_group_id: groupId });

      if (error) {
        console.error('Error counting group members:', error);
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.error('Error counting group members:', error);
      return 0;
    }
  },

  /**
   * Buscar grupos do usuário (similar a getFollowing)
   */
  async getUserGroups(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_groups', { p_user_id: userId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }
  },

  /**
   * Solicitar entrada no grupo
   */
  async requestToJoinGroup(groupId: string, userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('request_to_join_group', {
        p_group_id: groupId,
        p_user_id: userId,
      });

      if (error) throw error;
      return data as { success: boolean; message?: string; error?: string };
    } catch (error: any) {
      console.error('Error requesting to join group:', error);
      return { success: false, error: error.message || 'Erro ao solicitar entrada' };
    }
  },

  /**
   * Convidar usuário para o grupo (apenas admins)
   */
  async inviteUserToGroup(groupId: string, userId: string, inviterId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('invite_user_to_group', {
        p_group_id: groupId,
        p_user_id: userId,
        p_inviter_id: inviterId,
      });

      if (error) throw error;
      return data as { success: boolean; message?: string; error?: string };
    } catch (error: any) {
      console.error('Error inviting user:', error);
      return { success: false, error: error.message || 'Erro ao convidar usuário' };
    }
  },

  /**
   * Aceitar/rejeitar pedido de entrada (apenas admins)
   */
  async respondToJoinRequest(
    memberId: string,
    groupId: string,
    adminId: string,
    accept: boolean
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('respond_to_join_request', {
        p_member_id: memberId,
        p_group_id: groupId,
        p_admin_id: adminId,
        p_accept: accept,
      });

      if (error) throw error;
      return data as { success: boolean; message?: string; error?: string };
    } catch (error: any) {
      console.error('Error responding to request:', error);
      return { success: false, error: error.message || 'Erro ao processar pedido' };
    }
  },

  /**
   * Buscar pedidos pendentes do grupo
   */
  async getPendingRequests(groupId: string) {
    try {
      const { data, error } = await supabase.rpc('get_group_pending_requests', {
        p_group_id: groupId,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  },

  /**
   * Sair do grupo (similar a unfollowUser)
   */
  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('study_group_members')
        .update({ status: 'left' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  },
};

