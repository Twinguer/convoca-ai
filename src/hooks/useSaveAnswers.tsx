
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
}

export const useSaveAnswers = ({
  rankingId,
  concurso,
  answers,
  questionType,
  setIsSaving,
  setError,
  setSavedSuccess,
  onSuccess
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        totalQuestions++;
        
        if (officialAnswer && officialAnswer.answer.toUpperCase() === answer.toUpperCase()) {
          totalCorrect++;
          
          if (officialAnswer.is_basic_knowledge) {
            basicKnowledgeScore++;
          } else {
            specificKnowledgeScore++;
          }
        }
      });
      
      // Calculate total score
      const totalScore = basicKnowledgeScore + specificKnowledgeScore;
      
      console.log(`Score calculation: ${totalCorrect}/${totalQuestions} correct (${totalScore} points)`);
      
      // Update the user_rankings record with the calculated scores
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
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
      
      // Compare with answer key to calculate the score
      const scoreResult = await calculateScore();

      toast({
        title: "Respostas salvas com sucesso",
        description: scoreResult 
          ? `Você acertou ${scoreResult.totalCorrect} de ${scoreResult.totalQuestions} questões.`
          : "Suas respostas foram salvas. O gabarito ainda não está disponível para calcular sua pontuação.",
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
