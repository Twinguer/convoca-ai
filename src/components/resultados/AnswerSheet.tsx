
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, AlertTriangle, Check } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';

interface AnswerSheetProps {
  concurso: Concurso;
  rankingId: string;
  onSuccess: () => void;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({ concurso, rankingId, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' }>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch existing answers if any
  const { data: existingAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['user-answers', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', rankingId);
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Initialize answers from existing data
  useEffect(() => {
    if (existingAnswers?.length) {
      const answersMap: { [key: number]: string } = {};
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' } = {};
      
      existingAnswers.forEach((item: any) => {
        answersMap[item.question_number] = item.answer;
        typesMap[item.question_number] = item.is_basic_knowledge ? 'basic' : 'specific1';
      });
      
      setAnswers(answersMap);
      setQuestionType(typesMap);
    }
  }, [existingAnswers]);

  // Auto-assign question types based on concurso structure
  useEffect(() => {
    if (concurso && Object.keys(questionType).length === 0) {
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' } = {};
      let questionNumber = 1;
      
      // Basic knowledge questions
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      // Specific knowledge 1 questions
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      // Specific knowledge 2 questions
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      setQuestionType(typesMap);
    }
  }, [concurso]);

  const handleSaveAnswers = async () => {
    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);
    
    try {
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
      
      // Delete existing answers first
      await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
      
      // Insert new answers
      const { error } = await supabase
        .from('user_answers')
        .insert(upsertData);
        
      if (error) throw error;
      
      // Compare with answer key to calculate the score
      await calculateScore();

      toast({
        title: "Respostas salvas",
        description: "Suas respostas foram salvas com sucesso.",
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
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar suas respostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to calculate score by comparing with answer key
  const calculateScore = async () => {
    try {
      // Get official answer key
      const { data: answerKey, error: answerKeyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concurso.id);
        
      if (answerKeyError) throw answerKeyError;
      
      // Calculate score
      let basicKnowledgeScore = 0;
      let specificKnowledgeScore = 0;
      
      Object.entries(answers).forEach(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const officialAnswer = answerKey?.find(a => a.question_number === qNum);
        
        if (officialAnswer && officialAnswer.answer === answer.toUpperCase()) {
          if (officialAnswer.is_basic_knowledge) {
            basicKnowledgeScore++;
          } else {
            specificKnowledgeScore++;
          }
        }
      });
      
      // Calculate total score
      const totalScore = basicKnowledgeScore + specificKnowledgeScore;
      
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
    } catch (error) {
      console.error('Error calculating score:', error);
      throw error;
    }
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const getTotalQuestions = () => {
    if (!concurso) return 0;
    
    let total = 0;
    
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      total += concurso.basic_knowledge_questions;
    }
    
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      total += concurso.specific_knowledge_1_questions;
    }
    
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      total += concurso.specific_knowledge_2_questions;
    }
    
    return total;
  };

  // Generate question numbers for currently selected section
  const getSectionQuestions = () => {
    if (!concurso) return [];
    
    const questions: number[] = [];
    
    // Get all question numbers for the selected section
    Object.entries(questionType).forEach(([num, type]) => {
      if (
        (selectedSection === 'basic' && type === 'basic') ||
        (selectedSection === 'specific1' && type === 'specific1') ||
        (selectedSection === 'specific2' && type === 'specific2')
      ) {
        questions.push(parseInt(num));
      }
    });
    
    return questions.sort((a, b) => a - b);
  };

  const getOptionsForQuestion = (questionNumber: number) => {
    if (!concurso?.exam_type) return ['A', 'B', 'C', 'D', 'E'];
    
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    // For multiple choice, use the alternatives_count or default to 5
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, etc.
  };

  if (isLoadingAnswers) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Carregando cartão de respostas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartão de Respostas - {concurso.titulo}</CardTitle>
        <CardDescription>
          Preencha o cartão com suas respostas da prova. Suas respostas serão comparadas com o gabarito oficial para calcular sua pontuação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {savedSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Respostas salvas com sucesso! Calculando pontuação...</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">
              Total de questões: <span className="font-semibold">{getTotalQuestions()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tipo de prova: <span className="font-semibold">{concurso.exam_type}</span>
            </p>
          </div>
        </div>
        
        <div className="border p-3 rounded-md">
          <div className="mb-4">
            <p className="font-medium mb-2">Seções da Prova</p>
            <ToggleGroup type="single" value={selectedSection} onValueChange={(val) => val && setSelectedSection(val as any)}>
              {concurso.has_basic_knowledge && (
                <ToggleGroupItem value="basic" aria-label="Básicos">
                  Conhecimentos Básicos
                </ToggleGroupItem>
              )}
              {concurso.has_specific_knowledge_1 && (
                <ToggleGroupItem value="specific1" aria-label="Específicos 1">
                  Específicos 1
                </ToggleGroupItem>
              )}
              {concurso.has_specific_knowledge_2 && (
                <ToggleGroupItem value="specific2" aria-label="Específicos 2">
                  Específicos 2
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {getSectionQuestions().map((questionNumber) => (
              <div key={questionNumber} className="border p-3 rounded-md">
                <p className="font-semibold mb-2">Questão {questionNumber}</p>
                <div className="flex items-center justify-start gap-4">
                  {getOptionsForQuestion(questionNumber).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroup
                        value={answers[questionNumber] || ""}
                        onValueChange={(value) => handleAnswerChange(questionNumber, value)}
                        className="flex items-center space-x-1"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value={option} id={`q${questionNumber}-${option}`} />
                          <Label htmlFor={`q${questionNumber}-${option}`}>{option}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveAnswers} 
          className="flex items-center w-full" 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Respostas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
