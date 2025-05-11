import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';
import { NullifyQuestionButton } from '../Admin/NullifyQuestionButton';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { answerKeyService } from '@/services/answerKeyService';
import { getSectionTypeForQuestion, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [selectedSection, setSelectedSection] = useState<string>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [recalculationSuccess, setRecalculationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
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
    queryKey: ['official-answers-weights', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_official_answer_weights', {
        p_concurso_id: concursoId
      });
        
      if (error) throw error;
      return data || {};
    },
  });

  useEffect(() => {
    if (existingAnswers && Object.keys(existingAnswers).length > 0) {
      const answersMap: { [key: number]: string } = {};
      const nullifiedSet = new Set<number>();
      
      Object.entries(existingAnswers).forEach(([key, value]: [string, any]) => {
        const questionNumber = parseInt(key.replace('questao', ''));
        
        answersMap[questionNumber] = value.resposta;
        if (value.anulada) {
          nullifiedSet.add(questionNumber);
        }
      });
      
      setAnswers(answersMap);
      setNullifiedQuestions(nullifiedSet);
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

  // Atualizar os nomes de exibição com conhecimentos customizados
  const sectionNames = updateSectionDisplayNames(concurso);

  const getAllQuestionsFromAllSections = () => {
    const allQuestions: number[] = [];
    let currentQuestionNumber = 1;
    
    // Seções padrão
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.questionCount) {
          for (let i = 0; i < discipline.questionCount; i++) {
            allQuestions.push(currentQuestionNumber++);
          }
        }
      }
    }
    
    return allQuestions;
  };

  const getQuestionsCount = (section: string): number => {
    if (section === 'basic' && concurso.has_basic_knowledge) {
      return concurso.basic_knowledge_questions || 0;
    } else if (section === 'specific1' && concurso.has_specific_knowledge_1) {
      return concurso.specific_knowledge_1_questions || 0;
    } else if (section === 'specific2' && concurso.has_specific_knowledge_2) {
      return concurso.specific_knowledge_2_questions || 0;
    } else if (section === 'specific3' && concurso.has_specific_knowledge_3) {
      return concurso.specific_knowledge_3_questions || 0;
    } else if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const customDiscipline = concurso.disciplines.find(d => d.type === section);
      if (customDiscipline) {
        return customDiscipline.questionCount || 0;
      }
    }
    return 0;
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
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

  const performRecalculation = async () => {
    try {
      setIsRecalculating(true);
      
      toast({
        title: "Recalculando pontuações",
        description: "Iniciando recálculo para todos os usuários. Isso pode levar algum tempo.",
      });
      
      const recalculationResult = await recalculateAllUserScores(concursoId);
      console.log('Recalculation result:', recalculationResult);

      if (recalculationResult.success) {
        setRecalculationSuccess(true);
        const updatedCount = recalculationResult.updatedCount || 0;
        
        toast({
          title: "Recálculo completado",
          description: `As notas de ${updatedCount} usuários foram atualizadas.`,
        });
        
        setTimeout(() => {
          setRecalculationSuccess(false);
        }, 5000);
      } else {
        toast({
          title: "Erro no recálculo",
          description: recalculationResult.error || "Ocorreu um erro ao recalcular as notas dos usuários.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error during recalculation:', error);
      toast({
        title: "Erro no recálculo",
        description: error.message || "Ocorreu um erro durante o recálculo das pontuações.",
        variant: "destructive"
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      
      // Verificar todas as questões em todas as seções, não apenas a aba atual
      const allQuestions = getAllQuestionsFromAllSections();
      const unansweredQuestions = allQuestions.filter(q => !answers[q]);
      
      if (unansweredQuestions.length > 0) {
        setError(`Todas as questões devem ser respondidas. Faltam as questões: ${unansweredQuestions.join(', ')}`);
        toast({
          title: "Erro ao salvar gabarito",
          description: "Todas as questões devem ser respondidas antes de salvar o gabarito.",
          variant: "destructive"
        });
        return;
      }
      
      // Preparar dados para salvar o gabarito completo de uma vez
      const answerKeyData = allQuestions.map(qNum => {
        // Determinar o tipo de seção para cada questão - usando tipos válidos
        const sectionType = getSectionTypeForQuestion(concurso, qNum);
        
        console.log(`Questão ${qNum}: usando section_type=${sectionType}`);
        
        return {
          concurso_id: concursoId,
          question_number: qNum,
          correct_answer: answers[qNum],
          weight: 1.0,
          section_type: sectionType,
          is_nullified: nullifiedQuestions.has(qNum)
        };
      });

      // Usar o método que evita recrear toda a tabela
      const saveResult = await answerKeyService.saveAnswerKeyAndRecalculate(concursoId, answerKeyData);

      if (saveResult.success) {
        setSavedSuccess(true);
        toast({
          title: "Gabarito salvo com sucesso",
          description: `O gabarito oficial foi atualizado. ${saveResult.updatedCount || 0} pontuações foram recalculadas.`,
        });
        
        setTimeout(() => {
          setSavedSuccess(false);
        }, 3000);
      } else {
        throw new Error(saveResult.error || "Erro ao salvar gabarito");
      }
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

  const getOptionsForQuestion = () => {
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  const getObjectiveSectionList = () => {
    const sections = [];
    if (concurso.has_basic_knowledge) sections.push({ key: 'basic', label: 'Conhecimentos Básicos' });
    if (concurso.has_specific_knowledge_1) sections.push({ key: 'specific1', label: 'C. Específicos 1' });
    if (concurso.has_specific_knowledge_2) sections.push({ key: 'specific2', label: 'C. Específicos 2' });
    if (concurso.has_specific_knowledge_3) sections.push({ key: 'specific3', label: 'C. Específicos 3' });
    
    // Adicionar disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled) {
          sections.push({ key: discipline.type, label: discipline.name });
        }
      });
    }
    
    return sections;
  };

  const getQuestionsRange = () => {
    if (selectedSection === 'basic') {
      return Array.from({ length: getQuestionsCount('basic') }, (_, i) => i + 1);
    } else if (selectedSection === 'specific1') {
      let startNumber = 1;
      
      if (concurso.has_basic_knowledge) {
        startNumber += (concurso.basic_knowledge_questions || 0);
      }
      
      return Array.from({ length: getQuestionsCount('specific1') }, (_, i) => startNumber + i);
    } else if (selectedSection === 'specific2') {
      let startNumber = 1;
      
      if (concurso.has_basic_knowledge) {
        startNumber += (concurso.basic_knowledge_questions || 0);
      }
      if (concurso.has_specific_knowledge_1) {
        startNumber += (concurso.specific_knowledge_1_questions || 0);
      }
      
      return Array.from({ length: getQuestionsCount('specific2') }, (_, i) => startNumber + i);
    } else if (selectedSection === 'specific3') {
      let startNumber = 1;
      
      if (concurso.has_basic_knowledge) {
        startNumber += (concurso.basic_knowledge_questions || 0);
      }
      if (concurso.has_specific_knowledge_1) {
        startNumber += (concurso.specific_knowledge_1_questions || 0);
      }
      if (concurso.has_specific_knowledge_2) {
        startNumber += (concurso.specific_knowledge_2_questions || 0);
      }
      
      return Array.from({ length: getQuestionsCount('specific3') }, (_, i) => startNumber + i);
    } else {
      // Para disciplinas customizadas
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        const customDiscipline = concurso.disciplines.find(d => d.type === selectedSection);
        if (customDiscipline && customDiscipline.questionCount) {
          // Calcular o índice de início para esta disciplina
          let startNumber = 1;
          
          if (concurso.has_basic_knowledge) {
            startNumber += (concurso.basic_knowledge_questions || 0);
          }
          if (concurso.has_specific_knowledge_1) {
            startNumber += (concurso.specific_knowledge_1_questions || 0);
          }
          if (concurso.has_specific_knowledge_2) {
            startNumber += (concurso.specific_knowledge_2_questions || 0);
          }
          if (concurso.has_specific_knowledge_3) {
            startNumber += (concurso.specific_knowledge_3_questions || 0);
          }
          
          // Ajustar o índice baseado nas disciplinas anteriores
          for (const discipline of concurso.disciplines) {
            if (discipline.type === selectedSection) break;
            if (discipline.isEnabled && discipline.questionCount) {
              startNumber += discipline.questionCount;
            }
          }
          
          return Array.from({ length: customDiscipline.questionCount }, (_, i) => startNumber + i);
        }
      }
      return [];
    }
  };

  const totalQuestions = getAllQuestionsFromAllSections().length;
  const answeredQuestions = Object.keys(answers).length;
  const percentageComplete = totalQuestions > 0 ? Math.floor((answeredQuestions / totalQuestions) * 100) : 0;
  const objectiveSections = getObjectiveSectionList();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - {concurso?.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Success message */}
        {savedSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <p>Gabarito salvo com sucesso!</p>
          </div>
        )}
        
        {/* Recalculation success message */}
        {recalculationSuccess && (
          <div className="bg-blue-100 p-3 rounded-md flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <p>Recálculo de pontuações concluído com sucesso!</p>
          </div>
        )}
        
        {/* Nullified questions info */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Questões Anuladas</h4>
              <p className="text-sm text-amber-700 mt-1">
                Este concurso possui {nullifiedQuestions.size} {nullifiedQuestions.size === 1 ? 'questão anulada' : 'questões anuladas'}.
                {nullifiedQuestions.size > 0 && (
                  <span className="block mt-1">
                    Questões anuladas: {Array.from(nullifiedQuestions).sort((a, b) => a - b).join(', ')}
                  </span>
                )}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Ao anular questões, as pontuações de todos os usuários serão recalculadas automaticamente após salvar.
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex flex-col">
            <h4 className="font-medium text-blue-800">Progresso do preenchimento</h4>
            <p className="text-sm text-blue-700 mt-1">
              {answeredQuestions} de {totalQuestions} questões respondidas ({percentageComplete}%)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{width: `${percentageComplete}%`}}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Todas as questões precisam ser respondidas antes de salvar o gabarito.
            </p>
          </div>
        </div>
        
        {/* Tabs for sections */}
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSection} 
              onValueChange={(value) => setSelectedSection(value)}
              className="w-full"
            >
              <TabsList className="grid w-full" style={{
                gridTemplateColumns: `repeat(${objectiveSections.length}, minmax(0, 1fr))`
              }}>
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
                        /* Remove data-lov-id to avoid React Fragment warning */
                        <React.Fragment key={`row-${rowIndex}`}>
                          {row.map((questionNumber, colIndex) => 
                            questionNumber !== null ? (
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
                                      disabled={nullifiedQuestions.has(questionNumber)}
                                      type="button"
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                <NullifyQuestionButton
                                  questionNumber={questionNumber}
                                  isNullified={nullifiedQuestions.has(questionNumber)}
                                  onNullify={handleNullifyQuestion}
                                />
                              </div>
                            ) : null
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between mt-4">
          <Button 
            onClick={performRecalculation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSaving || isRecalculating}
          >
            {isRecalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recalculando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Recalcular Pontuações
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSaveAnswerKey}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSaving || isRecalculating}
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
