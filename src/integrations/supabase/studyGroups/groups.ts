import { supabase } from '@/integrations/supabase/client';
import type { StudyGroup, CreateGroupInput, UpdateGroupInput } from '@/types/studyGroups';
import { logError } from '@/utils/secureLogger';

/**
 * Serviço para gerenciar grupos de estudos
 * Seguindo padrão de coachRelationshipService
 */
export const studyGroupService = {
  /**
   * Buscar grupo por ID
   */
  async getGroup(groupId: string): Promise<StudyGroup | null> {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Criar grupo
   */
  async createGroup(input: CreateGroupInput): Promise<StudyGroup> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Criar o grupo
    const { data, error } = await supabase
      .from('study_groups')
      .insert({
        ...input,
        created_by: user.id,
        privacy_level: input.privacy_level || 'public',
        max_members: input.max_members || 50,
        post_retention_days: input.post_retention_days || 90,
        posts_data: [],
        group_settings: {},
      })
      .select()
      .single();

    if (error) throw error;

    // Adicionar o criador como admin do grupo
    const { error: memberError } = await supabase
      .from('study_group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
      });

    if (memberError) {
      logError('Erro ao adicionar criador como membro', memberError, 'STUDY_GROUPS');
      // Não falha a criação do grupo, apenas loga o erro
    }

    return data;
  },

  /**
   * Atualizar grupo
   */
  async updateGroup(groupId: string, input: UpdateGroupInput): Promise<StudyGroup> {
    const { data, error } = await supabase
      .from('study_groups')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar grupos públicos
   */
  async getPublicGroups(limit: number = 20): Promise<StudyGroup[]> {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .eq('privacy_level', 'public')
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

