
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useToast } from '@/components/ui/use-toast';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
  questionType: 'Alternativas' | 'Certo ou Errado';
  setIsSaving: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSavedSuccess: (value: boolean) => void;
  onSuccess: () => void;
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  editCount?: number;
  nullifiedQuestions?: Set<number>;
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
  discursiveScore = null,
  caseStudy1Score = null,
  caseStudy2Score = null,
  caseStudy3Score = null,
  editCount = 0,
  nullifiedQuestions = new Set<number>()
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  
  const handleSaveAnswers = async () => {
    if (!rankingId || !concurso?.id) {
      setError("ID do concurso ou do ranking não encontrado");
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      setProgress(0);
      
      // Deletar respostas existentes
      const { error: deleteError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
        
      if (deleteError) throw deleteError;
      
      setProgress(20);
      
      // Preparar respostas para inserção
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const sectionType = getSectionTypeForQuestion(qNum);
        
        return {
          user_ranking_id: rankingId,
          question_number: qNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: sectionType === 'basic',
          is_specific_1: sectionType === 'specific1',
          is_specific_2: sectionType === 'specific2',
          is_specific_3: sectionType === 'specific3',
          is_nullified: nullifiedQuestions.has(qNum) // Incluindo informação de anulação
        };
      });
      
      // Adicionar as questões anuladas que não possuem respostas
      nullifiedQuestions.forEach(qNum => {
        if (!answers[qNum]) {
          const sectionType = getSectionTypeForQuestion(qNum);
          const defaultAnswer = questionType === 'Certo ou Errado' ? 'C' : 'A';
          
          answersArray.push({
            user_ranking_id: rankingId,
            question_number: qNum,
            answer: defaultAnswer,
            is_basic_knowledge: sectionType === 'basic',
            is_specific_1: sectionType === 'specific1',
            is_specific_2: sectionType === 'specific2', 
            is_specific_3: sectionType === 'specific3',
            is_nullified: true
          });
        }
      });
      
      setProgress(40);
      
      // Inserir novas respostas
      if (answersArray.length > 0) {
        const { error: insertError } = await supabase
          .from('user_answers')
          .insert(answersArray);
          
        if (insertError) throw insertError;
      }
      
      setProgress(60);
      
      // Atualizar pontuações de discursivas
      const updatedRanking: any = {
        edit_count: editCount + 1,
        all_questions_answered: true,
        updated_at: new Date().toISOString()
      };
      
      if (discursiveScore !== null && discursiveScore !== undefined) {
        updatedRanking.discursive_score = discursiveScore;
      }
      
      if (caseStudy1Score !== null && caseStudy1Score !== undefined) {
        updatedRanking.case_study_1_score = caseStudy1Score;
      }
      
      if (caseStudy2Score !== null && caseStudy2Score !== undefined) {
        updatedRanking.case_study_2_score = caseStudy2Score;
      }
      
      if (caseStudy3Score !== null && caseStudy3Score !== undefined) {
        updatedRanking.case_study_3_score = caseStudy3Score;
      }
      
      setProgress(80);
      
      // Atualizar o ranking do usuário
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update(updatedRanking)
        .eq('id', rankingId);
        
      if (updateError) throw updateError;
      
      setProgress(100);
      
      // Calcular e atualizar pontuações
      const { data: { user } } = await supabase.auth.getUser();
      
      const answersForCalculation = answersArray.map(a => ({
        question_number: a.question_number,
        answer: a.answer,
        isBasicKnowledge: a.is_basic_knowledge,
        isNullified: a.is_nullified // Incluindo informação de anulação para cálculo
      }));
      
      // Obter gabarito oficial deste concurso
      const { data: officialsAnswerKeys, error: officialKeysError } = await supabase
        .from('answer_keys')
        .select('question_number, answer')
        .eq('concurso_id', concurso.id);
      
      if (officialKeysError) throw officialKeysError;
      
      // Calcular pontuação (processo simplificado)
      calculateAndUpdateScore(answersForCalculation, officialsAnswerKeys);
      
      // Processo completo com sucesso
      setSavedSuccess(true);
      
      setTimeout(() => {
        setIsSaving(false);
        onSuccess();
        toast({
          title: "Respostas salvas com sucesso",
          description: "Suas respostas foram salvas e sua pontuação será calculada.",
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error saving answers:', error);
      setIsSaving(false);
      setError(error.message || "Erro ao salvar respostas");
    }
  };
  
  // Função auxiliar para determinar o tipo de seção com base no número da questão
  const getSectionTypeForQuestion = (questionNumber: number): 'basic' | 'specific1' | 'specific2' | 'specific3' => {
    let offset = 0;
    
    if (concurso.has_basic_knowledge && questionNumber <= (concurso.basic_knowledge_questions || 0)) {
      return 'basic';
    }
    
    offset += concurso.basic_knowledge_questions || 0;
    
    if (concurso.has_specific_knowledge_1 && questionNumber <= offset + (concurso.specific_knowledge_1_questions || 0)) {
      return 'specific1';
    }
    
    offset += concurso.specific_knowledge_1_questions || 0;
    
    if (concurso.has_specific_knowledge_2 && questionNumber <= offset + (concurso.specific_knowledge_2_questions || 0)) {
      return 'specific2';
    }
    
    return 'specific3';
  };
  
  // Função simplificada para calcular e atualizar a pontuação
  const calculateAndUpdateScore = async (
    userAnswers: { question_number: number; answer: string; isBasicKnowledge: boolean; isNullified: boolean }[],
    officialAnswers: any[]
  ) => {
    try {
      // Aqui simplificamos a lógica de cálculo
      // Na implementação real você deve usar a lógica completa de cálculo
      // que considere pesos, tipos de questões, etc.
      
      // Apenas para demonstração - na verdade usaremos a função RPC recalcular_all_user_scores
      const { error } = await supabase
        .rpc('recalculate_all_user_scores', { concurso_id: concurso.id });
        
      if (error) {
        console.error('Error recalculating scores:', error);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
    }
  };
  
  return {
    handleSaveAnswers,
    progress
  };
};
