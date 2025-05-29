
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WeightedAnswerInput } from './AnswerKeyForm/WeightedAnswerInput';
import { NullifyQuestionButton } from './NullifyQuestionButton';
import { useBookletAnswerKey } from '@/hooks/useBookletAnswerKey';

export interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const queryClient = useQueryClient();
  const { selectedBookletId } = useBookletAnswerKey(concursoId);
  
  const [answers, setAnswers] = useState<Record<number, { answer: string; weight: number; isNullified: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar dados do concurso
  const { data: concurso } = useQuery({
    queryKey: ['concurso', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar respostas oficiais existentes para o caderno selecionado
  const { data: existingAnswers, refetch: refetchAnswers } = useQuery({
    queryKey: ['official-answers', concursoId, selectedBookletId],
    queryFn: async () => {
      if (!selectedBookletId) return [];
      
      const { data, error } = await supabase
        .from('official_answer_weights')
        .select('*')
        .eq('concurso_id', concursoId)
        .eq('booklet_id', selectedBookletId)
        .order('question_number');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedBookletId
  });

  // Calcular número total de questões
  const totalQuestions = React.useMemo(() => {
    if (!concurso) return 0;
    
    return (
      (concurso.has_basic_knowledge ? (concurso.basic_knowledge_questions || 0) : 0) +
      (concurso.has_specific_knowledge_1 ? (concurso.specific_knowledge_1_questions || 0) : 0) +
      (concurso.has_specific_knowledge_2 ? (concurso.specific_knowledge_2_questions || 0) : 0) +
      (concurso.has_specific_knowledge_3 ? (concurso.specific_knowledge_3_questions || 0) : 0)
    );
  }, [concurso]);

  // Carregar respostas existentes no estado local
  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const answersMap: Record<number, { answer: string; weight: number; isNullified: boolean }> = {};
      
      existingAnswers.forEach((answer) => {
        answersMap[answer.question_number] = {
          answer: answer.correct_answer,
          weight: answer.weight,
          isNullified: answer.is_nullified
        };
      });
      
      setAnswers(answersMap);
    } else {
      // Resetar se não há respostas para este caderno
      setAnswers({});
    }
  }, [existingAnswers, selectedBookletId]);

  // Função para determinar o tipo de seção baseado no número da questão
  const getSectionType = (questionNumber: number): string => {
    if (!concurso) return 'basic';
    
    let currentPosition = 0;
    
    if (concurso.has_basic_knowledge) {
      currentPosition += concurso.basic_knowledge_questions || 0;
      if (questionNumber <= currentPosition) return 'basic';
    }
    
    if (concurso.has_specific_knowledge_1) {
      const previousPosition = currentPosition;
      currentPosition += concurso.specific_knowledge_1_questions || 0;
      if (questionNumber > previousPosition && questionNumber <= currentPosition) return 'specific1';
    }
    
    if (concurso.has_specific_knowledge_2) {
      const previousPosition = currentPosition;
      currentPosition += concurso.specific_knowledge_2_questions || 0;
      if (questionNumber > previousPosition && questionNumber <= currentPosition) return 'specific2';
    }
    
    if (concurso.has_specific_knowledge_3) {
      const previousPosition = currentPosition;
      currentPosition += concurso.specific_knowledge_3_questions || 0;
      if (questionNumber > previousPosition && questionNumber <= currentPosition) return 'specific3';
    }
    
    return 'basic';
  };

  const handleAnswerChange = (questionNumber: number, field: 'answer' | 'weight', value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        answer: prev[questionNumber]?.answer || '',
        weight: prev[questionNumber]?.weight || 1,
        isNullified: prev[questionNumber]?.isNullified || false,
        [field]: value
      }
    }));
  };

  const handleNullifyQuestion = (questionNumber: number, isNullified: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        answer: prev[questionNumber]?.answer || '',
        weight: prev[questionNumber]?.weight || 1,
        isNullified
      }
    }));
  };

  const saveAnswersMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBookletId) {
        throw new Error('Nenhum caderno selecionado');
      }

      // Deletar respostas existentes para este caderno
      await supabase
        .from('official_answer_weights')
        .delete()
        .eq('concurso_id', concursoId)
        .eq('booklet_id', selectedBookletId);

      // Inserir novas respostas
      const answersToInsert = Object.entries(answers).map(([questionNumber, data]) => ({
        concurso_id: concursoId,
        booklet_id: selectedBookletId,
        question_number: parseInt(questionNumber),
        correct_answer: data.answer,
        weight: data.weight,
        is_nullified: data.isNullified,
        section_type: getSectionType(parseInt(questionNumber))
      }));

      if (answersToInsert.length > 0) {
        const { error } = await supabase
          .from('official_answer_weights')
          .insert(answersToInsert);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Gabarito salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['official-answers'] });
      queryClient.invalidateQueries({ queryKey: ['booklets-completion'] });
      refetchAnswers();
    },
    onError: (error: any) => {
      console.error('Erro ao salvar gabarito:', error);
      toast.error(`Erro ao salvar gabarito: ${error.message}`);
    }
  });

  const handleSave = () => {
    if (!selectedBookletId) {
      toast.error('Selecione um caderno antes de salvar o gabarito');
      return;
    }

    setIsSubmitting(true);
    saveAnswersMutation.mutate();
    setIsSubmitting(false);
  };

  if (!concurso) {
    return <div>Carregando...</div>;
  }

  if (!selectedBookletId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Selecione um caderno para preencher o gabarito oficial.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - Caderno {selectedBookletId}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const questionNumber = index + 1;
            const currentAnswer = answers[questionNumber];
            
            return (
              <div key={questionNumber} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Questão {questionNumber}</Label>
                  <NullifyQuestionButton
                    questionNumber={questionNumber}
                    isNullified={currentAnswer?.isNullified || false}
                    onToggle={(isNullified) => handleNullifyQuestion(questionNumber, isNullified)}
                  />
                </div>
                
                {!currentAnswer?.isNullified && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor={`answer-${questionNumber}`}>Resposta Correta</Label>
                      {concurso.exam_type === 'Certo ou Errado' ? (
                        <Select
                          value={currentAnswer?.answer || ''}
                          onValueChange={(value) => handleAnswerChange(questionNumber, 'answer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">Certo</SelectItem>
                            <SelectItem value="E">Errado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={currentAnswer?.answer || ''}
                          onValueChange={(value) => handleAnswerChange(questionNumber, 'answer', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: concurso.alternatives_count || 5 }, (_, i) => {
                              const letter = String.fromCharCode(65 + i);
                              return (
                                <SelectItem key={letter} value={letter}>
                                  {letter}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <WeightedAnswerInput
                      questionNumber={questionNumber}
                      weight={currentAnswer?.weight || 1}
                      onWeightChange={(weight) => handleAnswerChange(questionNumber, 'weight', weight)}
                    />
                  </>
                )}
                
                {currentAnswer?.isNullified && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Questão anulada - todos os candidatos receberão a pontuação
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || !selectedBookletId}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Gabarito'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
