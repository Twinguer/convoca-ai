
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
  questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' };
  setIsSaving: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSavedSuccess: (value: boolean) => void;
  onSuccess: () => void;
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  editCount?: number;
}

export const useSaveAnswers = ({
  rankingId,
  concurso,
  answers,
  questionType,
  setIsSaving,
  setError,
  setSavedSuccess,
  onSuccess,
  discursiveScore,
  caseStudy1Score,
  caseStudy2Score,
  caseStudy3Score,
  editCount = 0
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateAnswers = (): boolean => {
    // For "Alternativas" type exams, all questions must be answered
    if (concurso.exam_type !== 'Certo ou Errado') {
      const totalQuestions = (concurso.basic_knowledge_questions || 0) +
                             (concurso.specific_knowledge_1_questions || 0) +
                             (concurso.specific_knowledge_2_questions || 0) +
                             (concurso.specific_knowledge_3_questions || 0);
      
      // Check if all questions have answers
      if (Object.keys(answers).length < totalQuestions) {
        setError("Você precisa responder a todas as questões antes de salvar.");
        return false;
      }
    }
    
    // Check if user has reached the edit limit (3 times)
    if (editCount >= 3) {
      setError("Você já atingiu o limite de 3 edições para este cartão de respostas.");
      return false;
    }
    
    return true;
  };

  const calculateScore = async () => {
    try {
      // Get official answer key
      const { data: answerKey, error: answerKeyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);
        
      if (answerKeyError) throw answerKeyError;
      
      if (!answerKey || answerKey.length === 0) {
        console.log('No answer key found for this concurso');
        return; // Skip score calculation if no answer key is available
      }
      
      // Calculate score
      let basicKnowledgeCorrect = 0;
      let specificKnowledge1Correct = 0;
      let specificKnowledge2Correct = 0;
      let specificKnowledge3Correct = 0;
      
      let basicKnowledgeWrong = 0;
      let specificKnowledge1Wrong = 0;
      let specificKnowledge2Wrong = 0;
      let specificKnowledge3Wrong = 0;
      
      let totalCorrect = 0;
      let totalQuestions = 0;
      
      // First count the total questions from the answer key
      const totalQuestionsInAnswerKey = answerKey.length;
      
      // For each question in the answer key, check if the user answered it correctly
      answerKey.forEach(officialAnswer => {
        totalQuestions++;
        const questionNumber = officialAnswer.question_number;
        const userAnswer = answers[questionNumber];
        
        // Skip score calculation for blank answers in Certo ou Errado exam type
        if (concurso.exam_type === 'Certo ou Errado' && !userAnswer) {
          // No points added or subtracted for blank answers
          return;
        }
        
        // Determine the question type
        const isBasicKnowledge = officialAnswer.is_basic_knowledge;
        const isSpecific1 = officialAnswer.is_specific_1;
        const isSpecific2 = officialAnswer.is_specific_2;
        const isSpecific3 = !isBasicKnowledge && !isSpecific1 && !isSpecific2; // Assuming specific3 if not others
        
        // Check for correct answer
        if (userAnswer && officialAnswer.answer.toUpperCase() === userAnswer.toUpperCase()) {
          totalCorrect++;
          
          if (isBasicKnowledge) {
            basicKnowledgeCorrect++;
          } else if (isSpecific1) {
            specificKnowledge1Correct++;
          } else if (isSpecific2) {
            specificKnowledge2Correct++;
          } else if (isSpecific3) {
            specificKnowledge3Correct++;
          }
        } else if (concurso.exam_type === 'Certo ou Errado' && userAnswer) {
          // For wrong answers in "Certo ou Errado" type, subtract one point
          if (isBasicKnowledge) {
            basicKnowledgeWrong++;
          } else if (isSpecific1) {
            specificKnowledge1Wrong++;
          } else if (isSpecific2) {
            specificKnowledge2Wrong++;
          } else if (isSpecific3) {
            specificKnowledge3Wrong++;
          }
        }
      });

      // Calculate the final scores with penalties for wrong answers
      let basicKnowledgeScore = basicKnowledgeCorrect - basicKnowledgeWrong;
      let specificKnowledge1Score = specificKnowledge1Correct - specificKnowledge1Wrong;
      let specificKnowledge2Score = specificKnowledge2Correct - specificKnowledge2Wrong;
      let specificKnowledge3Score = specificKnowledge3Correct - specificKnowledge3Wrong;
      
      // Ensure scores don't go below zero
      basicKnowledgeScore = Math.max(0, basicKnowledgeScore);
      specificKnowledge1Score = Math.max(0, specificKnowledge1Score);
      specificKnowledge2Score = Math.max(0, specificKnowledge2Score);
      specificKnowledge3Score = Math.max(0, specificKnowledge3Score);
      
      // Apply weights to each score component
      const weightedBasicScore = basicKnowledgeScore * (concurso.basic_knowledge_weight || 1);
      const weightedSpecific1Score = specificKnowledge1Score * (concurso.specific_knowledge_1_weight || 1);
      const weightedSpecific2Score = specificKnowledge2Score * (concurso.specific_knowledge_2_weight || 1);
      const weightedSpecific3Score = specificKnowledge3Score * (concurso.specific_knowledge_3_weight || 1);
      
      // Total specific knowledge score is the sum of all specific components
      const specificKnowledgeScore = specificKnowledge1Score + specificKnowledge2Score + specificKnowledge3Score;
      const weightedSpecificScore = weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score;
      
      // Include discursive and case study scores if provided and the exam has those components
      const weightedDiscursiveScore = concurso.has_discursive && discursiveScore !== undefined && discursiveScore !== null
        ? Number(discursiveScore) * (concurso.discursive_weight || 1)
        : 0;
        
      const weightedCaseStudy1Score = concurso.has_case_study_1 && caseStudy1Score !== undefined && caseStudy1Score !== null
        ? Number(caseStudy1Score) * (concurso.case_study_1_weight || 1)
        : 0;
        
      const weightedCaseStudy2Score = concurso.has_case_study_2 && caseStudy2Score !== undefined && caseStudy2Score !== null
        ? Number(caseStudy2Score) * (concurso.case_study_2_weight || 1)
        : 0;
        
      const weightedCaseStudy3Score = concurso.has_case_study_3 && caseStudy3Score !== undefined && caseStudy3Score !== null
        ? Number(caseStudy3Score) * (concurso.case_study_3_weight || 1)
        : 0;
      
      // Combine all case study scores for the discursive total
      const combinedDiscursiveScore = 
        (discursiveScore !== undefined && discursiveScore !== null ? Number(discursiveScore) : 0) +
        (caseStudy1Score !== undefined && caseStudy1Score !== null ? Number(caseStudy1Score) : 0) +
        (caseStudy2Score !== undefined && caseStudy2Score !== null ? Number(caseStudy2Score) : 0) +
        (caseStudy3Score !== undefined && caseStudy3Score !== null ? Number(caseStudy3Score) : 0);
      
      // Calculate final total score (sum of weighted components)
      const totalScore = 
        weightedBasicScore + 
        weightedSpecificScore + 
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      console.log(`Score calculation: ${totalCorrect}/${totalQuestions} correct`);
      console.log(`Basic Knowledge: Correct=${basicKnowledgeCorrect}, Wrong=${basicKnowledgeWrong}, Final=${basicKnowledgeScore}, Weighted=${weightedBasicScore}`);
      console.log(`Specific Knowledge 1: Correct=${specificKnowledge1Correct}, Wrong=${specificKnowledge1Wrong}, Final=${specificKnowledge1Score}, Weighted=${weightedSpecific1Score}`);
      console.log(`Specific Knowledge 2: Correct=${specificKnowledge2Correct}, Wrong=${specificKnowledge2Wrong}, Final=${specificKnowledge2Score}, Weighted=${weightedSpecific2Score}`);
      console.log(`Specific Knowledge 3: Correct=${specificKnowledge3Correct}, Wrong=${specificKnowledge3Wrong}, Final=${specificKnowledge3Score}, Weighted=${weightedSpecific3Score}`);
      console.log(`Discursive: ${discursiveScore || 0}, Weighted=${weightedDiscursiveScore}`);
      console.log(`Case Study 1: ${caseStudy1Score || 0}, Weighted=${weightedCaseStudy1Score}`);
      console.log(`Case Study 2: ${caseStudy2Score || 0}, Weighted=${weightedCaseStudy2Score}`);
      console.log(`Case Study 3: ${caseStudy3Score || 0}, Weighted=${weightedCaseStudy3Score}`);
      console.log(`Total Score: ${totalScore}`);
      
      // Update the user_rankings record with the calculated scores
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          discursive_score: combinedDiscursiveScore,
          score: totalScore,
          all_questions_answered: concurso.exam_type === 'Certo ou Errado' ? true : Object.keys(answers).length === totalQuestionsInAnswerKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);
        
      if (updateError) throw updateError;
      
      // Invalidate rankings query
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      
      return { totalCorrect, totalQuestions, totalScore };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  };

  const handleSaveAnswers = async () => {
    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);
    
    try {
      // For "Alternativas" type exams, you must answer at least one question
      if (concurso.exam_type !== 'Certo ou Errado' && Object.keys(answers).length === 0) {
        setError("Você ainda não respondeu nenhuma questão. Por favor, responda ao menos uma questão antes de salvar.");
        setIsSaving(false);
        return;
      }
      
      // Check answer validation based on exam type
      if (!validateAnswers()) {
        setIsSaving(false);
        return;
      }
      
      // Get current edit count from database
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('edit_count')
        .eq('id', rankingId)
        .single();
        
      if (rankingError) throw rankingError;
      
      // Check if user can edit more
      if (rankingData && rankingData.edit_count >= 3) {
        setError("Você já atingiu o limite de 3 edições para este cartão de respostas.");
        setIsSaving(false);
        return;
      }
      
      // Prepare batch data for upsert operation - only for answered questions
      const upsertData = Object.entries(answers).map(([questionNumber, answer]) => {
        const questionNum = parseInt(questionNumber);
        const type = questionType[questionNum] || 'basic';
        
        return {
          user_ranking_id: rankingId,
          question_number: questionNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: type === 'basic',
          updated_at: new Date().toISOString()
        };
      });
      
      console.log(`Saving ${upsertData.length} answers for ranking ${rankingId}`);
      
      // Delete existing answers first
      const { error: deleteError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
        
      if (deleteError) throw deleteError;
      
      // Only insert new answers if there are any (for C/E, might be all blank)
      if (upsertData.length > 0) {
        const { error: insertError } = await supabase
          .from('user_answers')
          .insert(upsertData);
          
        if (insertError) throw insertError;
      }
      
      // Compare with answer key to calculate the score
      const scoreResult = await calculateScore();
      
      // Get updated edit count
      const { data: updatedRankingData, error: updatedRankingError } = await supabase
        .from('user_rankings')
        .select('edit_count')
        .eq('id', rankingId)
        .single();
        
      if (updatedRankingError) throw updatedRankingError;
      
      const editsLeft = 3 - (updatedRankingData?.edit_count || 0);
      const editsMessage = editsLeft > 0 
        ? `Você ainda pode editar este cartão mais ${editsLeft} ${editsLeft === 1 ? 'vez' : 'vezes'}.` 
        : 'Esta foi sua última edição permitida.';

      toast({
        title: "Respostas salvas com sucesso",
        description: scoreResult 
          ? `Você acertou ${scoreResult.totalCorrect} de ${scoreResult.totalQuestions} questões. ${editsMessage}`
          : `Suas respostas foram salvas. O gabarito ainda não está disponível para calcular sua pontuação. ${editsMessage}`,
      });
      
      setSavedSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-answers', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings', rankingId] });
      
      // Navigate after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving answers:', error);
      setError(error.message || "Ocorreu um erro ao salvar suas respostas.");
      toast({
        title: "Erro ao salvar respostas",
        description: error.message || "Ocorreu um erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSaveAnswers };
};
