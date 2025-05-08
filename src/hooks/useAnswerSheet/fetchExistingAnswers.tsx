
import { supabase } from "@/integrations/supabase/client";

// Define o tipo para questionType que inclui conhecimentos, disciplinas e avaliações discursivas
type QuestionSectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive'
  | 'case_study1' 
  | 'case_study2'
  | 'case_study3'
  // Disciplinas comuns
  | 'LPT' | 'ING' | 'MAT' | 'RLM' | 'EST' | 'COS' | 'ADM' | 'ADO' 
  | 'COT' | 'COC' | 'ECO' | 'TRI' | 'AFO' | 'LTC' | 'TIC' | 'ETT' 
  | 'AUD' | 'CIV' | 'PEN' | 'INF' | 'EMP' | 'MTF' | 'OUT'
  // Permite qualquer string para disciplinas customizadas
  | string;

export const fetchExistingAnswers = async (
  rankingId: string,
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>,
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: QuestionSectionType }>>,
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
      const typesMap: { [key: number]: QuestionSectionType } = {};
      
      answersData.forEach((item: any) => {
        // Extract question number from key
        const questionNumber = item.question_number;
        
        answersMap[questionNumber] = item.answer;
        
        // Determina o tipo da questão (conhecimentos ou disciplina)
        if (item.is_basic_knowledge) {
          typesMap[questionNumber] = 'basic';
        } else if (item.is_specific_1) {
          typesMap[questionNumber] = 'specific1';
        } else if (item.is_specific_2) {
          typesMap[questionNumber] = 'specific2';
        } else if (item.is_specific_3) {
          typesMap[questionNumber] = 'specific3';
        } else if (item.section_type) {
          // Isso é para disciplinas ou seções personalizadas - todas tratadas igualmente
          typesMap[questionNumber] = item.section_type;
        }
      });
      
      console.log('Parsed answers map:', answersMap);
      console.log('Parsed question types map:', typesMap);
      
      setAnswers(answersMap);
      setQuestionType(typesMap);
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
