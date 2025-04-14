
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
  editCount?: number;
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
  editCount = 0
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateAnswers = (): boolean => {
    // For "Alternativas" type exams, all questions must be answered
    if (concurso.exam_type !== 'Certo ou Errado') {
      const totalQuestions = (concurso.basic_knowledge_questions || 0) +
                             (concurso.specific_knowledge_1_questions || 0) +
                             (concurso.specific_knowledge_2_questions || 0);
      
      // Check if all questions have answers
      if (Object.keys(answers).length < totalQuestions) {
        setError("Você precisa responder a todas as questões antes de salvar.");
        return false;
      }
    }
    
    // Check if user has reached the edit limit (3 times)
    if (editCount >= 3) {
      setError("Você já atingiu o limite de 3 edições para este cartão de respostas.");
      return false;
    }
    
    return true;
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
      
      // First count the total questions from the answer key
      const totalQuestionsInAnswerKey = answerKey.length;
      
      // For each question in the answer key, check if the user answered it correctly
      answerKey.forEach(officialAnswer => {
        totalQuestions++;
        const questionNumber = officialAnswer.question_number;
        const userAnswer = answers[questionNumber];
        
        // Skip score calculation for blank answers in Certo ou Errado exam type
        if (concurso.exam_type === 'Certo ou Errado' && !userAnswer) {
          // No points added or subtracted for blank answers
          return;
        }
        
        // Check for correct answer
        if (userAnswer && officialAnswer.answer.toUpperCase() === userAnswer.toUpperCase()) {
          totalCorrect++;
          
          if (officialAnswer.is_basic_knowledge) {
            basicKnowledgeScore++;
          } else {
            specificKnowledgeScore++;
          }
        } else if (concurso.exam_type === 'Certo ou Errado' && userAnswer && concurso.wrong_answer_penalty) {
          // Apply penalty for wrong answers in "Certo ou Errado" type exams
          // Only if the answer is provided (not blank)
          if (officialAnswer.is_basic_knowledge) {
            basicKnowledgeScore -= concurso.wrong_answer_penalty;
          } else {
            specificKnowledgeScore -= concurso.wrong_answer_penalty;
          }
        }
      });
      
      // Calculate total score with weights
      const weightedBasicScore = basicKnowledgeScore * (concurso.basic_knowledge_weight || 1);
      const weightedSpecificScore = specificKnowledgeScore * (concurso.specific_knowledge_weight || 1);
      
      // Include discursive score if provided and the exam has discursive component
      const weightedDiscursiveScore = concurso.has_discursive && discursiveScore !== undefined && discursiveScore !== null
        ? discursiveScore * (concurso.discursive_weight || 1)
        : 0;
      
      // Calculate final total score
      const totalScore = weightedBasicScore + weightedSpecificScore + weightedDiscursiveScore;
      
      console.log(`Score calculation: ${totalCorrect}/${totalQuestions} correct (${totalScore} points)`);
      console.log(`Basic: ${basicKnowledgeScore}, Specific: ${specificKnowledgeScore}, Discursive: ${discursiveScore || 0}`);
      
      // Update the user_rankings record with the calculated scores
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          discursive_score: discursiveScore || 0,
          score: totalScore,
          all_questions_answered: concurso.exam_type === 'Certo ou Errado' ? true : Object.keys(answers).length === totalQuestionsInAnswerKey,
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
      // For "Alternativas" type exams, you must answer at least one question
      if (concurso.exam_type !== 'Certo ou Errado' && Object.keys(answers).length === 0) {
        setError("Você ainda não respondeu nenhuma questão. Por favor, responda ao menos uma questão antes de salvar.");
        setIsSaving(false);
        return;
      }
      
      // Check answer validation based on exam type
      if (!validateAnswers()) {
        setIsSaving(false);
        return;
      }
      
      // Get current edit count from database
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('edit_count')
        .eq('id', rankingId)
        .single();
        
      if (rankingError) throw rankingError;
      
      // Check if user can edit more
      if (rankingData && rankingData.edit_count >= 3) {
        setError("Você já atingiu o limite de 3 edições para este cartão de respostas.");
        setIsSaving(false);
        return;
      }
      
      // Prepare batch data for upsert operation - only for answered questions
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
      
      // Only insert new answers if there are any (for C/E, might be all blank)
      if (upsertData.length > 0) {
        const { error: insertError } = await supabase
          .from('user_answers')
          .insert(upsertData);
          
        if (insertError) throw insertError;
      }
      
      // Compare with answer key to calculate the score
      const scoreResult = await calculateScore();
      
      // Get updated edit count
      const { data: updatedRankingData, error: updatedRankingError } = await supabase
        .from('user_rankings')
        .select('edit_count')
        .eq('id', rankingId)
        .single();
        
      if (updatedRankingError) throw updatedRankingError;
      
      const editsLeft = 3 - (updatedRankingData?.edit_count || 0);
      const editsMessage = editsLeft > 0 
        ? `Você ainda pode editar este cartão mais ${editsLeft} ${editsLeft === 1 ? 'vez' : 'vezes'}.` 
        : 'Esta foi sua última edição permitida.';

      toast({
        title: "Respostas salvas com sucesso",
        description: scoreResult 
          ? `Você acertou ${scoreResult.totalCorrect} de ${scoreResult.totalQuestions} questões. ${editsMessage}`
          : `Suas respostas foram salvas. O gabarito ainda não está disponível para calcular sua pontuação. ${editsMessage}`,
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
