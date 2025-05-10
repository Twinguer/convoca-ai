
// Updating the useSaveAnswers hook to work with the updated database schema
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Concurso } from '@/types/concursos';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
  setIsSaving: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSavedSuccess: (value: boolean) => void;
  onSuccess: () => void;
  discursiveScore: number | null;
  caseStudy1Score: number | null;
  caseStudy2Score: number | null;
  caseStudy3Score: number | null;
  editCount: number;
  nullifiedQuestions: Set<number>;
}

export const useSaveAnswers = ({
  rankingId,
  concurso,
  answers,
  setIsSaving,
  setError,
  setSavedSuccess,
  onSuccess,
  discursiveScore,
  caseStudy1Score,
  caseStudy2Score,
  caseStudy3Score,
  editCount,
  nullifiedQuestions
}: UseSaveAnswersProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveAnswers = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      setIsSaving(true);
      setError(null);
      console.log('[useSaveAnswers] Saving answers for ranking ID:', rankingId);
      
      // Convert answers object to array of { questionNumber, answer } objects
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
      }));
      
      console.log('[useSaveAnswers] Answers to save:', answersArray);
      
      // Call the RPC function to save answers and calculate scores
      const { data, error } = await supabase
        .rpc('save_user_answers_and_calculate_scores', {
          p_ranking_id: rankingId,
          p_concurso_id: concurso.id,
          p_answers: JSON.stringify(answersArray),
          p_discursive_score: discursiveScore || 0,
          p_case_study_1_score: caseStudy1Score || 0,
          p_case_study_2_score: caseStudy2Score || 0,
          p_case_study_3_score: caseStudy3Score || 0,
          p_current_edit_count: editCount
        });
        
      if (error) {
        console.error('[useSaveAnswers] Error saving answers:', error);
        throw new Error(error.message);
      }
      
      // Check if the function returned success
      if (!data.success) {
        console.error('[useSaveAnswers] Function reported failure:', data);
        throw new Error(data.error || 'Falha ao salvar respostas.');
      }
      
      console.log('[useSaveAnswers] Answers saved successfully:', data);
      
      // Show success notification
      setSavedSuccess(true);
      
      // Call onSuccess callback (usually to update state in parent component)
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
      // Notify user of success
      toast({
        title: 'Respostas salvas com sucesso!',
        description: 'Suas respostas foram registradas e sua pontuação foi calculada.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('[useSaveAnswers] Error in handleSaveAnswers:', error);
      setError(error.message || 'Erro ao salvar respostas');
      
      toast({
        title: 'Erro ao salvar respostas',
        description: error.message || 'Ocorreu um erro ao salvar suas respostas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setIsSaving(false);
    }
  };

  return {
    handleSaveAnswers,
    isProcessing
  };
};
