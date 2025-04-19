import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';
import { AnswerKeyForm } from '@/components/Admin/AnswerKeyForm';
import { createRanking } from '@/integrations/supabase/rankings';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RankingFormProps {
  isAdminView?: boolean;
  editId?: string;
}

const RankingForm: React.FC<RankingFormProps> = ({ isAdminView = false, editId }) => {
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomBanca, setIsCustomBanca] = useState(false);
  const [createdConcursoId, setCreatedConcursoId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [jobTitles] = useState([
    { id: '1', title: 'Analista' },
    { id: '2', title: 'Técnico' },
    { id: '3', title: 'Auditor' },
    { id: '4', title: 'Assistente' },
    { id: '5', title: 'Especialista' }
  ]);

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

  useEffect(() => {
    const loadExistingData = async () => {
      if (editId) {
        try {
          const { data: existingConcurso, error } = await supabase
            .from('concursos')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) throw error;

          if (existingConcurso) {
            setCreatedConcursoId(existingConcurso.id);
            
            const isOtherTitle = !jobTitles.find(jt => jt.title === existingConcurso.titulo);
            setIsCustomTitle(isOtherTitle);
            
            const isOtherBanca = existingConcurso.banca === 'OUTRO';
            setIsCustomBanca(isOtherBanca);
            
            form.reset({
              ...existingConcurso,
              predefined_job_title: isOtherTitle ? 'OUTRO' : existingConcurso.titulo,
              custom_job_title: isOtherTitle ? existingConcurso.titulo : '',
              banca: isOtherBanca ? 'OUTRO' : existingConcurso.banca,
              custom_banca: isOtherBanca ? existingConcurso.banca : '',
              data_publicacao: existingConcurso.data_publicacao ? 
                new Date(existingConcurso.data_publicacao).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0],
            });
          }
        } catch (error) {
          console.error('Error loading existing ranking data:', error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar os dados do ranking.",
            variant: "destructive"
          });
        }
      }
    };

    loadExistingData();
  }, [editId, form, jobTitles]);

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
        
        toast({
          title: "Ranking atualizado",
          description: "O ranking foi atualizado com sucesso!"
        });
      } else {
        result = await createRanking(dataToSubmit);
        toast({
          title: "Ranking criado",
          description: "O novo ranking foi criado com sucesso!"
        });
      }
      
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        setCreatedConcursoId(editId || (result[0]?.id));
        setActiveTab('answer-key');
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar ranking:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o ranking.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToResults = () => {
    if (createdConcursoId) {
      navigate(`/concurso/${createdConcursoId}/resultados`);
    }
  };

  const formValues = form.getValues();

  return (
    <div className={isAdminView ? '' : 'container mx-auto p-4'}>
      <Card>
        <CardHeader>
          <CardTitle>
            {editId ? 'Editar Ranking' : 
             createdConcursoId ? 'Ranking Criado - Adicionar Gabarito' : 
             'Criar Novo Ranking'}
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
                  <GeneralInfoSection
                    form={form}
                    jobTitles={jobTitles}
                    isCustomTitle={isCustomTitle}
                    isCustomBanca={isCustomBanca}
                    handleJobTitleChange={handleJobTitleChange}
                    handleCustomTitleChange={handleCustomTitleChange}
                    handleBancaChange={handleBancaChange}
                  />
                  
                  <ReservationQuotasSection form={form} />
                  
                  <ExamStructureSection form={form} />
                  
                  <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : editId ? 'Salvar alterações' : 'Criar Ranking'}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="answer-key">
                  {createdConcursoId && (
                    <>
                      <AnswerKeyForm
                        concursoId={createdConcursoId}
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

export default RankingForm;
