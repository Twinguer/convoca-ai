
import { supabase } from '@/integrations/supabase/client';
import type { QuestionBlock } from '@/types/question-blocks';

export const createQuestionBlocks = async (
  concursoId: string, 
  blocks: QuestionBlock[]
): Promise<{ success: boolean; blocks?: QuestionBlock[]; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('manage_question_blocks', {
      p_operation: 'CREATE',
      p_concurso_id: concursoId,
      p_blocks: blocks
    });

    if (error) throw error;
    return { success: true, blocks: data.blocks };
  } catch (error) {
    console.error('Error creating question blocks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getQuestionBlocks = async (concursoId: string): Promise<QuestionBlock[]> => {
  try {
    const { data, error } = await supabase.rpc('manage_question_blocks', {
      p_operation: 'GET',
      p_concurso_id: concursoId
    });

    if (error) throw error;
    return data.blocks || [];
  } catch (error) {
    console.error('Error fetching question blocks:', error);
    return [];
  }
};

export const updateQuestionBlocks = async (
  concursoId: string, 
  blocks: QuestionBlock[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.rpc('manage_question_blocks', {
      p_operation: 'UPDATE',
      p_concurso_id: concursoId,
      p_blocks: blocks
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating question blocks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
