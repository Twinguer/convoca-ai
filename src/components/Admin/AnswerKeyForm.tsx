
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Check, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [enableDiscursive, setEnableDiscursive] = useState(false);

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
      
      // Set initial discursive state based on concurso
      if (data) {
        setEnableDiscursive(data.has_discursive || false);
      }
      
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
    setSaveSuccess(false);
    
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
      
      // Update concurso to enable/disable discursive section
      await supabase
        .from('concursos')
        .update({
          has_discursive: enableDiscursive,
          updated_at: new Date().toISOString()
        })
        .eq('id', concursoId);
      
      toast({
        title: "Gabarito salvo",
        description: "O gabarito oficial foi salvo com sucesso.",
      });
      
      setSaveSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['answer-keys', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['concurso', concursoId] });
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

  const recalculateAllScores = async () => {
    setIsUpdating(true);
    setError(null);
    
    try {
      // Get all rankings for this concurso
      const { data: rankings, error: rankingsError } = await supabase
        .from('user_rankings')
        .select('id, user_id')
        .eq('concurso_id', concursoId);
        
      if (rankingsError) throw rankingsError;
      
      if (!rankings || rankings.length === 0) {
        toast({
          title: "Nenhum ranking encontrado",
          description: "Não há rankings de usuários para recalcular pontuações.",
        });
        return;
      }
      
      // Get the answer key
      const { data: answerKey, error: answerKeyError } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concursoId);
        
      if (answerKeyError) throw answerKeyError;
      
      if (!answerKey || answerKey.length === 0) {
        toast({
          title: "Gabarito não encontrado",
          description: "É necessário salvar o gabarito antes de recalcular as pontuações.",
          variant: "destructive",
        });
        return;
      }
      
      let updatedCount = 0;
      
      // Update each ranking
      for (const ranking of rankings) {
        try {
          // Get user answers
          const { data: userAnswers, error: answersError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_ranking_id', ranking.id);
            
          if (answersError) throw answersError;
          
          if (!userAnswers || userAnswers.length === 0) continue;
          
          // Calculate scores
          let basicKnowledgeScore = 0;
          let specificKnowledgeScore = 0;
          
          userAnswers.forEach((userAnswer) => {
            const officialAnswer = answerKey.find(a => a.question_number === userAnswer.question_number);
            
            if (officialAnswer && officialAnswer.answer.toUpperCase() === userAnswer.answer.toUpperCase()) {
              if (userAnswer.is_basic_knowledge) {
                basicKnowledgeScore++;
              } else {
                specificKnowledgeScore++;
              }
            }
          });
          
          // Get current discursive score if any
          const { data: currentRanking } = await supabase
            .from('user_rankings')
            .select('discursive_score')
            .eq('id', ranking.id)
            .single();
            
          const discursiveScore = currentRanking?.discursive_score || 0;
          
          // Calculate total score
          const totalScore = basicKnowledgeScore + specificKnowledgeScore + discursiveScore;
          
          // Update ranking
          await supabase
            .from('user_rankings')
            .update({
              basic_knowledge_score: basicKnowledgeScore,
              specific_knowledge_score: specificKnowledgeScore,
              score: totalScore,
              updated_at: new Date().toISOString()
            })
            .eq('id', ranking.id);
            
          updatedCount++;
        } catch (err) {
          console.error(`Error updating ranking ${ranking.id}:`, err);
          // Continue with other rankings
        }
      }
      
      toast({
        title: "Pontuações recalculadas",
        description: `Foram atualizadas as pontuações de ${updatedCount} usuários com base no novo gabarito.`,
      });
      
    } catch (error: any) {
      console.error('Error recalculating scores:', error);
      setError(error.message || "Ocorreu um erro ao recalcular as pontuações.");
      toast({
        title: "Erro ao recalcular",
        description: error.message || "Ocorreu um erro ao recalcular as pontuações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
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
  
  // Create chunks of questions for better display in a grid
  const createQuestionChunks = (questions: number[], chunkSize: number = 20) => {
    const chunks = [];
    for (let i = 0; i < questions.length; i += chunkSize) {
      chunks.push(questions.slice(i, i + chunkSize));
    }
    return chunks;
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
    <Card className="shadow-lg">
      <CardHeader className="bg-emerald-50">
        <CardTitle className="text-xl md:text-2xl">Gabarito Oficial - {concurso.titulo}</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Cadastre o gabarito oficial da prova. Este gabarito será usado para comparar as respostas dos participantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {saveSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Gabarito salvo com sucesso!</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <p className="text-sm font-medium">
              Total de questões: <span className="font-semibold">{getTotalQuestions()}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Tipo de prova: <span className="font-semibold">{concurso.exam_type || 'Alternativas'}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center text-emerald-600 text-sm">
              <HelpCircle className="h-4 w-4 mr-1" />
              <p className="hidden md:block">Clique nos círculos para marcar as respostas corretas</p>
              <p className="block md:hidden">Clique para marcar respostas</p>
            </div>
            
            <Button 
              onClick={handleSaveAnswers} 
              className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white" 
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar Gabarito
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md border">
          <Switch 
            id="enable-discursive" 
            checked={enableDiscursive} 
            onCheckedChange={setEnableDiscursive} 
          />
          <Label htmlFor="enable-discursive">Habilitar campo para Prova Discursiva / Estudo de Caso</Label>
        </div>
        
        <div className="border rounded-md">
          <div className="p-4 border-b bg-gray-50">
            <p className="font-medium mb-2">Seções da Prova</p>
            <ToggleGroup type="single" value={selectedSection} onValueChange={(val) => val && setSelectedSection(val as any)}>
              {concurso.has_basic_knowledge && (
                <ToggleGroupItem value="basic" aria-label="Básicos" className="text-sm">
                  Conhecimentos Básicos
                </ToggleGroupItem>
              )}
              {concurso.has_specific_knowledge_1 && (
                <ToggleGroupItem value="specific1" aria-label="Específicos 1" className="text-sm">
                  Específicos 1
                </ToggleGroupItem>
              )}
              {concurso.has_specific_knowledge_2 && (
                <ToggleGroupItem value="specific2" aria-label="Específicos 2" className="text-sm">
                  Específicos 2
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          </div>
          
          {/* Tabular answer key format similar to the example image */}
          <div className="p-2 md:p-4">
            {createQuestionChunks(getSectionQuestions(), 20).map((questionChunk, chunkIndex) => (
              <div key={chunkIndex} className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {questionChunk.map(questionNumber => (
                          <th key={questionNumber} className="border border-gray-300 p-1 md:p-2 text-center bg-emerald-900 text-white text-xs md:text-sm">
                            {questionNumber}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {questionChunk.map(questionNumber => (
                          <td key={questionNumber} className="border border-gray-300 p-1 md:p-2 text-center bg-white">
                            <div className="flex flex-col items-center space-y-1">
                              {getOptionsForQuestion(questionNumber).map((option) => (
                                <div 
                                  key={option} 
                                  className={`
                                    w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center cursor-pointer text-xs md:text-sm
                                    ${answers[questionNumber] === option ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
                                    transition-colors
                                  `}
                                  onClick={() => handleAnswerChange(questionNumber, option)}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={recalculateAllScores} 
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalcular pontuações de todos os usuários
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            Isso atualizará as pontuações dos usuários com base no gabarito atualizado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
