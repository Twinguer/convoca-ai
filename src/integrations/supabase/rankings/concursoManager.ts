
import { supabase } from '../client';

// Helper function to create a new ranking
export const createRanking = async (rankingData: any) => {
  try {
    const { 
      examSections, 
      evaluationSections, 
      ...concursoData 
    } = rankingData;
    
    // First create the concurso
    const { data: concurso, error } = await supabase
      .from('concursos')
      .insert([concursoData])
      .select();
      
    if (error) throw error;
    if (!concurso || concurso.length === 0) {
      throw new Error("Failed to create concurso record");
    }
    
    const concursoId = concurso[0].id;
    
    // Then create the exam sections if provided
    if (examSections && examSections.length > 0) {
      const { error: examSectionError } = await supabase
        .from('exam_sections')
        .insert(
          examSections.map((section: any) => ({
            ...section,
            concurso_id: concursoId
          }))
        );
        
      if (examSectionError) throw examSectionError;
    }
    
    // Then create the evaluation sections if provided
    if (evaluationSections && evaluationSections.length > 0) {
      const { error: evalSectionError } = await supabase
        .from('evaluation_sections')
        .insert(
          evaluationSections.map((section: any) => ({
            ...section,
            concurso_id: concursoId
          }))
        );
        
      if (evalSectionError) throw evalSectionError;
    }
    
    return concurso;
    
  } catch (error) {
    console.error('Error creating ranking:', error);
    throw error;
  }
};
