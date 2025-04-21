
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

      console.log('Preparando respostas para salvamento:', {
        rankingId,
        concursoId: concurso.id,
        respostasCount: Object.keys(answers).length,
        editCount: editCount
      });

      // Prepara as respostas no formato esperado pela API
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        // Determina a seção da questão
        const qNum = parseInt(questionNumber);
        const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
        
        return {
          questionNumber: qNum,
          answer,
          isBasicKnowledge: qNum <= basicQuestionsCount
        };
      });

      // Atualizar pontuações subjetivas brutas (sem aplicar pesos ainda)
      await supabase
        .from('user_rankings')
        .update({
          discursive_score: discursiveScore || 0,
          case_study_1_score: caseStudy1Score || 0,
          case_study_2_score: caseStudy2Score || 0,
          case_study_3_score: caseStudy3Score || 0,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      console.log('Iniciando fluxo de salvamento e cálculo');
      
      // Salvar respostas e calcular pontuações (tanto brutas quanto ponderadas)
      const result = await saveUserAnswers(rankingId, concurso.id, answersArray);

      console.log('Resultado do salvamento e cálculo de pontuação:', result);

      // Atualizar UI
      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi calculada corretamente."
      });

      // Chamar callback de sucesso
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar respostas:', error);
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
