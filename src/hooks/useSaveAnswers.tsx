
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

  const calculateScore = async () => {
    try {
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
        const specific1QuestionsCount = concurso.specific_knowledge_1_questions || 0;
        const specific2QuestionsCount = concurso.specific_knowledge_2_questions || 0;

        return {
          questionNumber: qNum,
          answer,
          isBasicKnowledge: qNum <= basicQuestionsCount,
          isSpecific1: qNum > basicQuestionsCount && qNum <= (basicQuestionsCount + specific1QuestionsCount),
          isSpecific2: qNum > (basicQuestionsCount + specific1QuestionsCount) && 
                       qNum <= (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount)
        };
      });

      const { data: answerKey, error: keyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);

      if (keyError) throw keyError;

      let basicScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;

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
          }
        }
      });

      // Apply weights to section scores
      const weightedBasicScore = (basicScore * (concurso.basic_knowledge_weight || 1));
      const weightedSpecific1Score = (specific1Score * (concurso.specific_knowledge_1_weight || 1));
      const weightedSpecific2Score = (specific2Score * (concurso.specific_knowledge_2_weight || 1));
      const weightedSpecific3Score = (specific3Score * (concurso.specific_knowledge_3_weight || 1));

      const discursiveWeightedScore = discursiveScore 
        ? (discursiveScore * (concurso.discursive_weight || 1)) 
        : 0;

      const caseStudy1WeightedScore = caseStudy1Score 
        ? (caseStudy1Score * (concurso.case_study_1_weight || 1)) 
        : 0;

      const caseStudy2WeightedScore = caseStudy2Score 
        ? (caseStudy2Score * (concurso.case_study_2_weight || 1)) 
        : 0;

      const caseStudy3WeightedScore = caseStudy3Score 
        ? (caseStudy3Score * (concurso.case_study_3_weight || 1)) 
        : 0;

      const totalScore = weightedBasicScore + weightedSpecific1Score + 
                         weightedSpecific2Score + weightedSpecific3Score +
                         discursiveWeightedScore + caseStudy1WeightedScore +
                         caseStudy2WeightedScore + caseStudy3WeightedScore;

      return {
        basic_knowledge_score: basicScore,
        specific_knowledge_1_score: specific1Score,
        specific_knowledge_2_score: specific2Score,
        specific_knowledge_3_score: specific3Score,
        discursive_score: discursiveScore || 0,
        case_study_1_score: caseStudy1Score || 0,
        case_study_2_score: caseStudy2Score || 0,
        case_study_3_score: caseStudy3Score || 0,
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

      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
        isBasicKnowledge: true  // Default, will be refined in calculation
      }));

      const scoreDetails = await calculateScore();

      const { error } = await supabase
        .from('user_rankings')
        .update({
          ...scoreDetails,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      if (error) throw error;

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
