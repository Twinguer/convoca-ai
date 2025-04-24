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

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
        isBasicKnowledge: parseInt(questionNumber) <= (concurso.basic_knowledge_questions || 0)
      }));

      await saveUserAnswers(rankingId, concurso.id, answersArray);

      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          discursive_score: discursiveScore || 0,
          case_study_1_score: caseStudy1Score || 0,
          case_study_2_score: caseStudy2Score || 0,
          case_study_3_score: caseStudy3Score || 0,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      if (updateError) throw updateError;

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
