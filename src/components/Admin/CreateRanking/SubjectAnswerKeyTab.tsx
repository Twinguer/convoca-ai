
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SubjectConfig } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubjectAnswerKeyTabProps {
  concursoId?: string;
  formValues?: any;
  onSaveFullRanking?: (formValues: any, answerKeyData: any) => Promise<void>;
  subjects: SubjectConfig[];
  examType: string;
  alternativesCount: number;
}

export const SubjectAnswerKeyTab = ({
  concursoId,
  formValues,
  onSaveFullRanking,
  subjects,
  examType,
  alternativesCount
}: SubjectAnswerKeyTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [nullifiedQuestions, setNullifiedQuestions] = useState<number[]>([]);

  useEffect(() => {
    // Set the first subject as selected by default
    if (subjects && subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].code);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    const fetchAnswerKey = async () => {
      try {
        setIsLoading(true);
        if (!concursoId) {
          setIsLoading(false);
          return;
        }
        
        // Use the get_official_answer_weights RPC
        const { data, error } = await supabase.rpc(
          'get_official_answer_weights',
          {
            p_concurso_id: concursoId,
          }
        );

        if (error) throw error;

        if (data && Object.keys(data).length > 0) {
          const answerMap: Record<number, string> = {};
          const nullified: number[] = [];
          
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            // Extract question number from key (e.g., "questao1" -> 1)
            const questionNumber = parseInt(key.replace('questao', ''));
            
            answerMap[questionNumber] = value.resposta;
            if (value.anulada) {
              nullified.push(questionNumber);
            }
          });
          
          setAnswers(answerMap);
          setNullifiedQuestions(nullified);
        } else {
          console.log('No answer key found for this exam');
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

  const getQuestionsForSubject = (subjectCode: string) => {
    const subject = subjects.find(s => s.code === subjectCode);
    if (!subject) return [];
    
    // Calculate the starting question number for this subject
    let startNumber = 1;
    for (const s of subjects) {
      if (s.code === subjectCode) break;
      startNumber += s.questions;
    }
    
    return Array.from(
      { length: subject.questions },
      (_, i) => startNumber + i
    );
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
    
    for (const subject of subjects) {
      allQuestions = [...allQuestions, ...Array.from(
        { length: subject.questions },
        (_, i) => startNumber + i
      )];
      startNumber += subject.questions;
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

      // Determine which subject each question belongs to
      const getSubjectForQuestion = (questionNumber: number) => {
        let currentQuestion = 1;
        
        for (const subject of subjects) {
          if (questionNumber >= currentQuestion && questionNumber < currentQuestion + subject.questions) {
            return subject.code;
          }
          currentQuestion += subject.questions;
        }
        
        return null;
      };

      const answerKeyData = allQuestions.map(qNum => {
        const subjectCode = getSubjectForQuestion(qNum);
        
        return {
          concurso_id: concursoId || '',
          question_number: qNum,
          correct_answer: answers[qNum],
          weight: 1.0, // Default weight
          section_type: subjectCode, // Use subject code as section_type
          is_nullified: nullifiedQuestions.includes(qNum)
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
      toast.error('Erro ao salvar gabarito');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && concursoId) {
    return <div className="py-4">Carregando gabarito...</div>;
  }

  if (!subjects || subjects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-8">
            Nenhuma disciplina configurada. Por favor, adicione disciplinas na etapa anterior.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Gabarito Oficial por Disciplina</h3>
        
        <Tabs 
          value={selectedSubject} 
          onValueChange={setSelectedSubject}
          className="w-full"
        >
          <TabsList className="grid w-full" style={{
            gridTemplateColumns: `repeat(${Math.min(subjects.length, 4)}, minmax(0, 1fr))`
          }}>
            {subjects.map(subject => (
              <TabsTrigger key={subject.code} value={subject.code}>
                {subject.code}
              </TabsTrigger>
            ))}
          </TabsList>

          {subjects.map(subject => (
            <TabsContent key={subject.code} value={subject.code}>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Digite o gabarito para a disciplina {subject.name} ({subject.code}).
                  </p>
                  <p className="text-sm font-medium">
                    {subject.questions} questões
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getQuestionsForSubject(subject.code).map(questionNumber => (
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
