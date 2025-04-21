
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
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
  const queryClient = useQueryClient();

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      if (editCount >= 5) {
        throw new Error("Você atingiu o limite de 5 edições permitidas");
      }

      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
      }));

      console.log('[useSaveAnswers] Iniciando salvamento via RPC');
      console.log('[useSaveAnswers] Pontuações subjetivas:',
        'Discursiva:', discursiveScore,
        'Estudo de Caso 1:', caseStudy1Score,
        'Estudo de Caso 2:', caseStudy2Score,
        'Estudo de Caso 3:', caseStudy3Score
      );
      console.log('[useSaveAnswers] Total de respostas:', answersArray.length);

      const { data, error } = await supabase.rpc('save_user_answers_and_calculate_scores', {
        p_ranking_id: rankingId,
        p_concurso_id: concurso.id,
        p_answers: answersArray,
        p_discursive_score: discursiveScore || 0,
        p_case_study_1_score: caseStudy1Score || 0,
        p_case_study_2_score: caseStudy2Score || 0,
        p_case_study_3_score: caseStudy3Score || 0,
        p_current_edit_count: editCount
      });

      if (error) {
        console.error('[useSaveAnswers] Erro na função RPC:', error);
        throw new Error(error.message || "Erro ao salvar respostas");
      }

      console.log('[useSaveAnswers] Resposta da função RPC:', data);

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar respostas");
      }

      // Invalidar caches relevantes para forçar recarregamento dos dados
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-ranking-detail', rankingId] }),
        queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] }),
        queryClient.invalidateQueries({ queryKey: ['participating', concurso.id] })
      ]);

      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi recalculada com base no gabarito atual, incluindo as questões anuladas.",
        duration: 5000
      });

      onSuccess();
    } catch (error: any) {
      console.error('[useSaveAnswers] Erro ao salvar respostas:', error);
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
