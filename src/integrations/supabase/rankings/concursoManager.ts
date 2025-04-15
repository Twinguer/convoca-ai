
import { supabase } from '../client';

// Helper function to create a new ranking
export const createRanking = async (rankingData: any) => {
  try {
    console.log('Creating new ranking with data:', rankingData);
    
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
      
    if (error) {
      console.error('Error creating concurso:', error);
      throw new Error(`Failed to create concurso: ${error.message}`);
    }
    
    if (!concurso || concurso.length === 0) {
      throw new Error("Failed to create concurso record");
    }
    
    const concursoId = concurso[0].id;
    console.log('Created concurso with ID:', concursoId);
    
    // Then create the exam sections if provided
    if (examSections && examSections.length > 0) {
      const sectionsWithConcursoId = examSections.map((section: any) => ({
        ...section,
        concurso_id: concursoId
      }));
      
      console.log('Creating exam sections:', sectionsWithConcursoId);
      
      const { error: examSectionError } = await supabase
        .from('exam_sections')
        .insert(sectionsWithConcursoId);
        
      if (examSectionError) {
        console.error('Error creating exam sections:', examSectionError);
        throw new Error(`Failed to create exam sections: ${examSectionError.message}`);
      }
    }
    
    // Then create the evaluation sections if provided
    if (evaluationSections && evaluationSections.length > 0) {
      const evalSectionsWithConcursoId = evaluationSections.map((section: any) => ({
        ...section,
        concurso_id: concursoId
      }));
      
      console.log('Creating evaluation sections:', evalSectionsWithConcursoId);
      
      const { error: evalSectionError } = await supabase
        .from('evaluation_sections')
        .insert(evalSectionsWithConcursoId);
        
      if (evalSectionError) {
        console.error('Error creating evaluation sections:', evalSectionError);
        throw new Error(`Failed to create evaluation sections: ${evalSectionError.message}`);
      }
    }
    
    console.log('Successfully created ranking with all sections');
    return concurso;
    
  } catch (error: any) {
    console.error('Error creating ranking:', error);
    // Rethrow to propagate the error details
    throw error.message ? error : new Error(String(error));
  }
};
