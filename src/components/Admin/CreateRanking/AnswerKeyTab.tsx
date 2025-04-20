
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [nullifiedQuestions, setNullifiedQuestions] = useState<number[]>([]);

  // Calculate total questions
  useEffect(() => {
    let total = 0;
    if (hasBasicKnowledge) total += basicKnowledgeQuestions || 0;
    if (hasSpecificKnowledge1) total += specificKnowledge1Questions || 0;
    if (hasSpecificKnowledge2) total += specificKnowledge2Questions || 0;
    if (hasSpecificKnowledge3) total += specificKnowledge3Questions || 0;
    setTotalQuestions(total);
  }, [
    hasBasicKnowledge, basicKnowledgeQuestions, 
    hasSpecificKnowledge1, specificKnowledge1Questions,
    hasSpecificKnowledge2, specificKnowledge2Questions,
    hasSpecificKnowledge3, specificKnowledge3Questions
  ]);

  // Load existing answer key
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

        // Initialize with existing data
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
      
      // Transform answers into array format for the database
      const answerKeyData = Object.keys(answers).map(questionNumber => {
        const qNum = parseInt(questionNumber);
        return {
          concurso_id: concursoId,
          question_number: qNum,
          answer: answers[qNum],
          is_nullified: nullifiedQuestions.includes(qNum)
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
        
        <div className="grid gap-6">
          {totalQuestions > 0 ? (
            <div className="grid gap-4">
              {/* Answer Key Instructions */}
              <p className="text-sm text-gray-500">
                Preencha o gabarito oficial abaixo. Escolha a alternativa correta para cada questão ou marque como anulada.
              </p>
              
              {/* Answer Key Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(questionNumber => (
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
              
              <div className="flex justify-end mt-4">
                <Button 
                  type="button" 
                  onClick={handleSaveAnswerKey}
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Gabarito'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">
                Configure a estrutura da prova na aba anterior para adicionar o gabarito.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
