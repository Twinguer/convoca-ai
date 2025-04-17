
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';
import { AnswerKeySection } from '@/components/Admin/FormSections/AnswerKeySection';
import { createRanking } from '@/integrations/supabase/rankings/concursoManager';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';

const CriarRanking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomBanca, setIsCustomBanca] = useState(false);
  const [createdRankingId, setCreatedRankingId] = useState<string | null>(null);
  
  // Job titles for dropdown
  const [jobTitles] = useState([
    { id: '1', title: 'Analista' },
    { id: '2', title: 'Técnico' },
    { id: '3', title: 'Auditor' },
    { id: '4', title: 'Assistente' },
    { id: '5', title: 'Especialista' }
  ]);
  
  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      // General Info
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
      
      // Exam Structure
      exam_type: 'Alternativas',
      alternatives_count: 5,
      wrong_answer_penalty: 0,
      
      // Knowledge Areas
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
      
      // Discursive/Essay
      has_discursive: false,
      discursive_weight: 1,
      
      // Case Studies
      has_case_study_1: false,
      case_study_1_weight: 1,
      
      has_case_study_2: false,
      case_study_2_weight: 1,
      
      has_case_study_3: false,
      case_study_3_weight: 1,
      
      // Reservation Quotas
      has_ampla_concorrencia: true,
      has_ppp: false,
      has_pcd: false,
      has_hipossuficientes: false,
      has_indigenas: false,
      has_transsexuais: false,
    }
  });
  
  // Check if user is authenticated
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
      // Transform data from React Hook Form format to the format expected by createRanking
      const dataToSubmit = {
        ...values,
        created_by_user_id: user?.id,
        titulo: values.custom_job_title || values.predefined_job_title,
        banca: values.custom_banca || values.banca
      };
      
      const result = await createRanking(dataToSubmit);
      
      if (result) {
        toast.success("Ranking criado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        setCreatedRankingId(result[0].id);
        setActiveTab('answer-key');
      }
    } catch (error) {
      console.error("Erro ao criar ranking:", error);
      toast.error("Erro ao criar ranking: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleViewResults = () => {
    if (createdRankingId) {
      navigate(`/concurso/${createdRankingId}/resultados`);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab === 'general-info') {
      // Validate general info fields
      const { orgao, banca, custom_banca, predefined_job_title, custom_job_title } = form.getValues();
      if (!orgao || (!banca && !custom_banca) || (!predefined_job_title && !custom_job_title)) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      setActiveTab('exam-structure');
    } else if (activeTab === 'exam-structure') {
      const formValues = form.getValues();
      // Validate exam structure fields
      if (
        (formValues.has_basic_knowledge && !formValues.basic_knowledge_questions) ||
        (formValues.has_specific_knowledge_1 && !formValues.specific_knowledge_1_questions)
      ) {
        toast.error("Preencha o número de questões para todas as áreas selecionadas");
        return;
      }
      setActiveTab('quotas');
    }
  };
  
  const handlePreviousTab = () => {
    if (activeTab === 'exam-structure') {
      setActiveTab('general-info');
    } else if (activeTab === 'quotas') {
      setActiveTab('exam-structure');
    }
  };
  
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
          <CardTitle className="text-2xl font-bold">Criar Novo Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="exam-structure">Estrutura da Prova</TabsTrigger>
                  <TabsTrigger value="quotas">Cotas</TabsTrigger>
                  <TabsTrigger value="answer-key" disabled={!createdRankingId}>Gabarito Oficial</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general-info">
                  <GeneralInfoSection 
                    form={form}
                    jobTitles={jobTitles}
                    isCustomTitle={isCustomTitle}
                    isCustomBanca={isCustomBanca}
                    handleJobTitleChange={handleJobTitleChange}
                    handleCustomTitleChange={handleCustomTitleChange}
                    handleBancaChange={handleBancaChange}
                  />
                  
                  <div className="flex justify-end mt-6">
                    <Button type="button" onClick={handleNextTab}>
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="exam-structure">
                  <ExamStructureSection form={form} />
                  
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={handlePreviousTab}>
                      Anterior
                    </Button>
                    <Button type="button" onClick={handleNextTab}>
                      Próximo
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="quotas">
                  <ReservationQuotasSection form={form} />
                  
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={handlePreviousTab}>
                      Anterior
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Criando..." : "Criar Ranking"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="answer-key">
                  <AnswerKeySection form={form} concursoId={createdRankingId || undefined} />
                  
                  <div className="flex justify-end mt-6">
                    <Button type="button" onClick={handleViewResults}>
                      Ver resultados
                    </Button>
                  </div>
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
