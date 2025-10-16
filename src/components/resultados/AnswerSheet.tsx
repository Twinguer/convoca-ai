import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertTriangle, Check, HelpCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso, SectionType } from '@/types/concursos';
import { AnswerMatrix } from './AnswerMatrix';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { useAnswerSheet } from '@/hooks/useAnswerSheet/index'; // Updated import path
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubjectScoresTab } from './SubjectScoresTab';
import { ExamTypeWarning } from './ExamTypeWarning';
import { BookletSwitcher } from './BookletSwitcher';
import { sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';
import { checkMissingOfficialAnswers } from '@/hooks/useAnswerSheet/questionCountUtils';
import { getNullifiedQuestionsFromOfficialAnswers } from '@/hooks/useAnswerSheet/officialAnswersUtils';
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
  console.log('[AnswerSheet] Componente inicializado com:', {
    concursoId: concurso?.id,
    rankingId,
    hasOnSuccess: !!onSuccess
  });
  
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const [lastCheckedNullifiedCount, setLastCheckedNullifiedCount] = useState<number>(0);
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({...sectionDisplayNames});
  const [missingOfficialAnswers, setMissingOfficialAnswers] = useState<boolean>(false);
  const [checkingOfficialAnswers, setCheckingOfficialAnswers] = useState<boolean>(true);
  const [selectedBookletId, setSelectedBookletId] = useState<string>('');
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({});

  // Check for subjective content using JSONB disciplines + direct fields
  const hasSubjectiveSections = concurso.disciplines?.some(discipline => {
    if ('disciplines' in discipline) {
      // Hierarchical structure (blocks -> disciplines)
      return discipline.disciplines?.some(d => 
        d.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(d.type)
      );
    } else {
      // Flat structure
      return discipline.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type);
    }
  }) || 
  // Fallback para campos diretos (compatibilidade)
  concurso.has_discursive || 
  concurso.has_case_study_1 || 
  concurso.has_case_study_2 || 
  concurso.has_case_study_3 || 
  concurso.has_other_subjective;


  // Fetch user ranking data first to get selectedBookletId
  const {
    data: userRankingData,
    isLoading: isLoadingRanking,
    refetch: refetchRanking
  } = useQuery({
    queryKey: ['user-ranking-detail', rankingId],
    queryFn: async () => {
      console.log('[AnswerSheet] Iniciando busca de dados do ranking:', rankingId);
      
      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[AnswerSheet] Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      console.log('[AnswerSheet] Usuário autenticado:', user.id);

      const { data, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[AnswerSheet] Erro ao buscar dados do ranking:', error);
        throw error;
      }
      
      console.log('[AnswerSheet] Dados consolidados encontrados:', data?.consolidated_data);
      
      // Extrair dados do ranking específico
      const rankingData = data?.consolidated_data?.rankings?.[rankingId];
      console.log('[AnswerSheet] Dados do ranking específico:', rankingData);
      
      return rankingData || {};
    },
    staleTime: 1000
  });

  // Get selected booklet ID from user ranking data
  const selectedBookletIdFromData = userRankingData?.selected_booklet_id || '';

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
    clearAllAnswers,
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
    sectionQuestions,
    isHierarchical,
    isLoading,
    refetchAnswers
  } = useAnswerSheet(concurso, rankingId, selectedBookletIdFromData);

  // Fetch exam booklets for this concurso - MOVED UP to avoid initialization error
  const {
    data: examBooklets,
    isLoading: isLoadingBooklets
  } = useQuery({
    queryKey: ['exam-booklets', concurso.id],
    queryFn: async () => {
      console.log('[AnswerSheet] Buscando cadernos para concurso:', concurso.id);
      
      const { data, error } = await supabase
        .from('concursos')
        .select('exam_booklets')
        .eq('id', concurso.id)
        .single();
      
      if (error) {
        console.error('[AnswerSheet] Erro ao buscar cadernos:', error);
        throw error;
      }
      
      // Ordenar por display_order e retornar array
      const booklets = data?.exam_booklets || [];
      console.log('[AnswerSheet] Cadernos encontrados:', booklets);
      
      return booklets.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    }
  });

  // Update local state when data changes
  useEffect(() => {
    if (selectedBookletIdFromData && selectedBookletIdFromData !== selectedBookletId) {
      setSelectedBookletId(selectedBookletIdFromData);
      console.log('[AnswerSheet] selectedBookletId atualizado para:', selectedBookletIdFromData);
    }
  }, [selectedBookletIdFromData, selectedBookletId]);

  // Initialize selectedBookletId if not set and examBooklets are available
  useEffect(() => {
    if (!selectedBookletId && examBooklets && examBooklets.length > 0) {
      setSelectedBookletId(examBooklets[0].id);
      console.log('[AnswerSheet] selectedBookletId inicializado com primeiro caderno:', examBooklets[0].id);
    }
  }, [selectedBookletId, examBooklets]);

  // Update selectedBookletIdFromData when examBooklets become available
  useEffect(() => {
    if (!selectedBookletIdFromData && examBooklets && examBooklets.length > 0) {
      setSelectedBookletId(examBooklets[0].id);
      console.log('[AnswerSheet] selectedBookletId atualizado com primeiro caderno disponível:', examBooklets[0].id);
    }
  }, [selectedBookletIdFromData, examBooklets]);

  // Set selected booklet from user ranking data
  useEffect(() => {
    if (userRankingData?.selected_booklet && !selectedBookletId) {
      setSelectedBookletId(userRankingData.selected_booklet);
    }
  }, [userRankingData]);

  // Handle booklet change from BookletSwitcher (CORRIGIDO - Limpa totalmente o estado)
  const handleBookletChanged = async (newBookletId: string, newAnswers: Record<number, string>) => {
    console.log('[AnswerSheet] ===== INÍCIO DA TROCA DE CADERNO =====');
    console.log('[AnswerSheet] Caderno alterado para:', newBookletId);
    console.log('[AnswerSheet] Novas respostas carregadas:', newAnswers);
    console.log('[AnswerSheet] Respostas atuais antes de limpar:', answers);
    console.log('[AnswerSheet] selectedBookletId atual:', selectedBookletId);
    
    // CRÍTICO: Limpar COMPLETAMENTE o estado de respostas ANTES de atualizar
    clearAllAnswers();
    
    // Atualizar o ID do caderno selecionado
    setSelectedBookletId(newBookletId);
    
    // Carregar as novas respostas do caderno selecionado
    // Usar setAnswers diretamente para garantir substituição completa
    const numberedAnswers: { [key: number]: string } = {};
    Object.entries(newAnswers).forEach(([questionNum, answer]) => {
      numberedAnswers[parseInt(questionNum)] = answer;
    });
    
    console.log('[AnswerSheet] Carregando novas respostas (formato numérico):', numberedAnswers);
    
    // Forçar re-fetch das respostas do backend para garantir dados corretos
    await refetchAnswers();
    
    toast.success(`Caderno alterado para ${getBookletName(newBookletId)}. Respostas carregadas.`);
  };

  // Verify if the official answer key exists
  useEffect(() => {
    const checkOfficialAnswerKey = async () => {
      if (!concurso?.id) return;

      setCheckingOfficialAnswers(true);
      try {
        console.log(`[AnswerSheet] Verificando gabarito oficial para concurso ${concurso.id}`);
        
        // AGUARDAR examBooklets estarem carregados antes de verificar
        if (!examBooklets || examBooklets.length === 0) {
          console.log('[AnswerSheet] Aguardando cadernos carregarem...');
          return;
        }
        
        // Usar selectedBookletIdFromData se disponível, senão usar o primeiro caderno
        const bookletToCheck = selectedBookletIdFromData || examBooklets[0].id;
        console.log('[AnswerSheet] Verificando gabarito para caderno:', bookletToCheck);
        
        const result = await checkMissingOfficialAnswers(concurso.id, bookletToCheck);

        if (result) {
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
  }, [concurso?.id, examBooklets, selectedBookletIdFromData]);

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
      queryKey: ['nullified-questions', concurso.id, selectedBookletIdFromData],
      queryFn: async () => {
          if (!selectedBookletIdFromData) return [];
          
          console.log('[AnswerSheet] Fetching nullified questions using official answers');
          return await getNullifiedQuestionsFromOfficialAnswers(concurso.id, selectedBookletIdFromData);
      },
      enabled: !!selectedBookletIdFromData,
      staleTime: 300000, // 5 minutos - reduzir queries desnecessárias
      refetchOnWindowFocus: false, // Desabilitado para melhor performance
      refetchInterval: false // Desabilitado - era muito agressivo (5s)
  });

  // Import saveAnswers hook with booklet support (CORRIGIDO para reagir a mudanças no selectedBookletId)
  console.log('[AnswerSheet] Parâmetros para useSaveAnswers:', {
    rankingId,
    concursoId: concurso?.id,
    selectedBookletIdFromData,
    editCount: userRankingData?.edit_count || 0,
    answersCount: Object.keys(answers).length
  });

  console.log('[AnswerSheet] DEBUG - Parâmetros para useSaveAnswers:', {
    selectedBookletIdFromData,
    selectedBookletIdFromDataType: typeof selectedBookletIdFromData,
    selectedBookletIdFromDataLength: selectedBookletIdFromData?.length,
    selectedBookletIdFromDataTrimmed: selectedBookletIdFromData?.trim(),
    isEmpty: selectedBookletIdFromData?.trim() === '',
    isUndefined: selectedBookletIdFromData === undefined
  });

  const { handleSaveAnswers: saveAnswersService } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore: subjectScores.discursive || 0,
    caseStudy1Score: subjectScores.case_study_1 || 0,
    caseStudy2Score: subjectScores.case_study_2 || 0,
    caseStudy3Score: subjectScores.case_study_3 || 0,
    subjectScores,
    editCount: userRankingData?.edit_count || 0,
    nullifiedQuestions,
    selectedBookletId: selectedBookletIdFromData // CRÍTICO: Reage a mudanças no caderno selecionado
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
  }, [userRankingData, setDiscursiveScore, setCaseStudy1Score, setCaseStudy2Score, setCaseStudy3Score]);

  // Initialize subject_scores from user ranking data - VERIFICAR ESTRUTURA JSONB + CAMPOS DIRETOS
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    
    // 1. Se há dados do banco, usar como base (mas filtrar apenas subjetivas ativas)
    if (userRankingData?.subject_scores) {
      // Preservar apenas as chaves subjetivas que estão ativas no concurso
      if (concurso.has_discursive && userRankingData.subject_scores.discursive !== undefined) {
        initialScores.discursive = userRankingData.subject_scores.discursive;
      }
      if (concurso.has_case_study_1 && userRankingData.subject_scores.case_study_1 !== undefined) {
        initialScores.case_study_1 = userRankingData.subject_scores.case_study_1;
      }
      if (concurso.has_case_study_2 && userRankingData.subject_scores.case_study_2 !== undefined) {
        initialScores.case_study_2 = userRankingData.subject_scores.case_study_2;
      }
      if (concurso.has_case_study_3 && userRankingData.subject_scores.case_study_3 !== undefined) {
        initialScores.case_study_3 = userRankingData.subject_scores.case_study_3;
      }
      if (concurso.has_other_subjective && userRankingData.subject_scores.other_subjective !== undefined) {
        initialScores.other_subjective = userRankingData.subject_scores.other_subjective;
      }
    }
    
    // 2. VERIFICAR ESTRUTURA JSONB DAS DISCIPLINAS (sistema atual)
    if (concurso.disciplines) {
      concurso.disciplines.forEach(discipline => {
        if ('disciplines' in discipline) {
          // Estrutura hierárquica (blocos)
          discipline.disciplines?.forEach(d => {
            if (d.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(d.type)) {
              initialScores[d.type] = initialScores[d.type] || 0;
            }
          });
        } else {
          // Estrutura plana
          if (discipline.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type)) {
            initialScores[discipline.type] = initialScores[discipline.type] || 0;
          }
        }
      });
    }
    
    // 3. FALLBACK: aplicar os campos diretos (compatibilidade)
    if (concurso.has_discursive) {
      initialScores.discursive = initialScores.discursive || 0;
    }
    if (concurso.has_case_study_1) {
      initialScores.case_study_1 = initialScores.case_study_1 || 0;
    }
    if (concurso.has_case_study_2) {
      initialScores.case_study_2 = initialScores.case_study_2 || 0;
    }
    if (concurso.has_case_study_3) {
      initialScores.case_study_3 = initialScores.case_study_3 || 0;
    }
    if (concurso.has_other_subjective) {
      initialScores.other_subjective = initialScores.other_subjective || 0;
    }
    
    console.log('[AnswerSheet] DEBUG - InitialScores calculados:', initialScores);
    setSubjectScores(initialScores);
  }, [userRankingData, concurso]);

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
  }, [nullifiedData, lastCheckedNullifiedCount]);

  // Certifique-se de que setSelectedBookletId é usado corretamente após salvar as respostas
  useEffect(() => {
    if (savedSuccess) {
      console.log('[AnswerSheet] Respostas salvas com sucesso. Atualizando estado do caderno.');
      refetchRanking();
      // Atualizar o estado do caderno após refetch
      const updateBookletId = async () => {
        // Buscar dados do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: updatedRanking } = await supabase
          .from('user_rankings')
          .select('consolidated_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (updatedRanking?.consolidated_data?.rankings?.[rankingId]?.selected_booklet_id) {
          setSelectedBookletId(updatedRanking.consolidated_data.rankings[rankingId].selected_booklet_id);
        }
      };
      updateBookletId();
    }
  }, [savedSuccess]);

  const handleSaveAnswers = async () => {
    if (!concurso?.id) {
      setError("ID do concurso não encontrado");
      return;
    }

    if (!selectedBookletIdFromData) {
      setError("É necessário selecionar um caderno de prova antes de salvar as respostas");
      return;
    }

    console.log('[AnswerSheet.handleSaveAnswers] DEBUG - Caderno selecionado no momento do salvamento:', selectedBookletIdFromData);
    console.log('[AnswerSheet.handleSaveAnswers] DEBUG - Respostas atuais:', answers);

    const totalQuestions = getTotalQuestions();
    const answeredQuestions = getAnsweredQuestionsCount();

    // Also consider nullified questions as "answered" for validation
    const effectivelyAnsweredQuestions = answeredQuestions +
      Array.from(nullifiedQuestions).filter(qNum => !answers[qNum]).length;

    console.log('[AnswerSheet.handleSaveAnswers] DEBUG - Validação de questões:', {
      totalQuestions,
      answeredQuestions,
      nullifiedQuestions: Array.from(nullifiedQuestions),
      effectivelyAnsweredQuestions,
      examType: concurso.exam_type,
      answers: Object.keys(answers).length
    });

    // Para provas "Certo ou Errado", permitir questões em branco
    // Para provas de múltipla escolha, exigir todas as respostas
    const isCertoErrado = concurso.exam_type === 'Certo ou Errado';
    
    if (!isCertoErrado && effectivelyAnsweredQuestions < totalQuestions) {
      // Identify unanswered questions (excluding nullified ones) - APENAS para múltipla escolha
      const unansweredQuestions = [];
      const allQuestions = getAllQuestionsFromAllSections();

      // For each question, check if it's answered or nullified
      for (const qNum of allQuestions) {
        if (!answers[qNum] && !nullifiedQuestions.has(qNum)) {
          unansweredQuestions.push(qNum);
        }
      }

      if (unansweredQuestions.length > 0) {
        console.log('[AnswerSheet.handleSaveAnswers] AVISO - Questões não respondidas:', unansweredQuestions);
        console.log('[AnswerSheet.handleSaveAnswers] PERMITINDO SALVAMENTO MESMO COM QUESTÕES VAZIAS');
        // COMENTADO PARA PERMITIR SALVAMENTO EM consolidated_data
        // setError(`Existem questões que precisam ser respondidas: ${unansweredQuestions.sort((a, b) => a - b).join(', ')}`);
        // return;
      }
    }

    try {
      console.log("[AnswerSheet] Iniciando processo de salvamento");
      console.log("[AnswerSheet] Chamando saveAnswersService para salvar em consolidated_data");
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

  const handleSubjectScoreChange = (key: string, value: number) => {
    setSubjectScores(prev => ({ ...prev, [key]: value }));
  };

  // Get booklet name
  const getBookletName = (bookletId?: string) => {
    if (!bookletId || !examBooklets) return 'Não informado';
    const booklet = examBooklets.find(b => b.id === bookletId);
    return booklet?.name || 'Não informado';
  };

  // Show warning if no booklet is selected
  console.log('[AnswerSheet] Verificando condições de renderização:', {
    selectedBookletIdFromData,
    isLoadingRanking,
    isLoadingBooklets,
    checkingOfficialAnswers,
    missingOfficialAnswers,
    examBooklets: examBooklets?.length
  });

  if (!selectedBookletIdFromData && !isLoadingRanking) {
    console.log('[AnswerSheet] Mostrando aviso: Caderno não selecionado');
    return (
      <Card className="shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <h3 className="text-lg font-semibold">Caderno não selecionado</h3>
          <p className="text-center text-muted-foreground">
            É necessário selecionar um caderno de prova antes de preencher o cartão de respostas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingRanking || isLoadingBooklets || (checkingOfficialAnswers && !missingOfficialAnswers)) {
    return <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">Carregando cartão de respostas...</p>
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
    
    // Iterate through all possible questions up to the total expected
    const totalQuestions = getTotalQuestions();
    for (let i = 1; i <= totalQuestions; i++) {
      allQuestions.push(i);
    }
    
    return allQuestions;
  };

  // Get objective sections
  const getObjectiveSections = (sectionQuestionsData: any) => {
    if (!concurso) return [];
    
    const sections = [];
    
    // SEMPRE usar a estrutura de disciplinas do concurso (prioridade máxima)
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      
      // Check if we're using the hierarchical structure (blocks -> disciplines)
      const isHierarchicalStructure = concurso.disciplines.length > 0 && 
                                    concurso.disciplines[0] && 
                                    typeof concurso.disciplines[0] === 'object' && 
                                    'name' in concurso.disciplines[0] && 
                                    'disciplines' in concurso.disciplines[0];
      
      
      if (isHierarchicalStructure) {
        // Hierarchical structure (blocks -> disciplines)
        for (const block of concurso.disciplines) {
          // TypeGuard to check if it's a block with disciplines property
          if ('disciplines' in block) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                sections.push({
                  key: discipline.type,
                  label: `${block.name} - ${discipline.name}`
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
          console.warn('[getObjectiveSections] No disciplines found, returning empty sections');
        }
        
        return sections;
  };

  // Handle section changes
  const handleSectionChange = (value: string) => {
    setSelectedSection(value as SectionType);
  };

  const objectiveSections = getObjectiveSections(sectionQuestions);
  const matrix = createAnswerMatrix();
  

  return (
    <Card className="shadow-lg w-full h-full mx-auto p-4">
      <CardHeader className="bg-muted/30 border-b border-border">
        <CardTitle className="text-xl md:text-2xl">
          Cartão de Respostas - {concurso.titulo}
        </CardTitle>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="font-medium">Caderno selecionado:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-medium break-words max-w-full">
              {getBookletName(selectedBookletIdFromData)}
            </span>
          </div>
          {userRankingData?.edit_count !== undefined && userRankingData?.edit_count > 0 && (
            <div className="text-sm font-medium text-primary">
              Edições disponíveis: {editsLeft} de 5
              {!canEdit && (
                <span className="text-destructive ml-2">
                  (Você atingiu o limite de edições permitidas)
                </span>
              )}
            </div>
          )}
        </div>
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

        {/* Booklet Switcher - NOVO */}
        {examBooklets && examBooklets.length > 1 && selectedBookletIdFromData && (
          <BookletSwitcher
            booklets={examBooklets}
            currentBookletId={selectedBookletIdFromData}
            rankingId={rankingId}
            onBookletChanged={handleBookletChanged}
            disabled={isSaving}
          />
        )}

        {hasNullifiedQuestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800"></h4>
                <p className="text-sm text-amber-700 mt-1">
                  Este concurso possui {nullifiedQuestions.size} {nullifiedQuestions.size === 1 ? 'questão anulada' : 'questões anuladas'}.
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Questão anulada: {Array.from(nullifiedQuestions).sort((a, b) => a - b).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="font-medium">Progresso: {answeredQuestions} de {totalQuestions} questões</div>
          <div className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% completo</div>
        </div>
        <Progress value={progressPercentage} className="h-2" />

        {/* Sistema de Abas Unificado - Objetivas + Subjetivas */}
        <div className="space-y-4">
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs
              value={selectedSection}
              onValueChange={handleSectionChange}
              className="w-full"
            >
              <TabsList className="grid w-full" style={{ 
                gridTemplateColumns: `repeat(${Math.min(objectiveSections.length + (hasSubjectiveSections ? 1 : 0), 6)}, 1fr)` 
              }}>
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
                {hasSubjectiveSections && (
                  <TabsTrigger key="subjetivas" value="subjetivas">
                    Subjetivas
                  </TabsTrigger>
                )}
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

              {hasSubjectiveSections && (
                <TabsContent key="subjetivas" value="subjetivas">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Pontuações Subjetivas</h3>
                    <SubjectScoresTab
                      concurso={concurso}
                      subjectScores={subjectScores}
                      onSubjectScoreChange={handleSubjectScoreChange}
                      canEdit={canEdit}
                    />
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 bg-muted/30 border-t border-border">
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