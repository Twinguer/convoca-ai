
import { saveUserAnswers } from '@/integrations/supabase/rankings/userAnswers';
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
  sectionScores: Record<string, number>; // Custom scores for evaluation sections
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
  sectionScores,
  editCount
}: UseSaveAnswersProps) => {
  const { toast } = useToast();

  const calculateScore = async () => {
    try {
      // We'll need both the exam sections and evaluation sections
      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select(`
          exam_sections (id, name, type, questions, weight),
          evaluation_sections (id, name, type, max_score)
        `)
        .eq('id', concurso.id)
        .single();
        
      if (concursoError) throw concursoError;
      
      const examSections = concursoData?.exam_sections || [];
      
      // Get answer key
      const { data: answerKey, error: keyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);

      if (keyError) throw keyError;
      
      // Determine which answer belongs to which section
      // We'll assign each answer to a section based on question number
      // First, sort sections by order and calculate question ranges
      let questionRanges: Array<{
        sectionId: string;
        sectionName: string;
        start: number;
        end: number;
        weight: number;
      }> = [];
      
      let startQuestion = 1;
      
      examSections.forEach(section => {
        const endQuestion = startQuestion + (section.questions - 1);
        questionRanges.push({
          sectionId: section.id,
          sectionName: section.name,
          start: startQuestion,
          end: endQuestion,
          weight: section.weight
        });
        startQuestion = endQuestion + 1;
      });
      
      // Calculate scores for each section
      const sectionRawScores: Record<string, number> = {};
      
      Object.entries(answers).forEach(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        
        // Find which section this question belongs to
        const section = questionRanges.find(
          range => qNum >= range.start && qNum <= range.end
        );
        
        if (section) {
          // Check if answer is correct
          const officialAnswer = answerKey?.find(
            a => a.question_number === qNum
          );
          
          if (officialAnswer && officialAnswer.answer === answer) {
            // If correct, increment section score
            sectionRawScores[section.sectionName] = 
              (sectionRawScores[section.sectionName] || 0) + 1;
          }
        }
      });
      
      // Apply weights to sections
      const weightedSectionScores: Record<string, number> = {};
      questionRanges.forEach(section => {
        const rawScore = sectionRawScores[section.sectionName] || 0;
        weightedSectionScores[section.sectionName] = rawScore * section.weight;
      });
      
      // Add evaluation section scores (from form input)
      const finalSectionScores = {
        ...weightedSectionScores,
        ...sectionScores
      };
      
      // Calculate total score as sum of all section scores
      const totalScore = Object.values(finalSectionScores).reduce(
        (sum, score) => sum + (score || 0), 0
      );
      
      return {
        score: totalScore,
        section_scores: finalSectionScores
      };
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  };

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Convert answers object to array format
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        return {
          questionNumber: qNum,
          answer,
          isBasicKnowledge: true // Default to true for backward compatibility
        };
      });

      const scoreDetails = await calculateScore();

      // Update the user_rankings record with the new score details
      const { error } = await supabase
        .from('user_rankings')
        .update({
          ...scoreDetails,
          edit_count: editCount + 1
        })
        .eq('id', rankingId);

      if (error) throw error;

      // Save user answers
      await saveUserAnswers(rankingId, concurso.id, answersArray);

      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: "Sua pontuação foi calculada com sucesso."
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving answers:', error);
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
