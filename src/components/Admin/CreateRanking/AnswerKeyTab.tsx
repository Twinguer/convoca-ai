
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnswerKeyTabProps {
  concursoId?: string;
  formValues?: any;
  onSaveFullRanking?: (formValues: any, answerKeyData: any) => Promise<void>;
  hasBasicKnowledge: boolean;
  hasSpecificKnowledge1: boolean;
  hasSpecificKnowledge2: boolean;
  hasSpecificKnowledge3: boolean;
  basicKnowledgeQuestions: number;
  specificKnowledge1Questions: number;
  specificKnowledge2Questions: number;
  specificKnowledge3Questions: number;
  examType: string;
  alternativesCount: number;
}

export const AnswerKeyTab = ({
  concursoId,
  formValues,
  onSaveFullRanking,
  hasBasicKnowledge,
  hasSpecificKnowledge1,
  hasSpecificKnowledge2,
  hasSpecificKnowledge3,
  basicKnowledgeQuestions,
  specificKnowledge1Questions,
  specificKnowledge2Questions,
  specificKnowledge3Questions,
  examType,
  alternativesCount
}: AnswerKeyTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3'>('basic');
  const [nullifiedQuestions, setNullifiedQuestions] = useState<number[]>([]);

  useEffect(() => {
    const fetchAnswerKey = async () => {
      try {
        setIsLoading(true);
        if (!concursoId) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase.rpc(
          'get_official_answer_weights',
          {
            p_concurso_id: concursoId,
          }
        )
        .order('question_number', { ascending: true });
        // const { data, error } = await supabase
        //   .from('answer_keys')
        //   .select('*')
        //   .eq('concurso_id', concursoId)
        //   .order('question_number', { ascending: true });


        if (error) throw error;

        if (data && data.length > 0) {
          const answerMap: Record<number, string> = {};
          const nullified: number[] = [];
          
          data.forEach(item => {
            answerMap[item.question_number] = item.answer;
            if (item.is_nullified) {
              nullified.push(item.question_number);
            }
          });
          
          setAnswers(answerMap);
          setNullifiedQuestions(nullified);
        }
      } catch (error) {
        console.error('Error fetching answer key:', error);
        toast.error('Erro ao carregar gabarito existente');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnswerKey();
  }, [concursoId]);

  const getQuestionRange = () => {
    let questions: number[] = [];
    let startNumber = 1;

    if (selectedSection === 'basic' && hasBasicKnowledge) {
      questions = Array.from({ length: basicKnowledgeQuestions }, (_, i) => i + 1);
    } else if (selectedSection === 'specific1' && hasSpecificKnowledge1) {
      startNumber = (basicKnowledgeQuestions || 0) + 1;
      questions = Array.from(
        { length: specificKnowledge1Questions },
        (_, i) => startNumber + i
      );
    } else if (selectedSection === 'specific2' && hasSpecificKnowledge2) {
      startNumber = (basicKnowledgeQuestions || 0) + (specificKnowledge1Questions || 0) + 1;
      questions = Array.from(
        { length: specificKnowledge2Questions },
        (_, i) => startNumber + i
      );
    } else if (selectedSection === 'specific3' && hasSpecificKnowledge3) {
      startNumber = (basicKnowledgeQuestions || 0) + (specificKnowledge1Questions || 0) + 
                   (specificKnowledge2Questions || 0) + 1;
      questions = Array.from(
        { length: specificKnowledge3Questions },
        (_, i) => startNumber + i
      );
    }

    return questions;
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleToggleNullified = (questionNumber: number) => {
    setNullifiedQuestions(prev => {
      if (prev.includes(questionNumber)) {
        return prev.filter(q => q !== questionNumber);
      } else {
        return [...prev, questionNumber];
      }
    });
  };

  const getAllQuestions = () => {
    let allQuestions: number[] = [];
    let startNumber = 1;
    
    if (hasBasicKnowledge) {
      allQuestions = [...allQuestions, ...Array.from({ length: basicKnowledgeQuestions }, (_, i) => i + 1)];
      startNumber = basicKnowledgeQuestions + 1;
    }
    
    if (hasSpecificKnowledge1) {
      allQuestions = [...allQuestions, ...Array.from(
        { length: specificKnowledge1Questions },
        (_, i) => startNumber + i
      )];
      startNumber += specificKnowledge1Questions;
    }
    
    if (hasSpecificKnowledge2) {
      allQuestions = [...allQuestions, ...Array.from(
        { length: specificKnowledge2Questions },
        (_, i) => startNumber + i
      )];
      startNumber += specificKnowledge2Questions;
    }
    
    if (hasSpecificKnowledge3) {
      allQuestions = [...allQuestions, ...Array.from(
        { length: specificKnowledge3Questions },
        (_, i) => startNumber + i
      )];
    }
    
    return allQuestions;
  };

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      
      const allQuestions = getAllQuestions();
      const unansweredQuestions = allQuestions.filter(q => !answers[q]);
      
      if (unansweredQuestions.length > 0) {
        toast.error(`Todas as questões devem ser respondidas. Faltam as questões: ${unansweredQuestions.join(', ')}`);
        return;
      }

      const answerKeyData = allQuestions.map(questionNumber => {
        const qNum = parseInt(questionNumber.toString());
        const basicEnd = basicKnowledgeQuestions || 0;
        const specific1End = basicEnd + (specificKnowledge1Questions || 0);
        const specific2End = specific1End + (specificKnowledge2Questions || 0);
        const specific3End = specific2End + (specificKnowledge3Questions || 0);
        
        return {
          concurso_id: concursoId || '',
          question_number: qNum,
          answer: answers[qNum],
          is_nullified: nullifiedQuestions.includes(qNum),
          is_basic_knowledge: qNum <= basicEnd,
          is_specific_1: qNum > basicEnd && qNum <= specific1End,
          is_specific_2: qNum > specific1End && qNum <= specific2End,
          is_specific_3: qNum > specific2End && qNum <= specific3End
        };
      });
      
      if (onSaveFullRanking && formValues) {
        await onSaveFullRanking(formValues, answerKeyData);
        toast.success('Gabarito salvo com sucesso!');
      } else {
        toast.error('Não foi possível salvar o gabarito sem um ID de concurso');
      }
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      if (error.message && error.message.includes('Todas as questões do gabarito oficial devem ter uma resposta')) {
        toast.error('Todas as questões do gabarito oficial devem ter uma resposta');
      } else {
        toast.error('Erro ao salvar gabarito');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && concursoId) {
    return <div className="py-4">Carregando gabarito...</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Gabarito Oficial</h3>
        
        <Tabs 
          value={selectedSection} 
          onValueChange={(value) => setSelectedSection(value as 'basic' | 'specific1' | 'specific2' | 'specific3')}
          className="w-full"
        >
          <TabsList className="grid w-full" style={{
            gridTemplateColumns: `repeat(${[
              hasBasicKnowledge,
              hasSpecificKnowledge1,
              hasSpecificKnowledge2,
              hasSpecificKnowledge3
            ].filter(Boolean).length}, minmax(0, 1fr))`
          }}>
            {hasBasicKnowledge && (
              <TabsTrigger value="basic">Conhecimentos Básicos</TabsTrigger>
            )}
            {hasSpecificKnowledge1 && (
              <TabsTrigger value="specific1">C. Específicos 1</TabsTrigger>
            )}
            {hasSpecificKnowledge2 && (
              <TabsTrigger value="specific2">C. Específicos 2</TabsTrigger>
            )}
            {hasSpecificKnowledge3 && (
              <TabsTrigger value="specific3">C. Específicos 3</TabsTrigger>
            )}
          </TabsList>

          {[
            { value: 'basic', label: 'Conhecimentos Básicos', show: hasBasicKnowledge },
            { value: 'specific1', label: 'C. Específicos 1', show: hasSpecificKnowledge1 },
            { value: 'specific2', label: 'C. Específicos 2', show: hasSpecificKnowledge2 },
            { value: 'specific3', label: 'C. Específicos 3', show: hasSpecificKnowledge3 }
          ].map(section => section.show && (
            <TabsContent key={section.value} value={section.value}>
              <div className="grid gap-4">
                <p className="text-sm text-gray-500">
                  Digite o gabarito para a seção de {section.label}.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getQuestionRange().map(questionNumber => (
                    <div key={questionNumber} className="border p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium">Questão {questionNumber}</Label>
                        <Button
                          type="button"
                          variant={nullifiedQuestions.includes(questionNumber) ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleToggleNullified(questionNumber)}
                        >
                          {nullifiedQuestions.includes(questionNumber) ? "Anulada" : "Anular"}
                        </Button>
                      </div>
                      
                      {examType === 'Alternativas' ? (
                        <RadioGroup
                          value={answers[questionNumber] || ''}
                          onValueChange={(value) => handleAnswerChange(questionNumber, value)}
                          className="flex flex-row space-x-2 mt-2"
                        >
                          {Array.from(
                            { length: alternativesCount || 5 },
                            (_, i) => String.fromCharCode(65 + i)
                          ).map((option) => (
                            <div key={option} className="flex items-center space-x-1">
                              <RadioGroupItem
                                value={option}
                                id={`q${questionNumber}-${option}`}
                                disabled={nullifiedQuestions.includes(questionNumber)}
                              />
                              <Label htmlFor={`q${questionNumber}-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <RadioGroup
                          value={answers[questionNumber] || ''}
                          onValueChange={(value) => handleAnswerChange(questionNumber, value)}
                          className="flex space-x-4 mt-2"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem
                              value="C"
                              id={`q${questionNumber}-C`}
                              disabled={nullifiedQuestions.includes(questionNumber)}
                            />
                            <Label htmlFor={`q${questionNumber}-C`}>C</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem
                              value="E"
                              id={`q${questionNumber}-E`}
                              disabled={nullifiedQuestions.includes(questionNumber)}
                            />
                            <Label htmlFor={`q${questionNumber}-E`}>E</Label>
                          </div>
                        </RadioGroup>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button 
            type="button" 
            onClick={handleSaveAnswerKey}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Gabarito'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
