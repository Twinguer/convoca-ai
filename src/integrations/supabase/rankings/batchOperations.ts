
import { supabase } from '../client';

// Function to recalculate all user scores for a concurso
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log('[recalculateAllUserScores] Iniciando recálculo para concurso:', concursoId);
    
    // Use the RPC function that properly handles section_type instead of is_basic_knowledge columns
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });
    
    if (error) {
      console.error('[recalculateAllUserScores] Erro durante recálculo:', error);
      return {
        success: false,
        error: error.message || 'Erro durante o recálculo das pontuações',
        updatedCount: 0
      };
    }
    
    console.log('[recalculateAllUserScores] Recálculo concluído:', data);
    
    return {
      success: true,
      updatedCount: data.updatedCount || 0,
      executionTimeMs: data.executionTimeMs || 0
    };
  } catch (error: any) {
    console.error('[recalculateAllUserScores] Erro não tratado:', error);
    return {
      success: false,
      error: error.message || 'Erro durante o recálculo das pontuações',
      updatedCount: 0
    };
  }
};

// Function to update the section_type in official_answer_weights
export const updateSectionType = async (concursoId: string) => {
  try {
    console.log('[updateSectionType] Atualizando section_type para concurso:', concursoId);
    
    // Get concurso structure
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      throw concursoError;
    }
    
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
    
    // Update section_type for all questions
    const updates = [];
    
    // Basic knowledge questions
    if (basicEnd > 0) {
      const { error: basicError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'basic' })
        .eq('concurso_id', concursoId)
        .lte('question_number', basicEnd);
        
      if (basicError) updates.push({ section: 'basic', error: basicError.message });
    }
    
    // Specific knowledge 1 questions
    if (concurso.specific_knowledge_1_questions > 0) {
      const { error: spec1Error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific1' })
        .eq('concurso_id', concursoId)
        .gt('question_number', basicEnd)
        .lte('question_number', specific1End);
        
      if (spec1Error) updates.push({ section: 'specific1', error: spec1Error.message });
    }
    
    // Specific knowledge 2 questions
    if (concurso.specific_knowledge_2_questions > 0) {
      const { error: spec2Error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific2' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific1End)
        .lte('question_number', specific2End);
        
      if (spec2Error) updates.push({ section: 'specific2', error: spec2Error.message });
    }
    
    // Specific knowledge 3 questions
    if (concurso.specific_knowledge_3_questions > 0) {
      const { error: spec3Error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific3' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific2End);
        
      if (spec3Error) updates.push({ section: 'specific3', error: spec3Error.message });
    }
    
    return {
      success: updates.length === 0,
      updates
    };
  } catch (error: any) {
    console.error('[updateSectionType] Erro não tratado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
