import { supabase } from '@/integrations/supabase/client';

/**
 * Updates the scores for a user ranking based on their answers
 */
export const updateUserScores = async (rankingId: string): Promise<any> => {
  try {
    console.log(`[updateUserScores] Updating scores for ranking ID: ${rankingId}`);
    
    const { data, error } = await supabase.rpc('calculate_user_score_realtime', {
      p_ranking_id: rankingId
    });

    if (error) {
      console.error(`[updateUserScores] Error calculating score: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`[updateUserScores] Score updated successfully: ${data}`);
    return { success: true, score: data };
  } catch (err) {
    console.error(`[updateUserScores] Exception in updateUserScores: ${err}`);
    return { success: false, error: err };
  }
};

/**
 * Updates the section_type field for all questions in a concurso
 * based on the concurso's structure
 */
export const updateSectionTypeForConcurso = async (concursoId: string): Promise<any> => {
  try {
    console.log(`[updateSectionType] Updating section types for concurso: ${concursoId}`);
    
    // First, get the concurso details to determine structure
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error(`[updateSectionType] Error getting concurso: ${concursoError.message}`);
      return { success: false, error: concursoError.message };
    }
    
    if (!concursoData) {
      return { success: false, error: 'Concurso not found' };
    }
    
    // If this is a subject-based concurso, we handle it differently
    if (concursoData.minimum_score_type === 'subject') {
      // Get the subjects array
      let subjects: any[] = [];
      try {
        subjects = typeof concursoData.subjects === 'string'
          ? JSON.parse(concursoData.subjects)
          : concursoData.subjects || [];
      } catch (e) {
        console.error(`[updateSectionType] Error parsing subjects: ${e}`);
        return { success: false, error: 'Invalid subjects data' };
      }
      
      if (subjects.length === 0) {
        return { success: false, error: 'No subjects defined for this concurso' };
      }
      
      // Calculate question ranges for each subject
      let startQuestion = 1;
      let updates = [];
      
      for (const subject of subjects) {
        const endQuestion = startQuestion + subject.questions - 1;
        
        // Update all questions in this range to this subject
        const { data, error } = await supabase
          .from('official_answer_weights')
          .update({ section_type: subject.code })
          .eq('concurso_id', concursoId)
          .gte('question_number', startQuestion)
          .lte('question_number', endQuestion);
          
        if (error) {
          console.error(`[updateSectionType] Error updating section type for subject ${subject.code}: ${error.message}`);
        } else {
          updates.push({ subject: subject.code, range: `${startQuestion}-${endQuestion}` });
        }
        
        startQuestion = endQuestion + 1;
      }
      
      console.log(`[updateSectionType] Updated section types for subjects: ${JSON.stringify(updates)}`);
      return { success: true, updates };
    }
    
    // For knowledge-based concursos, use the standard section logic
    const basicKnowledgeQuestions = concursoData.basic_knowledge_questions || 0;
    const specific1Questions = concursoData.specific_knowledge_1_questions || 0;
    const specific2Questions = concursoData.specific_knowledge_2_questions || 0;
    
    // Update basic knowledge questions
    if (basicKnowledgeQuestions > 0) {
      const { error: basicError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'basic' })
        .eq('concurso_id', concursoId)
        .lte('question_number', basicKnowledgeQuestions);
        
      if (basicError) {
        console.error(`[updateSectionType] Error updating basic knowledge section: ${basicError.message}`);
        return { success: false, error: basicError.message };
      }
    }
    
    // Update specific knowledge 1 questions
    if (specific1Questions > 0) {
      const specificStart = basicKnowledgeQuestions + 1;
      const specificEnd = basicKnowledgeQuestions + specific1Questions;
      
      const { error: specific1Error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific1' })
        .eq('concurso_id', concursoId)
        .gte('question_number', specificStart)
        .lte('question_number', specificEnd);
        
      if (specific1Error) {
        console.error(`[updateSectionType] Error updating specific1 section: ${specific1Error.message}`);
        return { success: false, error: specific1Error.message };
      }
    }
    
    // Update specific knowledge 2 questions
    if (specific2Questions > 0) {
      const specific2Start = basicKnowledgeQuestions + specific1Questions + 1;
      const specific2End = basicKnowledgeQuestions + specific1Questions + specific2Questions;
      
      const { error: specific2Error } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific2' })
        .eq('concurso_id', concursoId)
        .gte('question_number', specific2Start)
        .lte('question_number', specific2End);
        
      if (specific2Error) {
        console.error(`[updateSectionType] Error updating specific2 section: ${specific2Error.message}`);
        return { success: false, error: specific2Error.message };
      }
    }
    
    // Update specific knowledge 3 questions (all remaining questions)
    const specific3Start = basicKnowledgeQuestions + specific1Questions + specific2Questions + 1;
    
    const { error: specific3Error } = await supabase
      .from('official_answer_weights')
      .update({ section_type: 'specific3' })
      .eq('concurso_id', concursoId)
      .gte('question_number', specific3Start);
      
    if (specific3Error) {
      console.error(`[updateSectionType] Error updating specific3 section: ${specific3Error.message}`);
      return { success: false, error: specific3Error.message };
    }
    
    console.log(`[updateSectionType] Successfully updated section types for concurso: ${concursoId}`);
    return { success: true };
  } catch (err) {
    console.error(`[updateSectionType] Exception in updateSectionTypeForConcurso: ${err}`);
    return { success: false, error: err };
  }
};

/**
 * Check if a candidate meets the quota-specific minimum score requirements
 */
export const checkQuotaMinimumRequirements = async (
  rankingId: string, 
  concursoId: string
): Promise<{ meets: boolean, details: any }> => {
  try {
    // Get concurso info (including quota minimum settings)
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError || !concurso) {
      console.error(`Error fetching concurso: ${concursoError?.message}`);
      return { meets: true, details: { error: 'Could not verify quota requirements' } };
    }
    
    // If there's no quota minimum requirement, everyone meets it
    if (!concurso.has_quota_minimum_score || concurso.quota_minimum_score <= 0) {
      return { meets: true, details: { reason: 'No quota minimum requirements' } };
    }
    
    // Get ranking info (scores)
    const { data: ranking, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
      
    if (rankingError || !ranking) {
      console.error(`Error fetching ranking: ${rankingError?.message}`);
      return { meets: true, details: { error: 'Could not verify quota requirements' } };
    }
    
    // If not competing in a quota category, this check doesn't apply
    if (ranking.reservation_type === 'Ampla Concorrência') {
      return { meets: true, details: { reason: 'Not competing in a quota category' } };
    }
    
    // Calculate total possible score to determine percentage if needed
    const totalPossibleScore = (
      (concurso.basic_knowledge_questions || 0) +
      (concurso.specific_knowledge_1_questions || 0) +
      (concurso.specific_knowledge_2_questions || 0) +
      (concurso.specific_knowledge_3_questions || 0)
    );
    
    // Calculate actual obtained score
    const actualScore = (
      (ranking.basic_knowledge_score || 0) +
      (ranking.specific_knowledge_1_score || 0) +
      (ranking.specific_knowledge_2_score || 0) +
      (ranking.specific_knowledge_3_score || 0)
    );
    
    // Check against minimum required
    let meetsRequirement = true;
    let requiredScore = 0;
    
    if (concurso.quota_minimum_score_unit_type === 'percentage') {
      // Convert percentage to actual score
      requiredScore = (totalPossibleScore * concurso.quota_minimum_score) / 100;
      meetsRequirement = actualScore >= requiredScore;
    } else {
      // Direct points comparison
      requiredScore = concurso.quota_minimum_score;
      meetsRequirement = actualScore >= requiredScore;
    }
    
    return {
      meets: meetsRequirement,
      details: {
        totalPossibleScore,
        actualScore,
        requiredScore,
        minimumType: concurso.quota_minimum_score_unit_type,
        minimumValue: concurso.quota_minimum_score
      }
    };
  } catch (err) {
    console.error(`Exception in checkQuotaMinimumRequirements: ${err}`);
    return { meets: true, details: { error: String(err) } };
  }
};
