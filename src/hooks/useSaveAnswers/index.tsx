
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { UseSaveAnswersProps, SaveAnswersResponse } from './types';
import { validateSaveAnswers } from './validation';
import { prepareAnswersData } from './prepareData';

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
  nullifiedQuestions = new Set(),
  selectedBookletId
}: UseSaveAnswersProps) => {
  const { toast } = useToast();

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Validar dados de entrada
      const validation = validateSaveAnswers(editCount, selectedBookletId);
      if (!validation.isValid) {
        setError(validation.errorMessage!);
        return;
      }

      console.log('[useSaveAnswers] Preparando dados para salvamento');
      console.log('[useSaveAnswers] Respostas do usuário:', answers);
      console.log('[useSaveAnswers] Caderno selecionado:', selectedBookletId);
      console.log('[useSaveAnswers] Todos os parâmetros recebidos:', {
        rankingId,
        concursoId: concurso?.id,
        selectedBookletId,
        answersCount: Object.keys(answers).length,
        editCount
      });

      // Preparar dados das respostas
      const answersObject = prepareAnswersData(answers, concurso, nullifiedQuestions);

      console.log('[useSaveAnswers] Dados formatados para RPC:', answersObject);
      console.log('[useSaveAnswers] Total de respostas a salvar:', Object.keys(answersObject).length);

      // Garantir que selectedBookletId seja sempre string para a função RPC
      const bookletIdString = selectedBookletId ? String(selectedBookletId) : 'default';

      // Chamar a nova função RPC consolidada por concurso
      const { data, error } = await supabase.rpc('save_user_answers_consolidated_by_concurso', {
        p_ranking_id: rankingId,
        p_concurso_id: concurso.id,
        p_booklet_id: bookletIdString,
        p_answers: answersObject,
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

      console.log('[useSaveAnswers] Respostas salvas com sucesso:', data.saved_answers);
      console.log('[useSaveAnswers] Total de respostas salvas:', data.answers_saved);

      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: `${data.answers_saved} respostas foram salvas para o caderno selecionado.`,
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

export * from './types';
