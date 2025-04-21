
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

      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        // Determine if this question is in basic knowledge or specific knowledge sections
        const qNum = parseInt(questionNumber);
        const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
        
        return {
          questionNumber: qNum,
          answer,
          isBasicKnowledge: qNum <= basicQuestionsCount
        };
      });

      console.log('Salvando respostas do usuário:', answersArray);

      // Salvar respostas do usuário utilizando o método que agora vai gerenciar
      // toda a lógica de cálculo de pontuação no servidor
      await saveUserAnswers(rankingId, concurso.id, answersArray);

      // Apenas incrementar o contador de edições
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          edit_count: editCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);

      if (updateError) {
        console.error('Erro ao atualizar contador de edições:', updateError);
        throw updateError;
      }

      // Atualizar estado da UI
      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi recalculada."
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
