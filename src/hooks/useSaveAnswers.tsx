
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
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
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Esta função prepara os dados das respostas para serem salvos no banco
  const prepareAnswersForSaving = () => {
    const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
    const specific1QuestionsCount = concurso.specific_knowledge_1_questions || 0;
    const specific2QuestionsCount = concurso.specific_knowledge_2_questions || 0;
    
    return Object.entries(answers).map(([questionNumber, answer]) => {
      const qNum = parseInt(questionNumber);
      
      // Determina a qual tipo de conhecimento a questão pertence
      let isBasicKnowledge = false;
      let isSpecific1 = false;
      let isSpecific2 = false;
      let isSpecific3 = false;
      
      if (qNum <= basicQuestionsCount) {
        isBasicKnowledge = true;
      } else if (qNum <= (basicQuestionsCount + specific1QuestionsCount)) {
        isSpecific1 = true;
      } else if (qNum <= (basicQuestionsCount + specific1QuestionsCount + specific2QuestionsCount)) {
        isSpecific2 = true;
      } else {
        isSpecific3 = true;
      }

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer,
        is_basic_knowledge: isBasicKnowledge,
        is_specific_1: isSpecific1,
        is_specific_2: isSpecific2,
        is_specific_3: isSpecific3
      };
    });
  };

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      setProcessingStatus('processing');
      
      console.log('Iniciando salvamento de respostas para ranking:', rankingId);
      console.log('Quantidade de respostas:', Object.keys(answers).length);
      
      // 1. Verificar dados preenchidos
      if (Object.keys(answers).length === 0) {
        throw new Error('Nenhuma resposta fornecida para salvar');
      }
      
      // 2. Preparar os dados para salvar
      const answerData = prepareAnswersForSaving();
      
      // 3. Registrar o histórico de edição antes de salvar (se for uma edição)
      if (editCount > 0) {
        const { data: previousData, error: fetchError } = await supabase
          .from('user_rankings')
          .select(`
            score, 
            basic_knowledge_score, 
            specific_knowledge_score,
            specific_knowledge_1_score,
            specific_knowledge_2_score,
            specific_knowledge_3_score,
            discursive_score,
            case_study_1_score,
            case_study_2_score,
            case_study_3_score
          `)
          .eq('id', rankingId)
          .single();
        
        if (fetchError) {
          console.error('Erro ao buscar dados anteriores:', fetchError);
        } else {
          console.log('Dados anteriores para histórico:', previousData);
          
          // O trigger que criamos vai adicionar esses dados ao histórico automaticamente
        }
      }
      
      // 4. Remover respostas anteriores (para garantir que não haja duplicação)
      const { error: deleteError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
      
      if (deleteError) {
        console.error('Erro ao excluir respostas anteriores:', deleteError);
        throw new Error(`Erro ao preparar para novas respostas: ${deleteError.message}`);
      }
      
      // 5. Inserir novas respostas
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(answerData);
      
      if (insertError) {
        console.error('Erro ao inserir novas respostas:', insertError);
        throw new Error(`Erro ao salvar respostas: ${insertError.message}`);
      }
      
      // 6. Atualizar informações sobre pontuações subjetivas e contagem de edições
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          discursive_score: discursiveScore || 0,
          case_study_1_score: caseStudy1Score || 0,
          case_study_2_score: caseStudy2Score || 0,
          case_study_3_score: caseStudy3Score || 0,
          edit_count: editCount + 1,
          all_questions_answered: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);
      
      if (updateError) {
        console.error('Erro ao atualizar ranking:', updateError);
        throw new Error(`Erro ao atualizar informações do ranking: ${updateError.message}`);
      }
      
      // 7. Chamar a API para recálculo de pontuação com base nas novas respostas
      // Importação dinâmica para evitar ciclos de dependência
      const { saveUserAnswers } = await import('@/integrations/supabase/rankings/userAnswers');
      const result = await saveUserAnswers(rankingId, concurso.id, answerData);
      
      if (!result || !result.success) {
        throw new Error('Erro no cálculo final da pontuação');
      }
      
      // 8. Registrar o log de cálculo
      await supabase
        .from('score_calculation_logs')
        .insert({
          user_ranking_id: rankingId,
          calculation_type: editCount > 0 ? 'edit' : 'creation',
          previous_score: 0, // Aqui poderíamos buscar a pontuação anterior, mas já temos o trigger para o histórico
          new_score: result.totalScore || 0,
          calculation_details: {
            ...result,
            answer_count: answerData.length,
            calculation_time: new Date().toISOString()
          }
        });
      
      // Finalizar o processo com sucesso
      setSavedSuccess(true);
      setProcessingStatus('success');
      
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi calculada e seu ranking foi atualizado.",
        duration: 5000
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Erro completo ao salvar respostas:', error);
      setError(error.message || "Erro desconhecido ao salvar respostas");
      setProcessingStatus('error');
      
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar suas respostas. Por favor, tente novamente.",
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { 
    handleSaveAnswers,
    processingStatus
  };
};
