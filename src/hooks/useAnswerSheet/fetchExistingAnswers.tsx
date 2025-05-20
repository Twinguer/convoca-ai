
import { supabase } from '@/integrations/supabase/client';
import { SectionType } from '@/types/concursos';
import { getDisciplines, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>,
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>,
  setDiscursiveScore: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy1Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy2Score: React.Dispatch<React.SetStateAction<number | null>>,
  setCaseStudy3Score: React.Dispatch<React.SetStateAction<number | null>>
) => {
  try {
    console.log('Fetching existing answers for ranking ID:', rankingId);
    
    // Fetch answers
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) throw answersError;
    
    console.log('Fetched answers data:', answersData);
    
    if (answersData?.length) {
      const answersMap: { [key: number]: string } = {};
      const typesMap: { [key: number]: SectionType } = {};
      
      // Fetch the concurso to determine if it uses hierarchical structure
      const { data: rankingData } = await supabase
        .from('user_rankings')
        .select('concurso_id')
        .eq('id', rankingId)
        .single();
        
      if (rankingData?.concurso_id) {
        const { data: concurso } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', rankingData.concurso_id)
          .single();
        
        if (concurso) {
          console.log('Retrieved concurso data for question types:', concurso.id);
          const hierarchical = isHierarchicalStructure(concurso);
          console.log('Using hierarchical structure:', hierarchical);
          
          // Process each answer and map it correctly
          answersData.forEach((item: any) => {
            // Parse question number as integer to ensure consistency
            const questionNumber = parseInt(item.question_number, 10);
            answersMap[questionNumber] = item.answer;
            
            // For traditional structure, use the is_* fields
            if (item.is_basic_knowledge) {
              typesMap[questionNumber] = 'basic';
            } else if (item.is_specific_1) {
              typesMap[questionNumber] = 'specific1';
            } else if (item.is_specific_2) {
              typesMap[questionNumber] = 'specific2';
            } else if (item.is_specific_3) {
              typesMap[questionNumber] = 'specific3';
            } else {
              // For custom knowledge structure, try to determine section type
              // This will be populated in initializeQuestionTypes when concurso loads
            }
          });
          
          console.log('Parsed answers map:', answersMap);
          console.log('Parsed question types map:', typesMap);
        }
      }
      
      setAnswers(answersMap);
      setQuestionType(typesMap);
    } else {
      console.log('No existing answers found for ranking ID:', rankingId);
    }
    
    // Fetch user ranking for scores
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
      
    if (rankingError) throw rankingError;
    
    console.log('Fetched ranking data:', rankingData);
    
    if (rankingData) {
      setDiscursiveScore(
        rankingData.discursive_score !== null && rankingData.discursive_score !== undefined
          ? rankingData.discursive_score
          : null
      );
      setCaseStudy1Score(
        rankingData.case_study_1_score !== null && rankingData.case_study_1_score !== undefined
          ? rankingData.case_study_1_score
          : null
      );
      setCaseStudy2Score(
        rankingData.case_study_2_score !== null && rankingData.case_study_2_score !== undefined
          ? rankingData.case_study_2_score
          : null
      );
      setCaseStudy3Score(
        rankingData.case_study_3_score !== null && rankingData.case_study_3_score !== undefined
          ? rankingData.case_study_3_score
          : null
      );
    }
  } catch (error) {
    console.error('Error fetching answers:', error);
  }
};
