
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createRanking } from '@/integrations/supabase/rankings/concursoManager';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { GeneralTab } from '@/components/Admin/CreateRanking/GeneralTab';
import { AnswerKeyTab } from '@/components/Admin/CreateRanking/AnswerKeyTab';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fetchRankingData = async (rankingId) => {
  if (!rankingId) return null;
  
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', rankingId)
      .single();
      
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomBanca, setIsCustomBanca] = useState(false);
  const [createdConcursoId, setCreatedConcursoId] = useState<string | null>(null);
  
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('edit');
  
  const [jobTitles] = useState([
    { id: '1', title: 'Analista' },
    { id: '2', title: 'Técnico' },
    { id: '3', title: 'Auditor' },
    { id: '4', title: 'Assistente' },
    { id: '5', title: 'Especialista' }
  ]);
  
  const form = useForm({
    defaultValues: {
      predefined_job_title: '',
      custom_job_title: '',
      titulo: '',
      orgao: '',
      banca: '',
      custom_banca: '',
      data_publicacao: new Date().toISOString().split('T')[0],
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
    }
  });
  
  useEffect(() => {
    const loadExistingData = async () => {
      if (editId) {
        try {
          const data = await fetchRankingData(editId);
          if (data) {
            setCreatedConcursoId(data.id);
            
            const isOtherTitle = !jobTitles.find(jt => jt.title === data.titulo);
            setIsCustomTitle(isOtherTitle);
            
            const isOtherBanca = data.banca === 'OUTRO' || !['Cebraspe', 'FGV', 'VUNESP', 'FCC', 'FUNDATEC'].includes(data.banca);
            setIsCustomBanca(isOtherBanca);
            
            form.reset({
              ...data,
              predefined_job_title: isOtherTitle ? 'OUTRO' : data.titulo,
              custom_job_title: isOtherTitle ? data.titulo : '',
              banca: isOtherBanca ? 'OUTRO' : data.banca,
              custom_banca: isOtherBanca ? data.banca : '',
              data_publicacao: data.data_publicacao ? new Date(data.data_publicacao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
        } catch (error) {
          console.error('Error loading existing ranking data:', error);
          toast.error('Erro ao carregar dados do ranking');
        }
      }
    };
    
    loadExistingData();
  }, [editId, form, jobTitles]);
  
  useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
    }
  }, [user, navigate]);
  
  const handleJobTitleChange = (value: string) => {
    setIsCustomTitle(value === 'OUTRO');
    if (value !== 'OUTRO') {
      form.setValue('titulo', value);
    }
  };
  
  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('titulo', e.target.value);
  };
  
  const handleBancaChange = (value: string) => {
    setIsCustomBanca(value === 'OUTRO');
    if (value !== 'OUTRO') {
      form.setValue('banca', value);
    }
  };
  
  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      const dataToSubmit = {
        ...values,
        created_by_user_id: user?.id,
        titulo: values.custom_job_title || values.predefined_job_title,
        banca: values.custom_banca || values.banca
      };
      
      let result;
      
      if (editId) {
        const { data, error } = await supabase
          .from('concursos')
          .update(dataToSubmit)
          .eq('id', editId)
          .select();
          
        if (error) throw error;
        result = data;
        
        toast.success("Ranking atualizado com sucesso!");
      } else {
        result = await createRanking(dataToSubmit);
        toast.success("Ranking criado com sucesso!");
      }
      
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        
        setCreatedConcursoId(editId || (result[0]?.id));
        
        setActiveTab('answer-key');
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar ranking:", error);
      toast.error("Erro ao criar/atualizar ranking: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab === 'general-info') {
      const { orgao, banca, custom_banca, predefined_job_title, custom_job_title } = form.getValues();
      if (!orgao || (!banca && !custom_banca) || (!predefined_job_title && !custom_job_title)) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      
      if (createdConcursoId) {
        setActiveTab('answer-key');
      }
    }
  };
  
  const handleGoToResults = () => {
    if (createdConcursoId) {
      navigate(`/concurso/${createdConcursoId}/resultados`);
    }
  };
  
  const formValues = form.getValues();
  
  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-2" 
        onClick={() => navigate('/pre-classificacao')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Rankings
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {editId ? 'Editar Ranking' : createdConcursoId ? 'Ranking Criado - Adicionar Gabarito' : 'Criar Novo Ranking'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="answer-key" disabled={!createdConcursoId}>
                    Gabarito Oficial
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general-info">
                  <GeneralTab
                    form={form}
                    jobTitles={jobTitles}
                    isCustomTitle={isCustomTitle}
                    isCustomBanca={isCustomBanca}
                    handleJobTitleChange={handleJobTitleChange}
                    handleCustomTitleChange={handleCustomTitleChange}
                    handleBancaChange={handleBancaChange}
                    handleNextTab={handleNextTab}
                  />
                  
                  <div className="mb-6">
                    <Label htmlFor="exam_type">Tipo de Prova</Label>
                    <Select
                      value={form.getValues().exam_type}
                      onValueChange={(value) => form.setValue('exam_type', value)}
                    >
                      <SelectTrigger id="exam_type">
                        <SelectValue placeholder="Selecione o tipo de prova" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alternativas">Múltipla Escolha</SelectItem>
                        <SelectItem value="Certo ou Errado">Certo ou Errado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : editId ? "Salvar alterações" : "Criar Ranking"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="answer-key">
                  {createdConcursoId && (
                    <>
                      <AnswerKeyTab
                        concursoId={createdConcursoId}
                        hasBasicKnowledge={!!formValues.has_basic_knowledge}
                        hasSpecificKnowledge1={!!formValues.has_specific_knowledge_1}
                        hasSpecificKnowledge2={!!formValues.has_specific_knowledge_2}
                        hasSpecificKnowledge3={!!formValues.has_specific_knowledge_3}
                        basicKnowledgeQuestions={formValues.basic_knowledge_questions}
                        specificKnowledge1Questions={formValues.specific_knowledge_1_questions}
                        specificKnowledge2Questions={formValues.specific_knowledge_2_questions}
                        specificKnowledge3Questions={formValues.specific_knowledge_3_questions}
                        examType={formValues.exam_type}
                        alternativesCount={formValues.alternatives_count}
                      />
                      
                      <div className="flex justify-end mt-6">
                        <Button type="button" onClick={handleGoToResults}>
                          Ir para Resultados
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarRanking;
