
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';
import { updateSectionTypeForConcurso } from '@/integrations/supabase/rankings/scoreCalculation';

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
  nullifiedQuestions?: Set<number>;
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
  nullifiedQuestions = new Set()
}: UseSaveAnswersProps) => {
  const { toast } = useToast();

  // Função para tentar salvar com tentativas em caso de erro de conexão
  const attemptSave = async (retries = 3, delay = 1000): Promise<any> => {
    try {
      // Preparar os dados de respostas para enviar - garantindo que questionNumber seja número
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber, 10),
        answer,
      }));
      
      // Adicionar todas as questões anuladas com uma resposta padrão (se ainda não existirem na lista de respostas)
      if (nullifiedQuestions && nullifiedQuestions.size > 0) {
        nullifiedQuestions.forEach(questionNumber => {
          // Verificar se a questão anulada já tem uma resposta
          if (!answers[questionNumber]) {
            // Adicionar uma resposta padrão para questões anuladas ("A" ou "C" dependendo do tipo de prova)
            const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
            answersArray.push({
              questionNumber,
              answer: defaultAnswer
            });
          }
        });
      }

      console.log('[useSaveAnswers] Iniciando salvamento via RPC', {
        rankingId, 
        concursoId: concurso.id,
        totalRespostas: answersArray.length,
        discursiveScore,
        editCount
      });

      // Certifique-se de que section_type esteja atualizado para este concurso
      const sectionTypeResult = await updateSectionTypeForConcurso(concurso.id);
      if (!sectionTypeResult.success) {
        console.warn('[useSaveAnswers] Aviso: Não foi possível atualizar section_type:', sectionTypeResult.error);
      }

      // Usar um timeout para a chamada RPC
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao salvar respostas')), 20000);
      });

      // Chamar a função RPC com timeout
      const rpcPromise = supabase.rpc('save_user_answers_and_calculate_scores', {
        p_ranking_id: rankingId,
        p_concurso_id: concurso.id,
        p_answers: answersArray,
        p_discursive_score: discursiveScore || 0,
        p_case_study_1_score: caseStudy1Score || 0,
        p_case_study_2_score: caseStudy2Score || 0,
        p_case_study_3_score: caseStudy3Score || 0,
        p_current_edit_count: editCount
      });

      // Usar Promise.race para implementar o timeout
      const { data, error } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('[useSaveAnswers] Erro na função RPC:', error);
        throw new Error(error.message || "Erro ao salvar respostas");
      }

      console.log('[useSaveAnswers] Resposta da função RPC:', data);

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar respostas");
      }
      
      return data;
    } catch (error: any) {
      console.error(`[useSaveAnswers] Erro na tentativa ${4 - retries}/3:`, error);
      if (retries <= 1) {
        throw error;
      }
      
      console.log(`[useSaveAnswers] Tentando novamente em ${delay}ms...`);
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      // Tentar novamente com uma tentativa a menos e delay maior
      return attemptSave(retries - 1, delay * 1.5);
    }
  };

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Tentar salvar com várias tentativas
      const data = await attemptSave();
      
      // Atualizar estado da UI
      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi recalculada.",
        duration: 5000
      });

      // Chamar callback de sucesso
      onSuccess();
    } catch (error: any) {
      console.error('[useSaveAnswers] Erro final ao salvar respostas:', error);
      setError(error.message || "Erro ao salvar respostas. Por favor, tente novamente.");
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar respostas. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSaveAnswers };
};
