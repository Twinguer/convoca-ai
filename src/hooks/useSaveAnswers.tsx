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

  const getRawAnswersForProcessing = () => {
    const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
    const specific1QuestionsCount = concurso.specific_knowledge_1_questions || 0;
    const specific2QuestionsCount = concurso.specific_knowledge_2_questions || 0;
    return Object.entries(answers).map(([questionNumber, answer]) => {
      const qNum = parseInt(questionNumber);

      return {
        questionNumber: qNum,
        answer,
        isBasicKnowledge: qNum <= basicQuestionsCount,
        isSpecific1: qNum > basicQuestionsCount && qNum <= (basicQuestionsCount + specific1QuestionsCount),
        isSpecific2: qNum > (basicQuestionsCount + specific1QuestionsCount) && qNum <= (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount),
        isSpecific3: qNum > (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount)
      };
    });
  };

  const calculateScore = async (rawAnswersArray: any[]) => {
    try {
      const { data: answerKey, error: keyError } = await supabase
        .from('answer_keys')
        .select('*, is_nullified')
        .eq('concurso_id', concurso.id);

      if (keyError) throw keyError;

      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select(`
          basic_knowledge_weight,
          specific_knowledge_1_weight,
          specific_knowledge_2_weight,
          specific_knowledge_3_weight,
          specific_knowledge_weight,
          discursive_weight,
          case_study_1_weight,
          case_study_2_weight,
          case_study_3_weight
        `)
        .eq('id', concurso.id)
        .single();

      if (concursoError) throw concursoError;

      let basicScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;

      rawAnswersArray.forEach(userAnswer => {
        const officialAnswer = answerKey.find(
          a => a.question_number === userAnswer.questionNumber
        );

        if (officialAnswer && (officialAnswer.is_nullified || officialAnswer.answer === userAnswer.answer)) {
          if (userAnswer.isBasicKnowledge) {
            basicScore += 1;
          } else {
            const qNum = userAnswer.questionNumber;
            const b = concurso.basic_knowledge_questions || 0;
            const s1 = concurso.specific_knowledge_1_questions || 0;
            const s2 = concurso.specific_knowledge_2_questions || 0;

            if (qNum > b && qNum <= (b + s1)) specific1Score += 1;
            else if (qNum > (b + s1) && qNum <= (b + s1 + s2)) specific2Score += 1;
            else if (qNum > (b + s1 + s2)) specific3Score += 1;
          }
        }
      });

      const basicWeight = concursoData.basic_knowledge_weight || 1;
      const specific1Weight = concursoData.specific_knowledge_1_weight || 
                             concursoData.specific_knowledge_weight || 1;
      const specific2Weight = concursoData.specific_knowledge_2_weight || 1;
      const specific3Weight = concursoData.specific_knowledge_3_weight || 1;
      const discursiveWeight = concursoData.discursive_weight || 1;
      const caseStudy1Weight = concursoData.case_study_1_weight || 1;
      const caseStudy2Weight = concursoData.case_study_2_weight || 1;
      const caseStudy3Weight = concursoData.case_study_3_weight || 1;

      const weightedBasicScore = basicScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;

      const discursiveValue = (discursiveScore || 0) * discursiveWeight;
      const caseStudy1Value = (caseStudy1Score || 0) * caseStudy1Weight;
      const caseStudy2Value = (caseStudy2Score || 0) * caseStudy2Weight;
      const caseStudy3Value = (caseStudy3Score || 0) * caseStudy3Weight;

      const totalScore = weightedBasicScore + weightedSpecific1Score + 
                         weightedSpecific2Score + weightedSpecific3Score +
                         discursiveValue + caseStudy1Value +
                         caseStudy2Value + caseStudy3Value;

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

      const answersArray = getRawAnswersForProcessing();

      const scoreDetails = await calculateScore(answersArray);

      const { error } = await supabase
        .from('user_rankings')
        .update({
          ...scoreDetails,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      if (error) {
        console.error('Error updating user ranking:', error);
        throw error;
      }

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
