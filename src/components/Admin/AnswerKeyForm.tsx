
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Check, AlertTriangle } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Concurso } from '@/types/concursos';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' }>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch concurso details to know the structure
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (error) throw error;
      return data as Concurso;
    },
  });

  // Fetch existing answer keys
  const { data: existingAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['answer-keys', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concursoId);
        
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
        
        if (item.is_basic_knowledge) {
          typesMap[item.question_number] = 'basic';
        } else if (item.is_specific_1) {
          typesMap[item.question_number] = 'specific1';
        } else if (item.is_specific_2) {
          typesMap[item.question_number] = 'specific2';
        }
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
    
    try {
      // Prepare batch data for upsert operation
      const upsertData = Object.entries(answers).map(([questionNumber, answer]) => {
        const questionNum = parseInt(questionNumber);
        const type = questionType[questionNum] || 'basic';
        
        return {
          concurso_id: concursoId,
          question_number: questionNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: type === 'basic',
          is_specific_1: type === 'specific1',
          is_specific_2: type === 'specific2',
          updated_at: new Date().toISOString()
        };
      });
      
      // Delete existing answers first
      await supabase
        .from('answer_keys')
        .delete()
        .eq('concurso_id', concursoId);
      
      // Insert new answers
      const { error } = await supabase
        .from('answer_keys')
        .insert(upsertData);
        
      if (error) throw error;
      
      toast({
        title: "Gabarito salvo",
        description: "O gabarito oficial foi salvo com sucesso.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['answer-keys', concursoId] });
    } catch (error: any) {
      console.error('Error saving answer keys:', error);
      setError(error.message || "Ocorreu um erro ao salvar o gabarito.");
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o gabarito. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  if (isLoadingConcurso || isLoadingAnswers) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Carregando gabarito...</p>
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Não foi possível carregar as informações do concurso.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - {concurso.titulo}</CardTitle>
        <CardDescription>
          Cadastre o gabarito oficial da prova. Este gabarito será usado para comparar as respostas dos participantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
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
          
          <Button 
            onClick={handleSaveAnswers} 
            className="flex items-center" 
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
                Salvar Gabarito
              </>
            )}
          </Button>
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
    </Card>
  );
};
