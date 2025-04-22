
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { answerSavingService } from '@/services/answerSavingService';

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
      // Atualizar estados de UI
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Verificação do limite de edições
      if (editCount >= 5) {
        throw new Error("Você atingiu o limite de 5 edições permitidas");
      }

      // Transformar objeto de respostas em array para API
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => ({
        questionNumber: parseInt(questionNumber),
        answer,
      }));

      console.log('[useSaveAnswers] Preparando para salvar respostas:', {
        totalRespostas: answersArray.length,
        concursoId: concurso.id,
        rankingId
      });

      // Chamar serviço para salvar respostas
      const result = await answerSavingService.saveAnswersAndCalculateScores({
        rankingId,
        concursoId: concurso.id,
        answers: answersArray,
        discursiveScore: discursiveScore || 0,
        caseStudy1Score: caseStudy1Score || 0,
        caseStudy2Score: caseStudy2Score || 0,
        caseStudy3Score: caseStudy3Score || 0,
        currentEditCount: editCount
      });

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar respostas");
      }

      // Invalidar caches relevantes
      console.log('[useSaveAnswers] Invalidando caches para forçar atualização de dados');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-ranking-detail', rankingId] }),
        queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] }),
        queryClient.invalidateQueries({ queryKey: ['participating', concurso.id] })
      ]);

      // Atualizar UI com sucesso
      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi recalculada com base no gabarito atual, incluindo as questões anuladas.",
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
