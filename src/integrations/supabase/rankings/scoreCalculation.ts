
import { supabase } from '@/integrations/supabase/client';

export const calculateScoreForSubjectBased = (answers: any, officialAnswers: any, concurso: any) => {
  // This would be the implementation for calculating scores based on subjects
  console.log('Using subject-based scoring calculation');
  
  if (!concurso.subjects || !Array.isArray(concurso.subjects) || concurso.subjects.length === 0) {
    console.warn('No subjects defined for this concurso');
    return {
      score: 0,
      subjectScores: {},
    };
  }
  
  // Initialize scores for each subject
  const subjectScores: Record<string, number> = {};
  let totalScore = 0;
  
  // Group answers by subject code
  const answersBySubject: Record<string, Record<number, string>> = {};
  
  // Initialize subjects
  concurso.subjects.forEach((subject: any) => {
    const subjectCode = subject.code;
    subjectScores[subjectCode] = 0;
    answersBySubject[subjectCode] = {};
  });
  
  // Organize official answers by subject and question number
  const officialAnswersBySubject: Record<string, Record<number, any>> = {};
  
  Object.entries(officialAnswers).forEach(([key, value]: [string, any]) => {
    const questionNumber = parseInt(key.replace('questao', ''));
    const sectionType = value.secao;
    
    // Only process if it's a valid subject
    if (sectionType && subjectScores.hasOwnProperty(sectionType)) {
      if (!officialAnswersBySubject[sectionType]) {
        officialAnswersBySubject[sectionType] = {};
      }
      officialAnswersBySubject[sectionType][questionNumber] = value;
    }
  });
  
  // Compare user answers with official answers
  Object.entries(answers).forEach(([questionNumber, userAnswer]: [string, any]) => {
    const qNum = parseInt(questionNumber);
    
    // Find which subject this question belongs to
    for (const [subjectCode, subjectOfficialAnswers] of Object.entries(officialAnswersBySubject)) {
      if (subjectOfficialAnswers[qNum]) {
        const officialAnswer = subjectOfficialAnswers[qNum];
        
        // If question is nullified or answer is correct, add points
        if (officialAnswer.anulada || userAnswer.toUpperCase() === officialAnswer.resposta.toUpperCase()) {
          // Find the subject weight
          const subject = concurso.subjects.find((s: any) => s.code === subjectCode);
          const weight = subject ? subject.weight || 1 : 1;
          
          // Add to subject score
          subjectScores[subjectCode] += 1 * weight;
        }
        
        break; // Question found and processed, no need to check other subjects
      }
    }
  });
  
  // Calculate total score as sum of all subject scores
  totalScore = Object.values(subjectScores).reduce((sum: number, score: number) => sum + score, 0);
  
  // Add subjective scores if available
  if (concurso.has_discursive && typeof concurso.discursive_weight === 'number') {
    totalScore += concurso.discursive_score * concurso.discursive_weight;
  }
  
  Object.entries({
    case_study_1_score: concurso.has_case_study_1,
    case_study_2_score: concurso.has_case_study_2,
    case_study_3_score: concurso.has_case_study_3
  }).forEach(([scoreKey, hasScore]) => {
    if (hasScore && typeof concurso[scoreKey] === 'number' && typeof concurso[`${scoreKey.replace('score', 'weight')}`] === 'number') {
      totalScore += concurso[scoreKey] * concurso[`${scoreKey.replace('score', 'weight')}`];
    }
  });
  
  return {
    score: totalScore,
    subjectScores,
  };
};

/**
 * Updates the section_type for a concurso, identifying if it's knowledge-based or subject-based
 * @param concursoId The ID of the concurso to update
 * @returns An object indicating success or failure of the operation
 */
export const updateSectionTypeForConcurso = async (concursoId: string): Promise<{success: boolean, error?: string}> => {
  try {
    console.log(`[updateSectionTypeForConcurso] Updating section_type for concurso ${concursoId}`);
    
    // Get the concurso to check its type (subject-based or knowledge-based)
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) {
      console.error('[updateSectionTypeForConcurso] Error fetching concurso:', concursoError);
      return { success: false, error: concursoError.message };
    }
    
    if (!concurso) {
      return { success: false, error: 'Concurso not found' };
    }
    
    // Check if this is a subject-based concurso
    const isSubjectBased = concurso.subjects && Array.isArray(concurso.subjects) && concurso.subjects.length > 0;
    const sectionType = isSubjectBased ? 'subject_based' : 'knowledge_based';
    
    console.log(`[updateSectionTypeForConcurso] Concurso is ${sectionType}`);
    
    // Update the official answers with the appropriate section_type
    const { error: updateError } = await supabase
      .from('official_answer_weights')
      .update({ section_type: sectionType })
      .eq('concurso_id', concursoId);
    
    if (updateError) {
      console.error('[updateSectionTypeForConcurso] Error updating section_type:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[updateSectionTypeForConcurso] Unexpected error:', error);
    return { success: false, error: `Unexpected error: ${error}` };
  }
};
