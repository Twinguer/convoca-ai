
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();

  // Fetch concurso with exam sections
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso-details-with-sections', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*, exam_sections(*)')
        .eq('id', concursoId)
        .single();
        
      if (error) throw error;
      return data;
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
    if (existingAnswers && existingAnswers.length > 0) {
      const answersMap: { [key: number]: string } = {};
      
      existingAnswers.forEach((item: any) => {
        answersMap[item.question_number] = item.answer;
      });
      
      setAnswers(answersMap);
    }
  }, [existingAnswers]);

  // Set default selected section when data loads
  useEffect(() => {
    if (concurso?.exam_sections && concurso.exam_sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(concurso.exam_sections[0].id);
    }
  }, [concurso, selectedSectionId]);

  if (isLoadingConcurso || isLoadingAnswers) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-center text-gray-600">Carregando informações do gabarito...</p>
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-destructive space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Não foi possível carregar as informações do concurso.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get only the objective sections
  const objectiveSections = concurso.exam_sections || [];

  // If no sections defined yet
  if (objectiveSections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-amber-600 space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Você precisa definir a estrutura da prova antes de cadastrar o gabarito oficial.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get currently selected section
  const currentSection = objectiveSections.find(s => s.id === selectedSectionId);
  
  // Calculate question range for the current section
  const getQuestionsRange = () => {
    if (!currentSection) return [];
    
    // Find all sections that come before the current one to calculate question offset
    let questionOffset = 1; // Start from question 1
    
    for (const section of objectiveSections) {
      if (section.id === currentSection.id) break;
      questionOffset += section.questions;
    }
    
    // Generate the question numbers for this section
    return Array.from(
      { length: currentSection.questions }, 
      (_, i) => questionOffset + i
    );
  };

  const getOptionsForQuestion = () => {
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const createAnswerMatrix = () => {
    const questions = getQuestionsRange();
    if (questions.length === 0) return [];
    
    const QUESTIONS_PER_ROW = 4;
    const rows = Math.ceil(questions.length / QUESTIONS_PER_ROW);
    
    const matrix = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
        const index = row * QUESTIONS_PER_ROW + col;
        if (index < questions.length) {
          rowData.push(questions[index]);
        } else {
          rowData.push(null);
        }
      }
      matrix.push(rowData);
    }
    
    return matrix;
  };

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      
      const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        
        // Find which section this question belongs to
        // We need to calculate question ranges based on all section lengths
        let currentStartQuestion = 1;
        let questionSection = null;
        
        for (const section of objectiveSections) {
          const sectionEndQuestion = currentStartQuestion + section.questions - 1;
          
          if (qNum >= currentStartQuestion && qNum <= sectionEndQuestion) {
            questionSection = section;
            break;
          }
          
          currentStartQuestion = sectionEndQuestion + 1;
        }
        
        // For backward compatibility
        const isBasicKnowledge = questionSection?.type === 'basic';
        const isSpecific1 = questionSection?.type === 'specific' && 
                          questionSection === objectiveSections.find(s => s.type === 'specific');
        const isSpecific2 = questionSection?.type === 'specific' && 
                          questionSection !== objectiveSections.find(s => s.type === 'specific');
        
        return {
          concurso_id: concursoId,
          question_number: qNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: isBasicKnowledge,
          is_specific_1: isSpecific1,
          is_specific_2: isSpecific2
        };
      });
      
      // Delete existing answers first
      const { error: deleteError } = await supabase
        .from('answer_keys')
        .delete()
        .eq('concurso_id', concursoId);
        
      if (deleteError) throw deleteError;
      
      // Insert new answers
      if (answersArray.length > 0) {
        const { error: insertError } = await supabase
          .from('answer_keys')
          .insert(answersArray);
          
        if (insertError) throw insertError;
      }
      
      setSavedSuccess(true);
      toast({
        title: "Gabarito salvo com sucesso",
        description: "O gabarito oficial foi atualizado com sucesso.",
      });
      
      // Reset success state after a delay
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      setError(error.message || "Ocorreu um erro ao salvar o gabarito oficial.");
      
      toast({
        title: "Erro ao salvar gabarito",
        description: error.message || "Ocorreu um erro ao salvar o gabarito oficial. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - {concurso.titulo}</CardTitle>
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
            <CheckCircle className="h-4 w-4" />
            <p>Gabarito salvo com sucesso!</p>
          </div>
        )}
        
        {/* Objective questions tabs based on exam_sections */}
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSectionId} 
              onValueChange={setSelectedSectionId}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.id} value={section.id}>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {createAnswerMatrix().map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          {row.map((questionNumber, colIndex) => (
                            questionNumber !== null && (
                              <div key={`${rowIndex}-${colIndex}`} className="border rounded-md p-3 bg-white">
                                <div className="mb-2 font-medium text-gray-700">Questão {questionNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                  {getOptionsForQuestion().map((option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors
                                        ${answers[questionNumber] === option 
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                      onClick={() => handleAnswerChange(questionNumber, option)}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleSaveAnswerKey}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Gabarito
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
