
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

      // Log detalhado dos parâmetros enviados para a RPC
      console.log('[useSaveAnswers] Iniciando chamada RPC com parâmetros:', {
        rankingId,
        concursoId: concurso.id,
        totalRespostas: answersArray.length,
        respostas: answersArray,
        notasSubjetivas: {
          discursive: discursiveScore,
          caseStudy1: caseStudy1Score,
          caseStudy2: caseStudy2Score,
          caseStudy3: caseStudy3Score
        },
        editCount
      });

      // Log do gabarito atual
      const { data: gabarito, error: gabaritoError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);

      if (gabaritoError) {
        console.error('[useSaveAnswers] Erro ao buscar gabarito:', gabaritoError);
      } else {
        console.log('[useSaveAnswers] Gabarito atual:', gabarito);
      }

      // Chamada RPC com log detalhado
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

      // Log do estado atual do ranking após salvamento
      const { data: rankingAtual, error: rankingError } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('id', rankingId)
        .single();

      if (rankingError) {
        console.error('[useSaveAnswers] Erro ao buscar ranking atualizado:', rankingError);
      } else {
        console.log('[useSaveAnswers] Estado do ranking após atualização:', rankingAtual);
      }

      // Invalidar caches relevantes para forçar recarregamento dos dados
      console.log('[useSaveAnswers] Invalidando caches...');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-ranking-detail', rankingId] }),
        queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] }),
        queryClient.invalidateQueries({ queryKey: ['participating', concurso.id] })
      ]);
      console.log('[useSaveAnswers] Caches invalidados com sucesso');

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
