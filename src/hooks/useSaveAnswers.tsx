
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
      let basicKnowledgeScore = basicKnowledgeCorrect - (basicKnowledgeWrong * (concurso.wrong_answer_penalty || 0));
      let specificKnowledge1Score = specificKnowledge1Correct - (specificKnowledge1Wrong * (concurso.wrong_answer_penalty || 0));
      let specificKnowledge2Score = specificKnowledge2Correct - (specificKnowledge2Wrong * (concurso.wrong_answer_penalty || 0));
      let specificKnowledge3Score = specificKnowledge3Correct - (specificKnowledge3Wrong * (concurso.wrong_answer_penalty || 0));
      
      // Ensure scores don't go below zero
      basicKnowledgeScore = Math.max(0, basicKnowledgeScore);
      specificKnowledge1Score = Math.max(0, specificKnowledge1Score);
      specificKnowledge2Score = Math.max(0, specificKnowledge2Score);
      specificKnowledge3Score = Math.max(0, specificKnowledge3Score);
      
      // Calculate base scores as percentages of total possible points in each section
      const totalBasicQuestions = concurso.basic_knowledge_questions || 0;
      const totalSpecific1Questions = concurso.specific_knowledge_1_questions || 0;
      const totalSpecific2Questions = concurso.specific_knowledge_2_questions || 0;
      const totalSpecific3Questions = concurso.specific_knowledge_3_questions || 0;
      
      // Convert raw scores to percentages (0-100 scale)
      const basicScorePercent = totalBasicQuestions > 0 ? (basicKnowledgeScore / totalBasicQuestions) * 100 : 0;
      const specific1ScorePercent = totalSpecific1Questions > 0 ? (specificKnowledge1Score / totalSpecific1Questions) * 100 : 0;
      const specific2ScorePercent = totalSpecific2Questions > 0 ? (specificKnowledge2Score / totalSpecific2Questions) * 100 : 0;
      const specific3ScorePercent = totalSpecific3Questions > 0 ? (specificKnowledge3Score / totalSpecific3Questions) * 100 : 0;
      
      // Apply weights to each score component (weights should be defined in concurso)
      // The formula is: (C.Bas x Peso das basicas) + (C.Esp1 x Peso especificas1) + ... + Discursiva + Est. Caso1 + ...
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      
      const weightedBasicScore = basicScorePercent * basicWeight;
      const weightedSpecific1Score = specific1ScorePercent * specific1Weight;
      const weightedSpecific2Score = specific2ScorePercent * specific2Weight;
      const weightedSpecific3Score = specific3ScorePercent * specific3Weight;
      
      // Total specific knowledge score is the sum of all specific components
      const specificKnowledgeScore = specificKnowledge1Score + specificKnowledge2Score + specificKnowledge3Score;
      const specificKnowledgePercent = specific1ScorePercent + specific2ScorePercent + specific3ScorePercent;
      
      // Include user-provided scores for discursive and case studies
      const discursiveValue = discursiveScore !== undefined && discursiveScore !== null ? Number(discursiveScore) : 0;
      const caseStudy1Value = caseStudy1Score !== undefined && caseStudy1Score !== null ? Number(caseStudy1Score) : 0;
      const caseStudy2Value = caseStudy2Score !== undefined && caseStudy2Score !== null ? Number(caseStudy2Score) : 0;
      const caseStudy3Value = caseStudy3Score !== undefined && caseStudy3Score !== null ? Number(caseStudy3Score) : 0;
      
      // Get weights for discursive and case studies (these are used differently)
      const discursiveWeight = concurso.discursive_weight || 1;
      const caseStudy1Weight = concurso.case_study_1_weight || 1;
      const caseStudy2Weight = concurso.case_study_2_weight || 1;
      const caseStudy3Weight = concurso.case_study_3_weight || 1;
      
      // Calculate weighted scores for discursive and case studies
      const weightedDiscursiveScore = concurso.has_discursive ? discursiveValue : 0;
      const weightedCaseStudy1Score = concurso.has_case_study_1 ? caseStudy1Value : 0;
      const weightedCaseStudy2Score = concurso.has_case_study_2 ? caseStudy2Value : 0;
      const weightedCaseStudy3Score = concurso.has_case_study_3 ? caseStudy3Value : 0;
      
      // Combine all discursive/case study scores for reporting
      const combinedDiscursiveScore = weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
      
      // Calculate final total score using the formula:
      // (C.Bas x Peso) + (C.Esp1 x Peso) + (C.Esp2 x Peso) + (C.Esp3 x Peso) + Discursiva + Est. Caso1 + Est. Caso2 + Est. Caso3
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score + 
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      console.log(`Score calculation breakdown:`);
      console.log(`Basic Knowledge: ${basicScorePercent.toFixed(2)} × ${basicWeight} = ${weightedBasicScore.toFixed(2)}`);
      console.log(`Specific Knowledge 1: ${specific1ScorePercent.toFixed(2)} × ${specific1Weight} = ${weightedSpecific1Score.toFixed(2)}`);
      console.log(`Specific Knowledge 2: ${specific2ScorePercent.toFixed(2)} × ${specific2Weight} = ${weightedSpecific2Score.toFixed(2)}`);
      console.log(`Specific Knowledge 3: ${specific3ScorePercent.toFixed(2)} × ${specific3Weight} = ${weightedSpecific3Score.toFixed(2)}`);
      console.log(`Discursive: ${discursiveValue.toFixed(2)}`);
      console.log(`Case Study 1: ${caseStudy1Value.toFixed(2)}`);
      console.log(`Case Study 2: ${caseStudy2Value.toFixed(2)}`);
      console.log(`Case Study 3: ${caseStudy3Value.toFixed(2)}`);
      console.log(`Total Score: ${totalScore.toFixed(2)}`);
      
      // Save individual component scores for analytics
      const scoreData = {
        basic_knowledge_score: basicScorePercent,
        specific_knowledge_1_score: specific1ScorePercent,
        specific_knowledge_2_score: specific2ScorePercent,
        specific_knowledge_3_score: specific3ScorePercent,
        specific_knowledge_score: specificKnowledgePercent,
        discursive_score: discursiveValue,
        case_study_1_score: caseStudy1Value,
        case_study_2_score: caseStudy2Value,
        case_study_3_score: caseStudy3Value,
        score: totalScore,
        all_questions_answered: concurso.exam_type === 'Certo ou Errado' ? true : Object.keys(answers).length === totalQuestionsInAnswerKey,
        updated_at: new Date().toISOString()
      };
      
      // Update the user_rankings record with the calculated scores
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update(scoreData)
        .eq('id', rankingId);
        
      if (updateError) throw updateError;
      
      // Invalidate rankings query
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      
      return { 
        totalCorrect, 
        totalQuestions, 
        totalScore,
        weightedBasicScore,
        weightedSpecificScore: weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
        weightedDiscursiveScore: combinedDiscursiveScore
      };
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
          is_specific_1: type === 'specific1',
          is_specific_2: type === 'specific2',
          is_specific_3: type === 'specific3',
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
          ? `Sua pontuação total: ${scoreResult.totalScore.toFixed(2)}. ${editsMessage}`
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
