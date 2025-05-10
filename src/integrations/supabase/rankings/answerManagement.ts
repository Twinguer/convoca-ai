
import { supabase } from '../client';
import { getSectionTypeForQuestion, getExamStructure } from './examStructure';

export const saveAnswers = async (
  rankingId: string,
  concursoId: string, 
  answers: { [key: number]: string },
  discursiveScore: number | null = null,
  caseStudy1Score: number | null = null,
  caseStudy2Score: number | null = null,
  caseStudy3Score: number | null = null
) => {
  try {
    // Get the structure of the exam
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Get exam structure
    const examStructure = getExamStructure(concursoData);
    
    // Convert answers object to array of objects for RPC call
    const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
      const qNum = parseInt(questionNumber);
      const sectionType = getSectionTypeForQuestion(qNum, concursoData);
      
      return {
        questionNumber: qNum,
        answer: answer,
        sectionType
      };
    });
    
    // Call the RPC function to save answers and calculate scores
    const { data, error } = await supabase
      .rpc('save_user_answers_and_calculate_scores', {
        p_ranking_id: rankingId,
        p_concurso_id: concursoId,
        p_answers: answersArray,
        p_discursive_score: discursiveScore || 0,
        p_case_study_1_score: caseStudy1Score || 0,
        p_case_study_2_score: caseStudy2Score || 0,
        p_case_study_3_score: caseStudy3Score || 0
      });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving answers:', error);
    throw error;
  }
};
