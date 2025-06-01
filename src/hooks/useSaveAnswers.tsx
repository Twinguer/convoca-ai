
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';

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
  selectedBookletId?: string; // Novo parâmetro para o caderno selecionado
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
  nullifiedQuestions = new Set(),
  selectedBookletId
}: UseSaveAnswersProps) => {
  const { toast } = useToast();

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Verificar se o usuário já atingiu o limite de edições (agora 5)
      if (editCount >= 5) {
        setError("Você já atingiu o limite de 5 edições permitidas para este cartão de respostas.");
        return;
      }

      // Verificar se um caderno foi selecionado
      if (!selectedBookletId) {
        setError("É necessário selecionar um caderno de prova antes de salvar as respostas.");
        return;
      }

      // Preparar os dados de respostas para enviar - garantindo que questionNumber seja número
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber, 10);
        const sectionType = getSectionTypeForQuestion(concurso, qNum);
        
        return {
          questionNumber: qNum,
          answer,
          sectionType,
          bookletId: selectedBookletId // Adicionar o ID do caderno
        };
      });
      
      // Adicionar todas as questões anuladas com uma resposta padrão (se ainda não existirem na lista de respostas)
      if (nullifiedQuestions && nullifiedQuestions.size > 0) {
        nullifiedQuestions.forEach(questionNumber => {
          // Verificar se a questão anulada já tem uma resposta
          if (!answers[questionNumber]) {
            // Adicionar uma resposta padrão para questões anuladas ("A" ou "C" dependendo do tipo de prova)
            const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
            const sectionType = getSectionTypeForQuestion(concurso, questionNumber);
            
            answersArray.push({
              questionNumber,
              answer: defaultAnswer,
              sectionType,
              bookletId: selectedBookletId
            });
          }
        });
      }

      console.log('[useSaveAnswers] Iniciando salvamento via RPC');
      console.log('[useSaveAnswers] Total de respostas:', answersArray.length);
      console.log('[useSaveAnswers] Caderno selecionado:', selectedBookletId);
      console.log('[useSaveAnswers] Estrutura das respostas:', answersArray.slice(0, 3));

      // Chamar a função RPC centralizada
      const { data, error } = await supabase.rpc('save_user_answers_with_booklet', {
        p_ranking_id: rankingId,
        p_concurso_id: concurso.id,
        p_booklet_id: selectedBookletId,
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
