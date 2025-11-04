import { supabase } from '@/integrations/supabase/client';
import type { CoachProfile, StudentRelationship } from '@/types/coach';

/**
 * Serviço para gerenciar relacionamentos coach-aluno
 */

export const coachRelationshipService = {
  /**
   * Buscar perfil completo do coach
   */
  async getCoachProfile(coachId: string): Promise<CoachProfile | null> {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Buscar apenas estudantes
   */
  async getStudents(coachId: string): Promise<StudentRelationship[]> {
    const profile = await this.getCoachProfile(coachId);
    return profile?.student_relationships || [];
  },

  /**
   * Adicionar aluno ao coach
   */
  async addStudent(
    coachId: string,
    studentId: string,
    consentData: any
  ): Promise<StudentRelationship> {
    const { data, error } = await supabase.rpc('add_student_to_coach', {
      p_coach_id: coachId,
      p_student_id: studentId,
      p_consent_data: consentData
    });

    if (error) throw error;
    return data;
  },

  /**
   * Remover aluno do coach
   */
  async removeStudent(coachId: string, studentId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_student_from_coach', {
      p_coach_id: coachId,
      p_student_id: studentId
    });

    if (error) throw error;
  },

  /**
   * Buscar dados agregados de um aluno específico
   */
  async getStudentData(coachId: string, studentId: string): Promise<StudentRelationship | null> {
    const students = await this.getStudents(coachId);
    return students.find(s => s.student_id === studentId) || null;
  }
};


