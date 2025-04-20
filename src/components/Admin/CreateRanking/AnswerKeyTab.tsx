
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { updateAnswerKey } from '@/integrations/supabase/rankings/concursoManager';
import { toast } from 'sonner';

interface AnswerKeyTabProps {
  concursoId: string;
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

  // Carregar gabarito existente
  useEffect(() => {
    const fetchAnswerKey = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('answer_keys')
          .select('*')
          .eq('concurso_id', concursoId)
          .order('question_number', { ascending: true });

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

    if (concursoId) {
      fetchAnswerKey();
    }
  }, [concursoId]);

  // Determinar a seção correta para cada questão
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

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      
      const questions = getQuestionRange();
      const unansweredQuestions = questions.filter(q => !answers[q]);
      
      if (unansweredQuestions.length > 0) {
        toast.error(`Todas as questões desta seção devem ser respondidas. Faltam as questões: ${unansweredQuestions.join(', ')}`);
        return;
      }

      // Transform answers into array format for the database
      const answerKeyData = Object.keys(answers).map(questionNumber => {
        const qNum = parseInt(questionNumber);
        const isBasic = qNum <= (basicKnowledgeQuestions || 0);
        const specific1End = (basicKnowledgeQuestions || 0) + (specificKnowledge1Questions || 0);
        const specific2End = specific1End + (specificKnowledge2Questions || 0);
        
        return {
          concurso_id: concursoId,
          question_number: qNum,
          answer: answers[qNum],
          is_nullified: nullifiedQuestions.includes(qNum),
          is_basic_knowledge: isBasic,
          is_specific_1: !isBasic && qNum <= specific1End,
          is_specific_2: qNum > specific1End && qNum <= specific2End,
          is_specific_3: qNum > specific2End
        };
      });
      
      // Update the answer key
      await updateAnswerKey(concursoId, answerKeyData);
      
      toast.success('Gabarito salvo com sucesso!');
    } catch (error) {
      console.error('Error saving answer key:', error);
      toast.error('Erro ao salvar gabarito');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
