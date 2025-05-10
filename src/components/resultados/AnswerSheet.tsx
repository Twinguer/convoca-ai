import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertTriangle, Check, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso, SectionType } from '@/types/concursos';
import { AnswerMatrix } from './AnswerMatrix';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscursiveScoresSection } from './DiscursiveScoresSection';
import { ExamTypeWarning } from './ExamTypeWarning';
import { sectionDisplayNames, updateSectionDisplayNames, getExamStructure } from '@/integrations/supabase/rankings/examStructure';

interface AnswerSheetProps {
  concurso: Concurso;
  rankingId: string;
  onSuccess: () => void;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({
  concurso,
  rankingId,
  onSuccess
}) => {
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const [lastCheckedNullifiedCount, setLastCheckedNullifiedCount] = useState<number>(0);
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({...sectionDisplayNames});
  
  const {
    answers,
    selectedSection,
    setSelectedSection,
    isSaving,
    setIsSaving,
    error,
    setError,
    savedSuccess,
    setSavedSuccess,
    handleAnswerChange,
    handleClearAnswer,
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType,
    getAnsweredQuestionsCount,
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score
  } = useAnswerSheet(concurso, rankingId);
  
  // Atualizar os nomes de exibição das seções com disciplinas customizadas
  useEffect(() => {
    if (concurso) {
      const updatedNames = updateSectionDisplayNames(concurso);
      setSectionLabels(updatedNames);
    }
  }, [concurso]);
  
  const {
    data: userRankingData,
    isLoading: isLoadingRanking
  } = useQuery({
    queryKey: ['user-ranking-detail', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('id', rankingId)
        .single();
      if (error) throw error;
      return data || {};
    },
    staleTime: 1000
  });
  
  // Definir a variável editsLeft e canEdit antes de useEffect
  const editsLeft = userRankingData ? 3 - (userRankingData.edit_count || 0) : 3;
  const canEdit = editsLeft > 0;
  
  const {
    data: nullifiedData,
    isLoading: isLoadingNullified,
    refetch: refetchNullified
  } = useQuery({
      queryKey: ['nullified-questions', concurso.id],
      queryFn: async () => {
          const { data, error } = await supabase
              .from('official_answer_weights')
              .select("question_number")
              .eq('concurso_id', concurso.id)
              .eq('is_nullified', true);
          if (error) throw error;
          return data;
      },
      staleTime: 30000, // Aumentado para reduzir consultas desnecessárias
      refetchOnWindowFocus: true
  });
  
  // Renomeie a função importada de useSaveAnswers para saveAnswersService
  const { handleSaveAnswers: saveAnswersService } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore,
    caseStudy1Score,
    caseStudy2Score,
    caseStudy3Score,
    editCount: userRankingData?.edit_count || 0,
    nullifiedQuestions // Passar as questões anuladas para o hook
  });
  
  useEffect(() => {
    if (userRankingData?.discursive_score !== undefined && userRankingData?.discursive_score !== null) {
      setDiscursiveScore(userRankingData.discursive_score);
    }
    if (userRankingData?.case_study_1_score !== undefined && userRankingData?.case_study_1_score !== null) {
      setCaseStudy1Score(userRankingData.case_study_1_score);
    }
    if (userRankingData?.case_study_2_score !== undefined && userRankingData?.case_study_2_score !== null) {
      setCaseStudy2Score(userRankingData.case_study_2_score);
    }
    if (userRankingData?.case_study_3_score !== undefined && userRankingData?.case_study_3_score !== null) {
      setCaseStudy3Score(userRankingData.case_study_3_score);
    }
  }, [userRankingData]);
  
  useEffect(() => {
    if (nullifiedData && nullifiedData.length > 0) {
      const nullifiedSet = new Set(nullifiedData.map(item => item.question_number));
      setNullifiedQuestions(nullifiedSet);
      console.log('[AnswerSheet] Questões anuladas atualizadas:', Array.from(nullifiedSet).join(', '));
      
      // Verificar se houve alteração no número de questões anuladas
      if (nullifiedSet.size !== lastCheckedNullifiedCount) {
        console.log('[AnswerSheet] Alteração detectada nas questões anuladas:', 
          `Anterior: ${lastCheckedNullifiedCount}, Atual: ${nullifiedSet.size}`);
        
        setLastCheckedNullifiedCount(nullifiedSet.size);
      }
    }
  }, [nullifiedData]);
  
  const handleSaveAnswers = async () => {
    if (!concurso?.id) {
      setError("ID do concurso não encontrado");
      return;
    }

    const totalQuestions = getTotalQuestions();
    const answeredQuestions = getAnsweredQuestionsCount();
    
    // Considerar também as questões anuladas como "respondidas" para a validação
    const effectivelyAnsweredQuestions = answeredQuestions + 
      Array.from(nullifiedQuestions).filter(qNum => !answers[qNum]).length;

    if (effectivelyAnsweredQuestions < totalQuestions) {
      // Identificar quais questões ainda não foram respondidas (excluindo as anuladas)
      const unansweredQuestions = [];
      const allQuestions = getAllQuestionsFromAllSections();
      
      // Para cada questão, verificar se está respondida ou anulada
      for (const qNum of allQuestions) {
        if (!answers[qNum] && !nullifiedQuestions.has(qNum)) {
          unansweredQuestions.push(qNum);
        }
      }
      
      if (unansweredQuestions.length > 0) {
        setError(`Existem questões que precisam ser respondidas: ${unansweredQuestions.sort((a, b) => a - b).join(', ')}`);
        return;
      }
    }

    try {
      console.log("[AnswerSheet] Iniciando processo de salvamento");
      setIsSaving(true);
      setError(null);
      
      // Chamando o serviço correto renomeado
      await saveAnswersService();
      await refetchNullified();
      console.log("[AnswerSheet] Salvamento concluído com sucesso");
    } catch (error: any) {
      console.error("[AnswerSheet] Erro durante o salvamento:", error);
      setIsSaving(false);
      setError(error.message || "Erro ao salvar respostas");
    }
  };
  
  const handleScoreChange = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<number | null>>,
    scoreName: string
  ) => {
    if (value === '') {
      setter(null);
      return;
    }
    
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return;
    
    if (numberValue < 0 || numberValue > 100) {
      setError(`A nota da ${scoreName} deve estar entre 0 e 100.`);
      return;
    }
    
    setter(numberValue);
  };
  
  if (isLoadingRanking || isLoadingNullified) {
    return <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-center text-gray-600">Carregando cartão de respostas...</p>
        </CardContent>
      </Card>;
  }
  
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = getAnsweredQuestionsCount();
  const progressPercentage = totalQuestions ? answeredQuestions / totalQuestions * 100 : 0;
  const hasNullifiedQuestions = nullifiedQuestions.size > 0;

  // Modificando a função getObjectiveSectionList para lidar com seções customizadas
  const getObjectiveSectionList = () => {
    const sections = [];
    if (concurso.has_basic_knowledge) sections.push({ key: 'basic', label: sectionLabels.basic || 'Conhecimentos Básicos' });
    if (concurso.has_specific_knowledge_1) sections.push({ key: 'specific1', label: sectionLabels.specific1 || 'C. Específicos 1' });
    if (concurso.has_specific_knowledge_2) sections.push({ key: 'specific2', label: sectionLabels.specific2 || 'C. Específicos 2' });
    if (concurso.has_specific_knowledge_3) sections.push({ key: 'specific3', label: sectionLabels.specific3 || 'C. Específicos 3' });
    if (concurso.has_custom_knowledge) sections.push({ key: 'custom', label: sectionLabels.custom || 'C. Customizados' });
    
    // Adicionar disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.type && discipline.name) {
          sections.push({ key: discipline.type, label: discipline.name });
        }
      });
    }
    
    return sections;
  };
  
  const objectiveSections = getObjectiveSectionList();
  
  // Função utilitária para obter todas as questões de todas as seções
  const getAllQuestionsFromAllSections = () => {
    const allQuestions: number[] = [];
    
    let currentQuestionNumber = 1;
    
    // Básico
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 1
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 2
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 3
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.questionCount) {
          for (let i = 0; i < discipline.questionCount; i++) {
            allQuestions.push(currentQuestionNumber++);
          }
        }
      });
    }
    
    return allQuestions;
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-emerald-50 border-b">
        <CardTitle className="text-xl md:text-2xl">Cartão de Respostas - {concurso.titulo}</CardTitle>
        <CardDescription>
          {userRankingData?.edit_count !== undefined && userRankingData?.edit_count > 0 && (
            <div className="text-sm font-medium text-emerald-700 mt-2">
              Edições disponíveis: {editsLeft} de 3
              {!canEdit && (
                <span className="text-destructive ml-2">
                  (Você atingiu o limite de edições permitidas)
                </span>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {savedSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Respostas salvas com sucesso! Calculando pontuação...</p>
          </div>
        )}
        
        <AnswerSheetHeader concurso={concurso} getTotalQuestions={getTotalQuestions} />
        
        <ExamTypeWarning examType={concurso.exam_type as 'Alternativas' | 'Certo ou Errado'} />
        
        {hasNullifiedQuestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Questões Anuladas</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Este concurso possui {nullifiedQuestions.size} {nullifiedQuestions.size === 1 ? 'questão anulada' : 'questões anuladas'}.
                  Você receberá pontuação por estas questões independentemente da resposta marcada.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Questões anuladas: {Array.from(nullifiedQuestions).sort((a, b) => a - b).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="font-medium">Progresso: {answeredQuestions} de {totalQuestions} questões</div>
          <div className="text-sm text-gray-500">{Math.round(progressPercentage)}% completo</div>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200" />
        
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSection} 
              onValueChange={(value) => setSelectedSection(value as SectionType)}
              className="w-full"
            >
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(objectiveSections.length, 4)}, 1fr)` }}>
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <AnswerMatrix
                    matrix={createAnswerMatrix()}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    onClearAnswer={handleClearAnswer}
                    getOptionsForQuestion={getOptionsForQuestion}
                    disabled={!canEdit}
                    examType={concurso.exam_type as 'Alternativas' | 'Certo ou Errado'}
                    nullifiedQuestions={nullifiedQuestions}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
        
        {(concurso.has_discursive || concurso.has_case_study_1 || concurso.has_case_study_2 || concurso.has_case_study_3) && (
          <DiscursiveScoresSection 
            concurso={concurso}
            discursiveScore={discursiveScore}
            caseStudy1Score={caseStudy1Score}
            caseStudy2Score={caseStudy2Score}
            caseStudy3Score={caseStudy3Score}
            handleScoreChange={handleScoreChange}
            setDiscursiveScore={setDiscursiveScore}
            setCaseStudy1Score={setCaseStudy1Score}
            setCaseStudy2Score={setCaseStudy2Score}
            setCaseStudy3Score={setCaseStudy3Score}
            canEdit={canEdit}
          />
        )}
      </CardContent>
      
      <CardFooter className="p-4 bg-gray-50 border-t">
        <Button 
          onClick={handleSaveAnswers} 
          className="flex items-center w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
          disabled={isSaving || (!canEdit && userRankingData?.edit_count !== undefined)} 
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvando respostas...
            </>
          ) : !canEdit && userRankingData?.edit_count !== undefined ? (
            <>
              <AlertTriangle className="h-5 w-5 mr-2" />
              Limite de edições atingido
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Cartão de Respostas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
