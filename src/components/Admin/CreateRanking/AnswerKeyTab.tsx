
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
import { BookletAnswerKeySelector } from './BookletAnswerKeySelector';
import { useBookletAnswerKey } from '@/hooks/useBookletAnswerKey';

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
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3'>('basic');
  const [isSaving, setIsSaving] = useState(false);

  const {
    booklets,
    selectedBookletId,
    setSelectedBookletId,
    answers,
    setAnswers,
    nullifiedQuestions,
    setNullifiedQuestions,
    updateAnswer,
    isLoading,
    isSaving: isSavingAnswer,
    completionStatus
  } = useBookletAnswerKey(concursoId || '');

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
      if (!selectedBookletId) {
        toast.error('Selecione um caderno antes de salvar o gabarito');
        return;
      }

      setIsSaving(true);
      
      const allQuestions = getAllQuestions();
      const unansweredQuestions = allQuestions.filter(q => !answers[q]);
      
      if (unansweredQuestions.length > 0) {
        toast.error(`Todas as questões devem ser respondidas. Faltam as questões: ${unansweredQuestions.join(', ')}`);
        return;
      }

      const concursoData = formValues || await fetchConcursoData(concursoId);
      
      if (!concursoData) {
        toast.error("Dados do concurso não disponíveis. Não é possível salvar o gabarito.");
        return;
      }

      // Salvar cada resposta individualmente
      for (const qNum of allQuestions) {
        const sectionType = getSectionTypeForQuestion(concursoData, qNum);
        
        await updateAnswer(
          qNum,
          answers[qNum],
          1.0,
          nullifiedQuestions.includes(qNum),
          sectionType
        );
      }
      
      toast.success(`Gabarito do caderno salvo com sucesso!`);
      
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      toast.error('Erro ao salvar gabarito: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchConcursoData = async (id?: string) => {
    if (!id) return null;
    
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Erro ao buscar dados do concurso:", e);
      return null;
    }
  };

  if (isLoading && concursoId) {
    return <div className="py-4">Carregando gabarito...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Caderno */}
      <BookletAnswerKeySelector
        booklets={booklets}
        selectedBookletId={selectedBookletId}
        onBookletChange={setSelectedBookletId}
        completionStatus={completionStatus}
        disabled={isSaving || isSavingAnswer}
      />

      {/* Conteúdo do Gabarito */}
      {selectedBookletId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Gabarito Oficial - {booklets.find(b => b.id === selectedBookletId)?.name}
              </h3>
              <div className="text-sm text-muted-foreground">
                Caderno Selecionado: <span className="font-medium">{booklets.find(b => b.id === selectedBookletId)?.name}</span>
              </div>
            </div>
            
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
                      Digite o gabarito para a seção de {section.label} do caderno {booklets.find(b => b.id === selectedBookletId)?.name}.
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
                disabled={isSaving || isSavingAnswer || !selectedBookletId}
              >
                {isSaving ? 'Salvando...' : `Salvar Gabarito - ${booklets.find(b => b.id === selectedBookletId)?.name || 'Caderno'}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">Selecione um caderno para preencher o gabarito</p>
              <p className="text-sm">Escolha o caderno no seletor acima para começar a inserir as respostas</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
