
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();

  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso-details', concursoId],
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

  const getQuestionsCount = (section: 'basic' | 'specific1' | 'specific2' | 'specific3') => {
    if (section === 'basic' && concurso.has_basic_knowledge) {
      return concurso.basic_knowledge_questions || 0;
    } else if (section === 'specific1' && concurso.has_specific_knowledge_1) {
      return concurso.specific_knowledge_1_questions || 0;
    } else if (section === 'specific2' && concurso.has_specific_knowledge_2) {
      return concurso.specific_knowledge_2_questions || 0;
    } else if (section === 'specific3' && concurso.has_specific_knowledge_3) {
      return concurso.specific_knowledge_3_questions || 0;
    }
    return 0;
  };

  const getQuestionsRange = () => {
    if (selectedSection === 'basic') {
      return Array.from({ length: getQuestionsCount('basic') }, (_, i) => i + 1);
    } else {
      let startNumber = 1;
      
      if (concurso.has_basic_knowledge) {
        startNumber += (concurso.basic_knowledge_questions || 0);
      }
      
      if (selectedSection === 'specific1') {
        return Array.from({ length: getQuestionsCount('specific1') }, (_, i) => startNumber + i);
      } else if (selectedSection === 'specific2') {
        startNumber += (concurso.specific_knowledge_1_questions || 0);
        return Array.from({ length: getQuestionsCount('specific2') }, (_, i) => startNumber + i);
      } else if (selectedSection === 'specific3') {
        startNumber += (concurso.specific_knowledge_1_questions || 0) + (concurso.specific_knowledge_2_questions || 0);
        return Array.from({ length: getQuestionsCount('specific3') }, (_, i) => startNumber + i);
      }
    }
    return [];
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
        let isBasic = false;
        let isSpecific1 = false;
        let isSpecific2 = false;
        let isSpecific3 = false;
        
        const basicCount = concurso.basic_knowledge_questions || 0;
        const specific1Count = concurso.specific_knowledge_1_questions || 0;
        const specific2Count = concurso.specific_knowledge_2_questions || 0;
        
        if (qNum <= basicCount) {
          isBasic = true;
        } else if (qNum <= basicCount + specific1Count) {
          isSpecific1 = true;
        } else if (qNum <= basicCount + specific1Count + specific2Count) {
          isSpecific2 = true;
        } else {
          isSpecific3 = true;
        }
        
        return {
          concurso_id: concursoId,
          question_number: qNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: isBasic,
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
      
      // Reload data
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

  // Get only the objective sections for tabs (basic and specific knowledge)
  const getObjectiveSectionList = () => {
    const sections = [];
    if (concurso.has_basic_knowledge) sections.push({ key: 'basic', label: 'Conhecimentos Básicos' });
    if (concurso.has_specific_knowledge_1) sections.push({ key: 'specific1', label: 'C. Específicos 1' });
    if (concurso.has_specific_knowledge_2) sections.push({ key: 'specific2', label: 'C. Específicos 2' });
    if (concurso.has_specific_knowledge_3) sections.push({ key: 'specific3', label: 'C. Específicos 3' });
    return sections;
  };

  const objectiveSections = getObjectiveSectionList();

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
        
        {/* Objective questions tabs (only for basic and specific knowledge) */}
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSection} 
              onValueChange={(value) => setSelectedSection(value as 'basic' | 'specific1' | 'specific2' | 'specific3')}
              className="w-full"
            >
              <TabsList className={`grid w-full grid-cols-${objectiveSections.length}`}>
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
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
