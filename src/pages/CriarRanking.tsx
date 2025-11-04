import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { GeneralTab } from '@/components/Admin/CreateRanking/GeneralTab';
import { AnswerKeyTab } from '@/components/Admin/CreateRanking/AnswerKeyTab';
import { supabase } from '@/integrations/supabase/client';
import { useSaveRanking } from '@/hooks/useSaveRanking';
import { getTotalQuestions } from '@/hooks/useAnswerSheet/questionCountUtils';
import { useEditUrls } from '@/hooks/useEditUrls';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { ProFeatureGuard } from '@/components/Subscription/ProFeatureGuard';
const fetchRankingData = async rankingId => {
  if (!rankingId) return null;
  try {
    const {
      data,
      error
    } = await supabase.from('concursos').select('*').eq('id', rankingId).single();
    if (error) {
      // Debug logs removed for security
      throw error;
    }
    return data;
  } catch (error) {
    // Debug logs removed for security
    return null;
  }
};
const CriarRanking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const { validateEditToken } = useEditUrls();
  const { canCreateRanking, maxRankings, currentRankingCount, isPro, isLoading: isLoadingLimits } = usePlanLimits();
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomBanca, setIsCustomBanca] = useState(false);
  const [createdConcursoId, setCreatedConcursoId] = useState<string | null>(null);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const editToken = searchParams.get('edit');
  const isAdmin = searchParams.get('admin') === 'true';
  const [jobTitles] = useState([{
    id: '1',
    title: 'TCU'
  }, {
    id: '2',
    title: 'CGU'
  }, {
    id: '3',
    title: 'INSS'
  }, {
    id: '4',
    title: 'CNU'
  }, {
    id: '5',
    title: 'SENADO FEDERAL'
  }, {
    id: '6',
    title: 'CÂMARA DOS DEPUTADOS'
  }, {
    id: '7',
    title: 'POLICIA FEDERAL'
  }, {
    id: '8',
    title: 'POLICIA RODOVIARIA FEDERAL'
  }, {
    id: '9',
    title: 'OUTRO'
  }]);
  const form = useForm({
    defaultValues: {
      predefined_job_title: '',
      custom_job_title: '',
      titulo: '',
      orgao: '',
      banca: '',
      custom_banca: '',
      created_at: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      etapa_atual: 'Prova Objetiva',
      status: 'Em andamento',
      link: '',
      vagas: 0,
      inscritos: 0,
      exam_type: 'Alternativas',
      alternatives_count: 5,
      wrong_answer_penalty: 0,
      has_basic_knowledge: true,
      basic_knowledge_questions: 0,
      basic_knowledge_weight: 1,
      has_specific_knowledge_1: false,
      specific_knowledge_1_questions: 0,
      specific_knowledge_1_weight: 1,
      has_specific_knowledge_2: false,
      specific_knowledge_2_questions: 0,
      specific_knowledge_2_weight: 1,
      has_specific_knowledge_3: false,
      specific_knowledge_3_questions: 0,
      specific_knowledge_3_weight: 1,
      has_discursive: false,
      has_case_study_1: false,
      has_case_study_2: false,
      has_case_study_3: false,
      has_other_subjective: false,
      other_subjective_name: '',
      // Pontuação mínima geral
      has_minimum_score: false,
      minimum_score_unit_type: 'percentage',
      total_minimum_score: 0,
      // Pontuação mínima para cotas
      has_quota_minimum_score: false,
      quota_minimum_score: 0,
      quota_minimum_score_unit_type: 'percentage',
      // Notas mínimas para questões subjetivas
      discursive_minimum_score: 0,
      case_study_1_minimum_score: 0,
      case_study_2_minimum_score: 0,
      case_study_3_minimum_score: 0,
      other_subjective_minimum_score: 0,
      // Notas mínimas para cotas das questões subjetivas
      discursive_minimum_score_cotas: 0,
      case_study_1_minimum_score_cotas: 0,
      case_study_2_minimum_score_cotas: 0,
      case_study_3_minimum_score_cotas: 0,
      other_subjective_minimum_score_cotas: 0,
      // Estrutura de disciplinas (inicializada vazia)
      disciplines: [],
      has_ampla_concorrencia: true,
      has_ppp: false,
      has_pcd: false,
      has_hipossuficientes: false,
      has_indigenas: false,
      has_transsexuais: false,
      localidades: []
    }
  });

  // Validar token de edição se presente
  useEffect(() => {
    const validateEditTokenAsync = async () => {
      if (editToken) {
        setIsValidatingToken(true);
        try {
          const validConcursoId = await validateEditToken(editToken);
          if (validConcursoId) {
            // Token válido, continuar com a edição
            setCreatedConcursoId(validConcursoId);
          } else {
            // Token inválido ou expirado
            toast.error('Link de edição inválido ou expirado');
            navigate('/criar-ranking');
          }
        } catch (error) {
          console.error('Erro ao validar token de edição:', error);
          toast.error('Erro ao validar link de edição');
          navigate('/criar-ranking');
        } finally {
          setIsValidatingToken(false);
        }
      }
    };

    validateEditTokenAsync();
  }, [editToken, validateEditToken, navigate]);

  useEffect(() => {
    const loadExistingData = async () => {
      if (editToken) {
        try {
          const data = await fetchRankingData(createdConcursoId);
          if (data) {
            setCreatedConcursoId(data.id);
            const isOtherTitle = !jobTitles.find(jt => jt.title === data.titulo);
            setIsCustomTitle(isOtherTitle);
            const isOtherBanca = data.banca === 'OUTRO' || !['Cebraspe', 'FGV', 'VUNESP', 'FCC', 'FUNDATEC'].includes(data.banca);
            setIsCustomBanca(isOtherBanca);

            // Configurar as localidades
            if (data.localidades && Array.isArray(data.localidades)) {
              setSelectedStates(data.localidades);
            }
            // Mapear dados das cotas do JSONB para os campos do formulário
            const quotaData = data.has_cota || {};
            const subjectsData = data.subjects || {};
            
            // ✅ Extrair minimum scores e blocos da nova estrutura JSONB
            let minimumTotalScore = 0;
            let minimumTotalScoreCotas = 0;
            let wrongAnswerPenalty = 0;
            let disciplinesBlocks = [];
            
            if (data.disciplines) {
              // Nova estrutura: campos no nível raiz com array blocks
              if (data.disciplines.minimum_total_score !== undefined) {
                minimumTotalScore = data.disciplines.minimum_total_score || 0;
              }
              if (data.disciplines.minimum_total_score_cotas !== undefined) {
                minimumTotalScoreCotas = data.disciplines.minimum_total_score_cotas || 0;
              }
              if (data.disciplines.wrong_answer_penalty !== undefined) {
                wrongAnswerPenalty = data.disciplines.wrong_answer_penalty || 0;
              }
              if (data.disciplines.blocks && Array.isArray(data.disciplines.blocks)) {
                // Converter estrutura JSONB para o formato esperado pelo form
                disciplinesBlocks = data.disciplines.blocks.map((b: any) => ({
                  id: b.blockId ?? b.id,
                  name: b.blockName ?? b.name,
                  minimum_score: Number(b.blockMinimumScore ?? b.minimum_score ?? 0),
                  minimum_score_cotas: Number(b.blockMinimumCotas ?? b.minimum_score_cotas ?? 0),
                  disciplines: (b.disciplines || []).map((d: any) => ({
                    ...d,
                    minimum_score: Number(d.minimum_score || 0),
                    minimum_score_cotas: Number(d.minimum_score_cotas || 0),
                    weight: Number(d.weight || 1),
                    questionCount: Number(d.questionCount || 0),
                    isEnabled: d.isEnabled !== false
                  }))
                }));
              }
              
              // Debug logs removed for security
            }
            
            // Criar objeto de dados para o formulário
            const formData = {
              ...data,
              localidades: data.localidades || [],
              predefined_job_title: isOtherTitle ? 'OUTRO' : data.titulo,
              custom_job_title: isOtherTitle ? data.titulo : '',
              banca: isOtherBanca ? 'OUTRO' : data.banca,
              custom_banca: isOtherBanca ? data.banca : '',
              created_at: data.created_at ? new Date(new Date(data.created_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
              // Campos básicos do concurso
              vagas: data.vagas || 0,
              inscritos: data.inscritos || 0,
              etapa_atual: data.etapa_atual || 'Prova Objetiva',
              link: data.link || '',
              // Mapear cotas do JSONB para campos do formulário
              has_ampla_concorrencia: true, // Sempre true
              has_ppp: quotaData.ppp === true,
              has_pcd: quotaData.pcd === true,
              has_hipossuficientes: quotaData.hip === true,
              has_indigenas: quotaData.ind === true,
              has_transsexuais: quotaData.tra === true,
              
              // ✅ Minimum scores globais da nova estrutura JSONB
              minimumTotalScore: minimumTotalScore,
              minimumTotalScoreCotas: minimumTotalScoreCotas,
              wrong_answer_penalty: wrongAnswerPenalty,
              
              // ✅ Blocos de disciplinas da nova estrutura JSONB
              disciplines: disciplinesBlocks,
              
              // Mapear disciplinas subjetivas do JSONB
              has_discursive: subjectsData.discr === true,
              has_case_study_1: subjectsData.case1 === true,
              has_case_study_2: subjectsData.case2 === true,
              has_case_study_3: subjectsData.case3 === true,
              has_other_subjective: subjectsData.other === true,
              other_subjective_name: subjectsData.name_other || '',
              discursive_minimum_score: subjectsData.discr_min_score || 0,
              case_study_1_minimum_score: subjectsData.case1_min_score || 0,
              case_study_2_minimum_score: subjectsData.case2_min_score || 0,
              case_study_3_minimum_score: subjectsData.case3_min_score || 0,
              other_subjective_minimum_score: subjectsData.other_min_score || 0,
              // ✅ Mapear valores das cotas das subjetivas do JSONB
              discursive_minimum_score_cotas: subjectsData.discr_min_score_cotas || 0,
              case_study_1_minimum_score_cotas: subjectsData.case1_min_score_cotas || 0,
              case_study_2_minimum_score_cotas: subjectsData.case2_min_score_cotas || 0,
              case_study_3_minimum_score_cotas: subjectsData.case3_min_score_cotas || 0,
              other_subjective_minimum_score_cotas: subjectsData.other_min_score_cotas || 0
            };
            
            
            form.reset(formData);
            
          }
        } catch (error) {
          console.error('Error loading existing ranking data:', error);
          toast.error('Erro ao carregar dados do ranking');
        }
      }
    };
    loadExistingData();
  }, [createdConcursoId, form, jobTitles]);
  useEffect(() => {
    // Se não for admin, verifica login
    if (!isAdmin && !user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
    }
  }, [user, navigate, isAdmin]);
  const handleJobTitleChange = (value: string) => {
    setIsCustomTitle(value === 'OUTRO');
    if (value !== 'OUTRO') {
      form.setValue('titulo', value.toUpperCase());
    }
  };
  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('titulo', e.target.value.toUpperCase());
  };
  const handleBancaChange = (value: string) => {
    setIsCustomBanca(value === 'OUTRO');
    if (value !== 'OUTRO') {
      form.setValue('banca', value);
    }
  };
  const handleOrgaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('orgao', e.target.value.toUpperCase());
  };
  const { 
    saveRanking
  } = useSaveRanking();
  const handleSaveRanking = async (): Promise<string | null> => {
    // Debug logs removed for security
    const formValues = form.getValues();
    // Debug logs removed for security

    // Sincronizar os estados selecionados com o formulário
    form.setValue('localidades', selectedStates, {
      shouldDirty: true
    });
    formValues.localidades = selectedStates;

    // Adicionar flags de admin se necessário
    if (isAdmin) {
      const formValuesWithAdminFlags = {
        ...formValues,
        is_admin_created: true,
        is_admin_update: true
      };
      setIsSubmitting(true);
      try {
        const saveResult = await saveRanking({
          formValues: formValuesWithAdminFlags,
          userId: user?.id,
          editId: createdConcursoId,
          jobTitles
        });
        if (saveResult?.duplicated) {
          setIsSubmitting(false);
          return null;
        }
        if (saveResult?.id) {
          setCreatedConcursoId(saveResult.id);
          // Invalidar queries para recarregar os cadernos
          queryClient.invalidateQueries({
            queryKey: ['exam-booklets']
          });
          return saveResult.id;
        }
        queryClient.invalidateQueries({
          queryKey: ['rankings']
        });
        return createdConcursoId; // quando editando, retorna o id já existente
      } catch (error) {
        console.error("Erro ao salvar ranking:", error);
        toast.error("Erro ao salvar ranking: " + (error as Error).message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Para usuários não-admin, manter o fluxo original
      setIsSubmitting(true);
      try {
        const saveResult = await saveRanking({
          formValues,
          userId: user?.id,
          editId: createdConcursoId,
          jobTitles
        });
        if (saveResult?.duplicated) {
          setIsSubmitting(false);
          return null;
        }
        if (saveResult?.id) {
          setCreatedConcursoId(saveResult.id);
          // Invalidar queries para recarregar os cadernos
          queryClient.invalidateQueries({
            queryKey: ['exam-booklets']
          });
          return saveResult.id;
        }
        queryClient.invalidateQueries({
          queryKey: ['rankings']
        });
        return createdConcursoId; // quando editando sem novo id
      } catch (error) {
        console.error("Erro ao salvar ranking:", error);
        toast.error("Erro ao salvar ranking: " + (error as Error).message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Atualizado para permitir edição antes de salvar o gabarito
  const handleNextTab = async () => {
    // Verificar se todos os gabaritos oficiais foram preenchidos antes de ir para resultados
    if (activeTab === 'answer-key') {
      // Aqui validamos se todos os cadernos têm gabarito completo
      const isComplete = await checkAnswerKeyCompleteness();
      if (!isComplete) {
        toast.error('Por favor, preencha o gabarito oficial de todos os cadernos antes de prosseguir.');
        return;
      }
    }
    setActiveTab('answer-key');
  };

  const checkAnswerKeyCompleteness = async (): Promise<boolean> => {
    if (!createdConcursoId) return false;
    
    try {
      // Buscar dados completos do concurso
      const { data: rankingData, error: rankingError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', createdConcursoId)
        .single();
      
      if (rankingError || !rankingData) {
        toast.error('Erro ao buscar dados do concurso');
        return false;
      }
      
      // Buscar dados do concurso (cadernos e gabarito)
      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', createdConcursoId)
        .single();
      
      if (concursoError || !concursoData) {
        toast.error('Erro ao buscar dados do concurso');
        return false;
      }
      
      const booklets = concursoData?.exam_booklets || [];
      
      if (!booklets || booklets.length === 0) {
        toast.error('Nenhum caderno configurado');
        return false;
      }
      
      if (!concursoData?.official_answers || Object.keys(concursoData.official_answers).length === 0) {
        toast.error('Gabarito oficial não encontrado');
        return false;
      }
      
      const totalQuestions = getTotalQuestions(concursoData);
      
      // Verificar se todos os cadernos têm gabarito completo
      for (const booklet of booklets) {
        const bookletAnswers = concursoData.official_answers[booklet.id];
        if (!bookletAnswers?.questions) {
          toast.error(`Caderno "${booklet.name}" não possui gabarito oficial`);
          return false;
        }
        
        const answerCount = Object.keys(bookletAnswers.questions).length;
        if (answerCount < totalQuestions) {
          toast.error(`Caderno "${booklet.name}" possui apenas ${answerCount} de ${totalQuestions} questões`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar gabaritos:', error);
      toast.error('Erro ao verificar gabaritos oficiais');
      return false;
    }
  };
  const handleGoToResults = () => {
    if (createdConcursoId) {
      // Redirecionar para a classificação específica do ranking criado
      navigate(`/ranking/${createdConcursoId}`);
    }
  };
  const handleBack = () => {
    if (isAdmin) {
      navigate('/project/admin/man/concursos');
    } else {
      navigate('/pre-classificacao');
    }
  };

  // Mostrar loading enquanto valida o token de edição
  if (isValidatingToken) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Validando link de edição...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificar limite de rankings (apenas se não for edição/admin) - DEPOIS de todos os hooks
  if (!editToken && !isAdmin && !isLoadingLimits && !canCreateRanking) {
    return (
      <div className="container mx-auto p-4">
        <ProFeatureGuard
          featureName="Criar Ranking"
        />
      </div>
    );
  }

  return <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {editToken ? 'Editar Ranking' : createdConcursoId ? 'Ranking Criado - Adicionar Gabarito' : 'Criar Novo Ranking'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={e => e.preventDefault()}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                    <TabsTrigger value="answer-key" disabled={!createdConcursoId && !editToken}>
                      Gabarito Oficial
                    </TabsTrigger>
                  </TabsList>
                  {activeTab === 'answer-key' && (
                    <Button type="button" onClick={handleGoToResults}>
                      Ir para Resultados
                    </Button>
                  )}
                </div>
                <TabsContent value="general-info">
                  <GeneralTab form={form} jobTitles={jobTitles} isCustomTitle={isCustomTitle} isCustomBanca={isCustomBanca} handleJobTitleChange={handleJobTitleChange} handleCustomTitleChange={handleCustomTitleChange} handleBancaChange={handleBancaChange} handleOrgaoChange={handleOrgaoChange} handleNextTab={handleNextTab} onSaveRanking={handleSaveRanking} isSubmitting={isSubmitting} selectedStates={selectedStates} setSelectedStates={setSelectedStates} createdConcursoId={createdConcursoId} />
                </TabsContent>
                <TabsContent value="answer-key">
                  {(createdConcursoId || editToken) && <AnswerKeyTab concursoId={createdConcursoId || ''} onGoToResults={handleGoToResults} />}
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>;
};
export default CriarRanking;