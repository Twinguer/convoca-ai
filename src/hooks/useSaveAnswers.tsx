
import { saveUserAnswers } from '@/integrations/supabase/rankings/userAnswers';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
  questionType: 'Alternativas' | 'Certo ou Errado';
  setIsSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setSavedSuccess: (success: boolean) => void;
  onSuccess: () => void;
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  editCount: number;
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
  editCount
}: UseSaveAnswersProps) => {
  const { toast } = useToast();

  const calculateTotalQuestions = () => {
    let total = 0;
    if (concurso.has_basic_knowledge) total += concurso.basic_knowledge_questions || 0;
    if (concurso.has_specific_knowledge_1) total += concurso.specific_knowledge_1_questions || 0;
    if (concurso.has_specific_knowledge_2) total += concurso.specific_knowledge_2_questions || 0;
    if (concurso.has_specific_knowledge_3) total += concurso.specific_knowledge_3_questions || 0;
    return total;
  };

  const validateAnswers = () => {
    const totalQuestions = calculateTotalQuestions();
    const answeredQuestions = Object.keys(answers).length;

    // For "Alternativas" type, all questions must be answered
    if (questionType === 'Alternativas' && answeredQuestions < totalQuestions) {
      throw new Error(`Todas as questões devem ser respondidas! (${answeredQuestions}/${totalQuestions})`);
    }
  };

  const calculateScore = async () => {
    try {
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
        const specific1QuestionsCount = concurso.specific_knowledge_1_questions || 0;
        const specific2QuestionsCount = concurso.specific_knowledge_2_questions || 0;

        return {
          questionNumber: qNum,
          answer: answer.toUpperCase(), // Ensure answers are uppercase
          isBasicKnowledge: qNum <= basicQuestionsCount,
          isSpecific1: qNum > basicQuestionsCount && qNum <= (basicQuestionsCount + specific1QuestionsCount),
          isSpecific2: qNum > (basicQuestionsCount + specific1QuestionsCount) && 
                     qNum <= (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount),
          isSpecific3: qNum > (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount)
        };
      });

      const { data: answerKey, error: keyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);

      if (keyError) throw keyError;

      // Raw score (number of correct answers)
      let basicScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;

      // Count correctly answered questions
      answersArray.forEach(userAnswer => {
        const officialAnswer = answerKey.find(
          a => a.question_number === userAnswer.questionNumber
        );

        if (officialAnswer && officialAnswer.answer === userAnswer.answer) {
          if (userAnswer.isBasicKnowledge) {
            basicScore += 1;
          } else if (userAnswer.isSpecific1) {
            specific1Score += 1;
          } else if (userAnswer.isSpecific2) {
            specific2Score += 1;
          } else if (userAnswer.isSpecific3) {
            specific3Score += 1;
          }
        }
      });

      console.log("Scores before applying weights:", {
        basicScore,
        specific1Score,
        specific2Score,
        specific3Score
      });

      // Apply weights to raw scores (this is the key change)
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;

      // Calculate weighted scores for objective sections
      const weightedBasicScore = basicScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;

      console.log("Weights applied:", {
        basicWeight,
        specific1Weight,
        specific2Weight,
        specific3Weight
      });

      console.log("Weighted scores:", {
        weightedBasicScore,
        weightedSpecific1Score,
        weightedSpecific2Score,
        weightedSpecific3Score
      });

      // Discursive and case study scores (these do not have weights)
      const discursiveValue = discursiveScore || 0;
      const caseStudy1Value = caseStudy1Score || 0;
      const caseStudy2Value = caseStudy2Score || 0;
      const caseStudy3Value = caseStudy3Score || 0;

      // Calculate total score using the formula:
      // (C.Bas x Peso) + (C.Esp1 x Peso) + (C.Esp2 x Peso) + (C.Esp3 x Peso) + Discursiva + Est. Caso1 + Est. Caso2 + Est. Caso3
      const totalScore = weightedBasicScore + weightedSpecific1Score + 
                         weightedSpecific2Score + weightedSpecific3Score +
                         discursiveValue + caseStudy1Value +
                         caseStudy2Value + caseStudy3Value;

      console.log("Final total score:", totalScore);

      return {
        basic_knowledge_score: basicScore,
        specific_knowledge_1_score: specific1Score,
        specific_knowledge_2_score: specific2Score,
        specific_knowledge_3_score: specific3Score,
        discursive_score: discursiveValue,
        case_study_1_score: caseStudy1Value,
        case_study_2_score: caseStudy2Value,
        case_study_3_score: caseStudy3Value,
        score: totalScore
      };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  };

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Validate answers before saving
      validateAnswers();

      const scoreDetails = await calculateScore();

      const { error } = await supabase
        .from('user_rankings')
        .update({
          ...scoreDetails,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      if (error) throw error;

      // Fix: Create the proper answersArray with isBasicKnowledge property for saveUserAnswers
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
        
        return {
          questionNumber: qNum,
          answer: answer.toUpperCase(),
          isBasicKnowledge: qNum <= basicQuestionsCount
        };
      });
      
      await saveUserAnswers(rankingId, concurso.id, answersArray);

      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi calculada com sucesso."
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving answers:', error);
      setError(error.message || "Erro ao salvar respostas");
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSaveAnswers };
};
