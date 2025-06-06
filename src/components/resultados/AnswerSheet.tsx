
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertTriangle, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso, SectionType, isDisciplineBlock } from '@/types/concursos';
import { AnswerMatrix } from './AnswerMatrix';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscursiveScoresSection } from './DiscursiveScoresSection';
import { ExamTypeWarning } from './ExamTypeWarning';
import { getDisciplines, isHierarchicalStructure, sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';
import { checkMissingOfficialAnswers } from '@/hooks/useAnswerSheet/questionCountUtils';
import { toast } from 'sonner';

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
  const [missingOfficialAnswers, setMissingOfficialAnswers] = useState<boolean>(false);
  const [checkingOfficialAnswers, setCheckingOfficialAnswers] = useState<boolean>(true);
  const [selectedBookletId, setSelectedBookletId] = useState<string>('');

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
    setCaseStudy3Score,
    isDiscursiveSection,
    getSectionQuestions,
    isHierarchical
  } = useAnswerSheet(concurso, rankingId);

  // Fetch user ranking data
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

  // Fetch exam booklets for this concurso
  const {
    data: examBooklets,
    isLoading: isLoadingBooklets
  } = useQuery({
    queryKey: ['exam-booklets', concurso.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_booklets')
        .select('*')
        .eq('concurso_id', concurso.id)
        .order('display_order');
      if (error) throw error;
      return data || [];
    }
  });

  // Set selected booklet from user ranking data
  useEffect(() => {
    if (userRankingData?.selected_booklet && !selectedBookletId) {
      setSelectedBookletId(userRankingData.selected_booklet);
    }
  }, [userRankingData, selectedBookletId]);

  // Verify if the official answer key exists
  useEffect(() => {
    const checkOfficialAnswerKey = async () => {
      if (!concurso?.id) return;

      setCheckingOfficialAnswers(true);
      try {
        console.log(`[AnswerSheet] Verificando gabarito oficial para concurso ${concurso.id}`);
        const result = await checkMissingOfficialAnswers(concurso.id);

        if (result.missing) {
          console.warn(`[AnswerSheet] Gabarito oficial incompleto ou não encontrado!`, result);
          setMissingOfficialAnswers(true);

          // Show toast only once
          toast.warning(
            "O gabarito oficial deste concurso parece estar incompleto ou não foi configurado. " +
            "Entre em contato com o administrador.",
            { duration: 8000 }
          );
        } else {
          console.log(`[AnswerSheet] Gabarito oficial verificado e completo!`);
          setMissingOfficialAnswers(false);
        }
      } catch (err) {
        console.error('[AnswerSheet] Erro ao verificar gabarito oficial:', err);
      } finally {
        setCheckingOfficialAnswers(false);
      }
    };

    checkOfficialAnswerKey();
  }, [concurso?.id]);

  // Update section display names with custom disciplines
  useEffect(() => {
    if (concurso) {
      const updatedNames = updateSectionDisplayNames(concurso);
      setSectionLabels(updatedNames);
      console.log('[AnswerSheet] Updated section labels:', updatedNames);
    }
  }, [concurso]);

  // Define editsLeft and canEdit variables
  const editsLeft = userRankingData ? 5 - (userRankingData.edit_count || 0) : 5;
  const canEdit = editsLeft > 0;

  // Fetch nullified questions for the selected booklet
  const {
    data: nullifiedData,
    isLoading: isLoadingNullified,
    refetch: refetchNullified
  } = useQuery({
      queryKey: ['nullified-questions', concurso.id, selectedBookletId],
      queryFn: async () => {
          if (!selectedBookletId) return [];
          
          const { data, error } = await supabase
              .from('official_answer_weights')
              .select("question_number")
              .eq('concurso_id', concurso.id)
              .eq('booklet_id', selectedBookletId)
              .eq('is_nullified', true);
          if (error) throw error;
          return data;
      },
      enabled: !!selectedBookletId,
      staleTime: 30000,
      refetchOnWindowFocus: true
  });

  // Import saveAnswers hook with booklet support
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
    nullifiedQuestions,
    selectedBookletId // Passar o caderno selecionado
  });

  // Set initial subjective scores from user ranking data
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

  // Update nullified questions set
  useEffect(() => {
    if (nullifiedData && nullifiedData.length > 0) {
      const nullifiedSet = new Set(nullifiedData.map(item => item.question_number));
      setNullifiedQuestions(nullifiedSet);
      console.log('[AnswerSheet] Questões anuladas atualizadas:', Array.from(nullifiedSet).join(', '));

      // Check if there was a change in the number of nullified questions
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

    if (!selectedBookletId) {
      setError("É necessário selecionar um caderno de prova antes de salvar as respostas");
      return;
    }

    const totalQuestions = getTotalQuestions();
    const answeredQuestions = getAnsweredQuestionsCount();

    // Also consider nullified questions as "answered" for validation
    const effectivelyAnsweredQuestions = answeredQuestions +
      Array.from(nullifiedQuestions).filter(qNum => !answers[qNum]).length;

    if (effectivelyAnsweredQuestions < totalQuestions) {
      // Identify unanswered questions (excluding nullified ones)
      const unansweredQuestions = [];
      const allQuestions = getAllQuestionsFromAllSections();

      // For each question, check if it's answered or nullified
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

      // Call the saveAnswersService
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

  // Get booklet name
  const getBookletName = () => {
    if (!selectedBookletId || !examBooklets) return 'Não informado';
    const booklet = examBooklets.find(b => b.id === selectedBookletId);
    return booklet?.name || 'Não informado';
  };

  // Show warning if no booklet is selected
  if (!selectedBookletId && !isLoadingRanking) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <h3 className="text-lg font-semibold">Caderno não selecionado</h3>
          <p className="text-center text-gray-600">
            É necessário selecionar um caderno de prova antes de preencher o cartão de respostas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingRanking || isLoadingBooklets || (checkingOfficialAnswers && !missingOfficialAnswers)) {
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

  // Utility function to get all questions from all sections
  const getAllQuestionsFromAllSections = () => {
    const allQuestions = [];
    let questionNumber = 1;
    
    // Iterate through all possible questions up to the total expected
    const totalQuestions = getTotalQuestions();
    for (let i = 1; i <= totalQuestions; i++) {
      allQuestions.push(i);
    }
    
    console.log('[AnswerSheet] getAllQuestionsFromAllSections result:', allQuestions);
    return allQuestions;
  };

  // Get objective sections
  const getObjectiveSections = () => {
    if (!concurso) return [];
    
    const sections = [];
    
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      // Check if we're using the hierarchical structure (blocks -> disciplines)
      if (isHierarchical) {
        // Hierarchical structure (blocks -> disciplines)
        for (const block of concurso.disciplines) {
          // TypeGuard to check if it's a block with disciplines property
          if ('disciplines' in block) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                sections.push({
                  key: discipline.type,
                  label: discipline.name || discipline.type
                });
              }
            }
          }
        }
      } else {
        // Flat structure
        for (const discipline of concurso.disciplines) {
          // TypeGuard to check if it's a discipline
          if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
            sections.push({
              key: discipline.type,
              label: discipline.name || discipline.type
            });
          }
        }
      }
    } else {
      // Traditional structure
      if (concurso.has_basic_knowledge) {
        sections.push({ key: 'basic', label: sectionLabels.basic || 'Conhecimentos Básicos' });
      }
      
      if (concurso.has_specific_knowledge_1) {
        sections.push({ key: 'specific1', label: sectionLabels.specific1 || 'Conhecimentos Específicos 1' });
      }
      
      if (concurso.has_specific_knowledge_2) {
        sections.push({ key: 'specific2', label: sectionLabels.specific2 || 'Conhecimentos Específicos 2' });
      }
      
      if (concurso.has_specific_knowledge_3) {
        sections.push({ key: 'specific3', label: sectionLabels.specific3 || 'Conhecimentos Específicos 3' });
      }
    }
    
    console.log('[AnswerSheet] Objective sections:', sections);
    return sections;
  };

  // Handle section changes
  const handleSectionChange = (value: string) => {
    console.log('[AnswerSheet] Changing section to:', value);
    setSelectedSection(value as SectionType);
  };

  const objectiveSections = getObjectiveSections();
  const matrix = createAnswerMatrix();
  
  console.log('[AnswerSheet] Selected section:', selectedSection);
  console.log('[AnswerSheet] Answer matrix:', matrix);
  console.log('[AnswerSheet] Is hierarchical:', isHierarchical);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-emerald-50 border-b">
        <CardTitle className="text-xl md:text-2xl">
          Cartão de Respostas - {concurso.titulo}
        </CardTitle>
        <CardDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Caderno selecionado:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md font-medium">
                {getBookletName()}
              </span>
            </div>
            {userRankingData?.edit_count !== undefined && userRankingData?.edit_count > 0 && (
              <div className="text-sm font-medium text-emerald-700">
                Edições disponíveis: {editsLeft} de 5
                {!canEdit && (
                  <span className="text-destructive ml-2">
                    (Você atingiu o limite de edições permitidas)
                  </span>
                )}
              </div>
            )}
          </div>
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

        {missingOfficialAnswers && (
          <div className="bg-amber-100 border border-amber-300 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Gabarito Oficial Incompleto</h4>
                <p className="text-sm text-amber-700 mt-1">
                  O gabarito oficial deste concurso parece estar incompleto ou não foi configurado.
                  Você ainda pode preencher suas respostas, mas a pontuação pode não ser calculada corretamente.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Entre em contato com o administrador para resolver este problema.
                </p>
              </div>
            </div>
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
              onValueChange={handleSectionChange}
              className="w-full"
            >
              <TabsList className="grid w-full" style={{ 
                gridTemplateColumns: `repeat(${Math.min(objectiveSections.length, 4)}, 1fr)` 
              }}>
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <AnswerMatrix
                    matrix={section.key === selectedSection ? matrix : []}
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
