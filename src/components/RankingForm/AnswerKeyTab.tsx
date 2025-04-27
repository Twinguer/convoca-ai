
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { updateAnswerKey } from '@/integrations/supabase/rankings/concursoManager';
import { toast } from 'sonner';
import { AnswerMatrix } from '../resultados/AnswerMatrix';

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
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAnswerKey = async () => {
      try {
        setIsLoading(true);
        if (!concursoId) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('answer_keys')
          .select('*')
          .eq('concurso_id', concursoId)
          .order('question_number', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const answerMap: Record<number, string> = {};
          const nullified = new Set<number>();
          
          data.forEach(item => {
            answerMap[item.question_number] = item.answer;
            if (item.is_nullified) {
              nullified.add(item.question_number);
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

  const generateMatrix = () => {
    const matrix: (number | null)[][] = [];
    const columns = 4; // Display questions in 4 columns
    
    // Helper to create rows for a section
    const createSectionRows = (start: number, count: number) => {
      if (count <= 0) return;
      
      let questionNumber = start;
      let row: (number | null)[] = [];
      
      for (let i = 0; i < count; i++) {
        row.push(questionNumber);
        questionNumber++;
        
        // Start a new row after filling columns
        if (row.length === columns || i === count - 1) {
          // Pad row with nulls if needed
          while (row.length < columns) {
            row.push(null);
          }
          matrix.push([...row]);
          row = [];
        }
      }
    };
    
    // Create rows for each section
    let startNumber = 1;
    
    if (hasBasicKnowledge) {
      createSectionRows(startNumber, basicKnowledgeQuestions);
      startNumber += basicKnowledgeQuestions;
    }
    
    if (hasSpecificKnowledge1) {
      createSectionRows(startNumber, specificKnowledge1Questions);
      startNumber += specificKnowledge1Questions;
    }
    
    if (hasSpecificKnowledge2) {
      createSectionRows(startNumber, specificKnowledge2Questions);
      startNumber += specificKnowledge2Questions;
    }
    
    if (hasSpecificKnowledge3) {
      createSectionRows(startNumber, specificKnowledge3Questions);
    }
    
    return matrix;
  };

  const getMatrixForSection = (section: 'basic' | 'specific1' | 'specific2' | 'specific3') => {
    const matrix: (number | null)[][] = [];
    const columns = 4; // Display questions in 4 columns
    
    let startNumber = 1;
    let count = 0;
    
    // Set start number and count based on section
    if (section === 'basic') {
      count = basicKnowledgeQuestions;
    } else if (section === 'specific1') {
      startNumber = basicKnowledgeQuestions + 1;
      count = specificKnowledge1Questions;
    } else if (section === 'specific2') {
      startNumber = basicKnowledgeQuestions + specificKnowledge1Questions + 1;
      count = specificKnowledge2Questions;
    } else if (section === 'specific3') {
      startNumber = basicKnowledgeQuestions + specificKnowledge1Questions + specificKnowledge2Questions + 1;
      count = specificKnowledge3Questions;
    }
    
    if (count <= 0) return matrix;
    
    let questionNumber = startNumber;
    let row: (number | null)[] = [];
    
    for (let i = 0; i < count; i++) {
      row.push(questionNumber);
      questionNumber++;
      
      // Start a new row after filling columns
      if (row.length === columns || i === count - 1) {
        // Pad row with nulls if needed
        while (row.length < columns) {
          row.push(null);
        }
        matrix.push([...row]);
        row = [];
      }
    }
    
    return matrix;
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleNullifyQuestion = (questionNumber: number) => {
    setNullifiedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
      } else {
        newSet.add(questionNumber);
      }
      return newSet;
    });
  };

  const handleClearAnswer = (questionNumber: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
  };

  const getOptionsForQuestion = (questionNumber: number): string[] => {
    if (examType === 'Certo-Errado') {
      return ['C', 'E'];
    } else {
      return Array.from({ length: alternativesCount || 5 }, (_, i) => String.fromCharCode(65 + i));
    }
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
          is_nullified: nullifiedQuestions.has(qNum),
          is_basic_knowledge: qNum <= basicEnd,
          is_specific_1: qNum > basicEnd && qNum <= specific1End,
          is_specific_2: qNum > specific1End && qNum <= specific2End,
          is_specific_3: qNum > specific2End && qNum <= specific3End
        };
      });
      
      if (onSaveFullRanking && formValues) {
        await onSaveFullRanking(formValues, answerKeyData);
      } else if (concursoId) {
        await updateAnswerKey(concursoId, answerKeyData);
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
                
                <AnswerMatrix
                  matrix={getMatrixForSection(section.value as 'basic' | 'specific1' | 'specific2' | 'specific3')}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                  getOptionsForQuestion={getOptionsForQuestion}
                  examType={examType === 'Certo-Errado' ? 'Certo ou Errado' : 'Alternativas'}
                  onClearAnswer={handleClearAnswer}
                  nullifiedQuestions={nullifiedQuestions}
                  onNullifyQuestion={handleNullifyQuestion}
                />
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
