
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';

interface UseSaveAnswersProps {
  rankingId: string;
  concurso: Concurso;
  answers: { [key: number]: string };
  questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' };
  setIsSaving: (value: boolean) => void;
  setError: (value: string | null) => void;
  setSavedSuccess: (value: boolean) => void;
  onSuccess: () => void;
  discursiveScore?: number | null;
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
  discursiveScore
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateAnswers = () => {
    // Get total expected questions count
    const totalQuestions = 
      (concurso.has_basic_knowledge ? concurso.basic_knowledge_questions || 0 : 0) +
      (concurso.has_specific_knowledge_1 ? concurso.specific_knowledge_1_questions || 0 : 0) +
      (concurso.has_specific_knowledge_2 ? concurso.specific_knowledge_2_questions || 0 : 0);
    
    // For multiple choice, all questions must be answered
    if (concurso.exam_type !== 'Certo ou Errado' && Object.keys(answers).length < totalQuestions) {
      return {
        valid: false,
        message: "Todas as questões devem ser respondidas para provas de múltipla escolha."
      };
    }
    
    return { valid: true };
  };

  const checkEditLimit = async () => {
    // Check if user has reached edit limit (3 times)
    const { data, error } = await supabase
      .from('user_rankings')
      .select('edit_count')
      .eq('id', rankingId)
      .single();
      
    if (error) throw error;
    
    const editCount = data?.edit_count || 0;
    
    if (editCount >= 3) {
      return {
        canEdit: false,
        message: "Você já atingiu o limite de 3 edições para este cartão de respostas."
      };
    }
    
    return { 
      canEdit: true, 
      editCount,
      remaining: 3 - editCount
    };
  };

  const calculateScore = async () => {
    try {
      // Get official answer key
      const { data: answerKey, error: answerKeyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);
        
      if (answerKeyError) throw answerKeyError;
      
      if (!answerKey || answerKey.length === 0) {
        console.log('No answer key found for this concurso');
        return; // Skip score calculation if no answer key is available
      }
      
      // Calculate score
      let basicKnowledgeScore = 0;
      let specificKnowledgeScore = 0;
      let totalCorrect = 0;
      let totalQuestions = 0;
      
      Object.entries(answers).forEach(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const officialAnswer = answerKey?.find(a => a.question_number === qNum);
        
        if (!officialAnswer) return; // Skip if no official answer found
        
        totalQuestions++;
        
        if (officialAnswer.answer.toUpperCase() === answer.toUpperCase()) {
          totalCorrect++;
          
          if (officialAnswer.is_basic_knowledge) {
            basicKnowledgeScore++;
          } else {
            specificKnowledgeScore++;
          }
        }
      });
      
      // Calculate total score
      const totalScore = basicKnowledgeScore + specificKnowledgeScore + (discursiveScore || 0);
      
      console.log(`Score calculation: ${totalCorrect}/${totalQuestions} correct (${totalScore} points)`);
      
      // Update the user_rankings record with the calculated scores
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          discursive_score: discursiveScore || 0,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);
        
      if (updateError) throw updateError;
      
      // Invalidate rankings query
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      
      return { totalCorrect, totalQuestions, totalScore };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  };

  const handleSaveAnswers = async () => {
    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);
    
    try {
      // For multiple choice exams, validate all questions are answered
      const validation = validateAnswers();
      if (!validation.valid) {
        setError(validation.message);
        setIsSaving(false);
        return;
      }
      
      // Check if user has reached edit limit
      const editCheck = await checkEditLimit();
      if (!editCheck.canEdit) {
        setError(editCheck.message);
        setIsSaving(false);
        return;
      }
      
      if (Object.keys(answers).length === 0) {
        setError("Você ainda não respondeu nenhuma questão. Por favor, responda ao menos uma questão antes de salvar.");
        setIsSaving(false);
        return;
      }
      
      // Prepare batch data for upsert operation
      const upsertData = Object.entries(answers).map(([questionNumber, answer]) => {
        const questionNum = parseInt(questionNumber);
        const type = questionType[questionNum] || 'basic';
        
        return {
          user_ranking_id: rankingId,
          question_number: questionNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: type === 'basic',
          updated_at: new Date().toISOString()
        };
      });
      
      console.log(`Saving ${upsertData.length} answers for ranking ${rankingId}`);
      
      // Delete existing answers first
      const { error: deleteError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
        
      if (deleteError) throw deleteError;
      
      // Insert new answers
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(upsertData);
        
      if (insertError) throw insertError;
      
      // Update edit count
      const newEditCount = (editCheck.editCount || 0) + 1;
      await supabase
        .from('user_rankings')
        .update({ edit_count: newEditCount })
        .eq('id', rankingId);
      
      // Compare with answer key to calculate the score
      const scoreResult = await calculateScore();

      const remainingEdits = 3 - newEditCount;
      const editMessage = remainingEdits > 0 
        ? `Você tem mais ${remainingEdits} edição(ões) disponível(is).` 
        : "Esta foi sua última edição permitida.";

      toast({
        title: "Respostas salvas com sucesso",
        description: scoreResult 
          ? `Você acertou ${scoreResult.totalCorrect} de ${scoreResult.totalQuestions} questões. ${editMessage}`
          : `Suas respostas foram salvas. O gabarito ainda não está disponível para calcular sua pontuação. ${editMessage}`,
      });
      
      setSavedSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-answers', rankingId] });
      
      // Navigate after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving answers:', error);
      setError(error.message || "Ocorreu um erro ao salvar suas respostas.");
      toast({
        title: "Erro ao salvar respostas",
        description: error.message || "Ocorreu um erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSaveAnswers };
};
