
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';

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

  const handleSaveAnswers = async () => {
    try {
      console.log('[useSaveAnswers] Iniciando salvamento de respostas');
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Verificar limite de edições
      if (editCount >= 5) {
        console.error('[useSaveAnswers] Limite de edições atingido:', editCount);
        throw new Error("Você atingiu o limite de 5 edições permitidas");
      }
      
      // Obter questões anuladas para considerar na validação
      const { data: nullifiedData, error: nullifiedError } = await supabase
        .from('answer_keys')
        .select('question_number')
        .eq('concurso_id', concurso.id)
        .eq('is_nullified', true);
        
      if (nullifiedError) {
        console.error('[useSaveAnswers] Erro ao buscar questões anuladas:', nullifiedError);
        throw nullifiedError;
      }
      
      const nullifiedQuestions = new Set(nullifiedData?.map(item => item.question_number) || []);
      console.log('[useSaveAnswers] Questões anuladas encontradas:', Array.from(nullifiedQuestions));

      // Preparar os dados de respostas para enviar - incluindo respostas 
      // para questões anuladas mesmo que o usuário não tenha respondido
      const answersArray = [];
      
      // Primeiro, adicione todas as respostas que o usuário forneceu
      for (const [questionNumber, answer] of Object.entries(answers)) {
        answersArray.push({
          questionNumber: parseInt(questionNumber),
          answer,
        });
      }
      
      // Adicionar respostas "C" para questões anuladas não respondidas
      // Isso simplifica a lógica no backend e garante que tudo seja contabilizado corretamente
      const totalQuestions = 
        (concurso.has_basic_knowledge ? (concurso.basic_knowledge_questions || 0) : 0) +
        (concurso.has_specific_knowledge_1 ? (concurso.specific_knowledge_1_questions || 0) : 0) +
        (concurso.has_specific_knowledge_2 ? (concurso.specific_knowledge_2_questions || 0) : 0) +
        (concurso.has_specific_knowledge_3 ? (concurso.specific_knowledge_3_questions || 0) : 0);
        
      for (let i = 1; i <= totalQuestions; i++) {
        if (nullifiedQuestions.has(i) && !answers[i]) {
          // Para questões anuladas não respondidas, usamos uma resposta padrão
          // A resposta real não importa já que a questão está anulada
          const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
          
          answersArray.push({
            questionNumber: i,
            answer: defaultAnswer
          });
          
          console.log(`[useSaveAnswers] Adicionando resposta padrão ${defaultAnswer} para questão anulada ${i}`);
        }
      }

      console.log('[useSaveAnswers] Número de respostas a salvar:', answersArray.length);
      console.log('[useSaveAnswers] Pontuações subjetivas:',
        'Discursiva:', discursiveScore,
        'Estudo de Caso 1:', caseStudy1Score,
        'Estudo de Caso 2:', caseStudy2Score,
        'Estudo de Caso 3:', caseStudy3Score
      );

      if (answersArray.length === 0) {
        console.warn('[useSaveAnswers] Nenhuma resposta para salvar');
        toast({
          title: "Atenção",
          description: "Nenhuma resposta para salvar. Por favor, responda pelo menos uma questão.",
          variant: "destructive"
        });
        return;
      }

      // Chamar a função RPC centralizada
      console.log('[useSaveAnswers] Chamando função RPC para salvar respostas e calcular pontuações');
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
        console.error('[useSaveAnswers] RPC retornou erro:', data.error);
        throw new Error(data.error || "Erro ao salvar respostas");
      }

      // Atualizar estado da UI
      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi recalculada com base no gabarito atual, incluindo as questões anuladas.",
        duration: 5000
      });

      console.log('[useSaveAnswers] Salvamento concluído com sucesso');
      
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
