import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { GeneralTab } from '@/components/Admin/CreateRanking/GeneralTab';
import { AnswerKeyTab } from '@/components/Admin/CreateRanking/AnswerKeyTab';
import { supabase } from '@/integrations/supabase/client';
import { useSaveRanking } from '@/hooks/useSaveRanking';
import { getTotalQuestions } from '@/hooks/useAnswerSheet/questionCountUtils';
import { useEditUrls } from '@/hooks/useEditUrls';
const fetchRankingData = async rankingId => {
  if (!rankingId) return null;
  try {
    const {
      data,
      error
    } = await supabase.from('concursos').select('*').eq('id', rankingId).single();
    if (error) {
      console.error('Error fetching ranking data:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchRankingData:', error);
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
    title: 'AUDITOR'
  }, {
    id: '2',
    title: 'AUDITOR FISCAL'
  }, {
    id: '3',
    title: 'POLICIAL CIVIL'
  }, {
    id: '4',
    title: 'POLÍCIA MILITAR'
  }, {
    id: '5',
    title: 'AGENTE ADMINISTRATIVO'
  }, {
    id: '6',
    title: 'AUDITOR DE CONTROLE EXTERNO'
  }, {
    id: '7',
    title: 'ANALISTA ADMINISTRATIVO'
  }, {
    id: '8',
    title: 'TÉCNICO ADMINISTRATIVO'
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
      discursive_weight: 1,
      has_case_study_1: false,
      case_study_1_weight: 1,
      has_case_study_2: false,
      case_study_2_weight: 1,
      has_case_study_3: false,
      case_study_3_weight: 1,
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
            form.reset({
              ...data,
              localidades: data.localidades || [],
              predefined_job_title: isOtherTitle ? 'OUTRO' : data.titulo,
              custom_job_title: isOtherTitle ? data.titulo : '',
              banca: isOtherBanca ? 'OUTRO' : data.banca,
              custom_banca: isOtherBanca ? data.banca : '',
              created_at: data.created_at ? new Date(new Date(data.created_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
            });
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
    console.log('[CriarRanking] handleSaveRanking called');
    const formValues = form.getValues();
    console.log('[CriarRanking] Form values:', formValues);

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
          toast.success("Informações do ranking salvas. Agora configure e salve os cadernos de prova.");
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
          toast.success("Informações do ranking salvas. Agora configure e salve os cadernos de prova.");
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
        .select('exam_booklets, official_answers')
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
      // Redirecionar para lista de rankings em vez de URL com ID
      navigate('/pre-classificacao');
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

  return <div className="container mx-auto p-4">
      <Button variant="ghost" className="mb-4 flex items-center gap-2" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        {isAdmin ? 'Voltar para Dashboard' : 'Voltar para Rankings'}
      </Button>
      
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
                <TabsList className="mb-6">
                  <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="answer-key" disabled={!createdConcursoId && !editToken}>
                    Gabarito Oficial
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="general-info">
                  <GeneralTab form={form} jobTitles={jobTitles} isCustomTitle={isCustomTitle} isCustomBanca={isCustomBanca} handleJobTitleChange={handleJobTitleChange} handleCustomTitleChange={handleCustomTitleChange} handleBancaChange={handleBancaChange} handleOrgaoChange={handleOrgaoChange} handleNextTab={handleNextTab} onSaveRanking={handleSaveRanking} isSubmitting={isSubmitting} selectedStates={selectedStates} setSelectedStates={setSelectedStates} createdConcursoId={createdConcursoId} />
                </TabsContent>
                <TabsContent value="answer-key">
                  <div className="mb-4 flex justify-between items-center">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('general-info')}>
                      Voltar às Informações Gerais
                    </Button>
                    <Button type="button" onClick={handleGoToResults}>
                      Ir para Resultados
                    </Button>
                  </div>
                  
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