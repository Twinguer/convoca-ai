
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createRanking } from '@/integrations/supabase/rankings';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnswerKeyForm } from '@/components/Admin/AnswerKeyForm';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';

const formSchema = z.object({
  titulo: z.string().min(1, 'O título é obrigatório'),
  orgao: z.string().min(1, 'O órgão é obrigatório'),
  banca: z.string().min(1, 'A banca é obrigatória'),
  custom_banca: z.string().optional(),
  vagas: z.coerce.number().optional(),
  inscritos: z.coerce.number().optional(),
  data_publicacao: z.string().optional(),
  status: z.string().default('Em andamento'),
  exam_type: z.string().default('Alternativas'),
  alternatives_count: z.coerce.number().default(5),
  wrong_answer_penalty: z.coerce.number().default(0),
  link: z.string().optional(),
  
  // Exam structure fields
  has_basic_knowledge: z.boolean().default(true),
  has_specific_knowledge_1: z.boolean().default(true),
  has_specific_knowledge_2: z.boolean().default(false),
  has_specific_knowledge_3: z.boolean().default(false),
  has_discursive: z.boolean().default(false),
  has_case_study_1: z.boolean().default(false),
  has_case_study_2: z.boolean().default(false),
  has_case_study_3: z.boolean().default(false),
  basic_knowledge_questions: z.coerce.number().optional(),
  specific_knowledge_1_questions: z.coerce.number().optional(),
  specific_knowledge_2_questions: z.coerce.number().optional(),
  specific_knowledge_3_questions: z.coerce.number().optional(),
  
  // Weight fields (for basic and specific knowledge)
  basic_knowledge_weight: z.coerce.number().default(1),
  specific_knowledge_1_weight: z.coerce.number().default(1),
  specific_knowledge_2_weight: z.coerce.number().default(1),
  specific_knowledge_3_weight: z.coerce.number().default(1),
  
  // Maximum score fields (for discursive and case studies)
  discursive_weight: z.coerce.number().default(1),
  case_study_1_weight: z.coerce.number().default(1),
  case_study_2_weight: z.coerce.number().default(1),
  case_study_3_weight: z.coerce.number().default(1),
  
  // Job title fields
  predefined_job_title: z.string().optional(),
  custom_job_title: z.string().optional(),
  
  // Reservation quota fields
  has_ampla_concorrencia: z.boolean().default(true),
  has_ppp: z.boolean().default(false),
  has_pcd: z.boolean().default(false),
  has_hipossuficientes: z.boolean().default(false),
  has_indigenas: z.boolean().default(false),
  has_transsexuais: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const NovoConcurso = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = useState<string>("informacoes");
  const [jobTitles, setJobTitles] = useState<{ id: string; title: string; }[]>([]);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [isCustomBanca, setIsCustomBanca] = useState(false);

  // Buscar cargos disponíveis
  useEffect(() => {
    const fetchJobTitles = async () => {
      const { data, error } = await supabase
        .from('job_titles')
        .select('id, title')
        .order('title', { ascending: true });
        
      if (error) {
        console.error('Erro ao buscar cargos:', error);
        return;
      }
      
      setJobTitles(data || []);
    };
    
    fetchJobTitles();
  }, []);

  // Fetch existing concurso for editing
  const { data: existingConcurso, isLoading } = useQuery({
    queryKey: ['concurso', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Concurso;
    },
    enabled: isEditing
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      orgao: '',
      banca: 'Cebraspe',
      custom_banca: '',
      vagas: undefined,
      inscritos: undefined,
      data_publicacao: new Date().toISOString().split('T')[0],
      status: 'Em andamento',
      exam_type: 'Alternativas',
      alternatives_count: 5,
      wrong_answer_penalty: 0,
      basic_knowledge_weight: 1,
      specific_knowledge_1_weight: 1,
      specific_knowledge_2_weight: 1,
      specific_knowledge_3_weight: 1,
      discursive_weight: 1,
      case_study_1_weight: 1,
      case_study_2_weight: 1,
      case_study_3_weight: 1,
      link: '',
      has_basic_knowledge: true,
      has_specific_knowledge_1: true,
      has_specific_knowledge_2: false,
      has_specific_knowledge_3: false,
      has_discursive: false,
      has_case_study_1: false,
      has_case_study_2: false,
      has_case_study_3: false,
      basic_knowledge_questions: 40,
      specific_knowledge_1_questions: 60,
      specific_knowledge_2_questions: 0,
      specific_knowledge_3_questions: 0,
      predefined_job_title: '',
      custom_job_title: '',
      has_ampla_concorrencia: true,
      has_ppp: false,
      has_pcd: false,
      has_hipossuficientes: false,
      has_indigenas: false,
      has_transsexuais: false,
    }
  });

  // Update form values when editing an existing concurso
  React.useEffect(() => {
    if (existingConcurso) {
      const isOtherTitle = !jobTitles.find(jt => jt.title === existingConcurso.titulo);
      setIsCustomTitle(isOtherTitle);
      
      const isOtherBanca = existingConcurso.banca === 'OUTRO';
      setIsCustomBanca(isOtherBanca);
      
      form.reset({
        titulo: existingConcurso.titulo,
        orgao: existingConcurso.orgao,
        banca: isOtherBanca ? 'OUTRO' : existingConcurso.banca,
        custom_banca: existingConcurso.custom_banca,
        vagas: existingConcurso.vagas,
        inscritos: existingConcurso.inscritos,
        data_publicacao: existingConcurso.data_publicacao ? new Date(existingConcurso.data_publicacao).toISOString().split('T')[0] : undefined,
        status: existingConcurso.status,
        exam_type: existingConcurso.exam_type,
        alternatives_count: existingConcurso.alternatives_count,
        wrong_answer_penalty: existingConcurso.wrong_answer_penalty,
        basic_knowledge_weight: existingConcurso.basic_knowledge_weight || 1,
        specific_knowledge_1_weight: existingConcurso.specific_knowledge_1_weight || 1,
        specific_knowledge_2_weight: existingConcurso.specific_knowledge_2_weight || 1,
        specific_knowledge_3_weight: existingConcurso.specific_knowledge_3_weight || 1,
        discursive_weight: existingConcurso.discursive_weight || 1,
        case_study_1_weight: existingConcurso.case_study_1_weight || 1,
        case_study_2_weight: existingConcurso.case_study_2_weight || 1,
        case_study_3_weight: existingConcurso.case_study_3_weight || 1,
        link: existingConcurso.link,
        has_basic_knowledge: existingConcurso.has_basic_knowledge ?? true,
        has_specific_knowledge_1: existingConcurso.has_specific_knowledge_1 ?? true,
        has_specific_knowledge_2: existingConcurso.has_specific_knowledge_2 ?? false,
        has_specific_knowledge_3: existingConcurso.has_specific_knowledge_3 ?? false,
        has_discursive: existingConcurso.has_discursive ?? false,
        has_case_study_1: existingConcurso.has_case_study_1 ?? false,
        has_case_study_2: existingConcurso.has_case_study_2 ?? false,
        has_case_study_3: existingConcurso.has_case_study_3 ?? false,
        basic_knowledge_questions: existingConcurso.basic_knowledge_questions,
        specific_knowledge_1_questions: existingConcurso.specific_knowledge_1_questions,
        specific_knowledge_2_questions: existingConcurso.specific_knowledge_2_questions,
        specific_knowledge_3_questions: existingConcurso.specific_knowledge_3_questions,
        predefined_job_title: isOtherTitle ? 'OUTRO' : existingConcurso.titulo,
        custom_job_title: isOtherTitle ? existingConcurso.titulo : '',
        has_ampla_concorrencia: existingConcurso.has_ampla_concorrencia ?? true,
        has_ppp: existingConcurso.has_ppp ?? false,
        has_pcd: existingConcurso.has_pcd ?? false,
        has_hipossuficientes: existingConcurso.has_hipossuficientes ?? false,
        has_indigenas: existingConcurso.has_indigenas ?? false,
        has_transsexuais: existingConcurso.has_transsexuais ?? false,
      });
    }
  }, [existingConcurso, form, jobTitles]);

  // Atualizar o título com base na seleção de cargo predefinido
  const handleJobTitleChange = (value: string) => {
    const isOther = value === 'OUTRO';
    setIsCustomTitle(isOther);
    
    if (!isOther) {
      form.setValue('titulo', value);
      form.setValue('custom_job_title', '');
    }
  };

  // Atualizar o título quando o cargo personalizado for alterado
  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('titulo', e.target.value);
    form.setValue('custom_job_title', e.target.value);
  };
  
  // Atualizar banca quando o valor selecionado mudar
  const handleBancaChange = (value: string) => {
    const isOther = value === 'OUTRO';
    setIsCustomBanca(isOther);
    
    if (!isOther) {
      form.setValue('custom_banca', '');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Se for "OUTRO", usar o cargo personalizado
      if (data.predefined_job_title === 'OUTRO' && data.custom_job_title) {
        data.titulo = data.custom_job_title;
      } else if (data.predefined_job_title && data.predefined_job_title !== 'OUTRO') {
        data.titulo = data.predefined_job_title;
      }

      // Se a banca for "OUTRO", precisamos definir a banca correta
      const finalData = { ...data };
      if (data.banca === 'OUTRO') {
        // Na interface ao usuário mostramos "OUTRO", mas no banco precisamos gravar o nome da banca customizada
        finalData.banca = data.custom_banca || 'Outra';
      }
      
      if (isEditing) {
        // Update existing concurso
        const { error } = await supabase
          .from('concursos')
          .update(finalData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Ranking atualizado",
          description: "As informações do ranking foram atualizadas com sucesso."
        });
      } else {
        // Create new concurso using the createRanking function
        try {
          const result = await createRanking(finalData);
          
          if (!result) {
            throw new Error('Erro ao criar ranking: Nenhum dado retornado');
          }
          
          toast({
            title: "Ranking criado",
            description: "O novo ranking foi criado com sucesso."
          });

          // Redirect to the answer key tab if it's a new concurso
          if (result[0] && result[0].id) {
            navigate(`/project/admin/man/concursos/editar/${result[0].id}`, {
              state: { showAnswerKeyTab: true }
            });
            return;
          }
        } catch (error: any) {
          console.error('Error in createRanking:', error);
          throw new Error(`Erro ao criar ranking: ${error.message || 'Erro desconhecido'}`);
        }
      }

      // If we're in edit mode and on the informacoes tab, switch to the gabarito tab
      if (isEditing && activeTab === "informacoes") {
        setActiveTab("gabarito");
      } else {
        navigate('/project/admin/man/concursos');
      }
    } catch (error: any) {
      console.error('Error saving concurso:', error);
      setErrorMessage(error.message || "Ocorreu um erro ao salvar o ranking. Por favor, tente novamente.");
      
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro ao salvar o ranking. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check the URL state for showing answer key tab
  React.useEffect(() => {
    // Fix: Using type assertion to access the state property
    const locationState = location.state as { showAnswerKeyTab?: boolean; } | null;
    
    if (locationState && locationState.showAnswerKeyTab) {
      setActiveTab("gabarito");
    }
  }, [location]);

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando ranking...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Ranking' : 'Novo Ranking'}</h1>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informacoes">Informações do Ranking</TabsTrigger>
          <TabsTrigger value="gabarito" disabled={!isEditing}>Gabarito Oficial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="informacoes">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Editar Ranking' : 'Cadastrar Novo Ranking'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate('/project/admin/man/concursos')}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : isEditing ? 'Salvar alterações' : 'Criar ranking'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gabarito">
          {isEditing && id && <AnswerKeyForm concursoId={id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NovoConcurso;
