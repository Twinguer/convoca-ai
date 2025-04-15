
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

// Define a schema for knowledge sections
const knowledgeSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  questions: z.coerce.number().min(0),
  weight: z.coerce.number().min(1).max(3)
});

// Define a schema for evaluation sections
const evaluationSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  maxScore: z.coerce.number().min(0).max(100)
});

const formSchema = z.object({
  titulo: z.string().min(1, 'O título é obrigatório'),
  orgao: z.string().min(1, 'O órgão é obrigatório'),
  banca: z.string().min(1, 'A banca é obrigatória'),
  vagas: z.coerce.number().optional(),
  inscritos: z.coerce.number().optional(),
  data_publicacao: z.string().optional(),
  etapa_atual: z.string().optional(),
  status: z.string().default('Em andamento'),
  exam_type: z.string().default('Alternativas'),
  alternatives_count: z.coerce.number().default(5),
  wrong_answer_penalty: z.coerce.number().default(0),
  link: z.string().optional(),
  predefined_job_title: z.string().optional(),
  custom_job_title: z.string().optional(),
  
  // New dynamic sections
  knowledgeSections: z.array(knowledgeSectionSchema).default([]),
  evaluationSections: z.array(evaluationSectionSchema).default([])
});

type FormData = z.infer<typeof formSchema>;

const NovoConcurso = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("informacoes");
  const [jobTitles, setJobTitles] = useState<{ id: string; title: string; }[]>([]);
  const [isCustomTitle, setIsCustomTitle] = useState(false);

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
        .select('*, exam_sections(*), evaluation_sections(*)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Concurso & { 
        exam_sections: Array<{
          id: string;
          type: string;
          name: string;
          questions: number;
          weight: number;
        }>,
        evaluation_sections: Array<{
          id: string;
          type: string;
          name: string;
          max_score: number;
        }> 
      };
    },
    enabled: isEditing
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      orgao: '',
      banca: 'Cebraspe',
      vagas: undefined,
      inscritos: undefined,
      data_publicacao: new Date().toISOString().split('T')[0],
      etapa_atual: 'Edital publicado',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      alternatives_count: 5,
      wrong_answer_penalty: 0,
      link: '',
      predefined_job_title: '',
      custom_job_title: '',
      knowledgeSections: [],
      evaluationSections: []
    }
  });

  // Map legacy data structure to new dynamic structure
  const mapLegacyToNewStructure = (concurso: any) => {
    // Check if we have the new structure data
    if (concurso.exam_sections && concurso.exam_sections.length > 0) {
      return {
        knowledgeSections: concurso.exam_sections.map((section: any) => ({
          id: section.id,
          type: section.type,
          name: section.name,
          questions: section.questions,
          weight: section.weight
        })),
        evaluationSections: concurso.evaluation_sections?.map((section: any) => ({
          id: section.id,
          type: section.type,
          name: section.name,
          maxScore: section.max_score
        })) || []
      };
    }

    // Map old structure to new
    const knowledgeSections = [];
    const evaluationSections = [];

    // Add basic knowledge if it exists
    if (concurso.has_basic_knowledge) {
      knowledgeSections.push({
        id: `legacy-basic-${Date.now()}`,
        type: 'basic',
        name: 'Conhecimentos Básicos',
        questions: concurso.basic_knowledge_questions || 0,
        weight: concurso.basic_knowledge_weight || 1
      });
    }

    // Add specific knowledge sections
    if (concurso.has_specific_knowledge_1) {
      knowledgeSections.push({
        id: `legacy-specific1-${Date.now()}`,
        type: 'specific',
        name: 'Conhecimentos Específicos',
        questions: concurso.specific_knowledge_1_questions || 0,
        weight: concurso.specific_knowledge_1_weight || 1
      });
    }

    if (concurso.has_specific_knowledge_2) {
      knowledgeSections.push({
        id: `legacy-specific2-${Date.now()}`,
        type: 'specific',
        name: 'Conhecimentos Específicos 2',
        questions: concurso.specific_knowledge_2_questions || 0,
        weight: concurso.specific_knowledge_2_weight || 1
      });
    }

    if (concurso.has_specific_knowledge_3) {
      knowledgeSections.push({
        id: `legacy-specific3-${Date.now()}`,
        type: 'specific',
        name: 'Conhecimentos Específicos 3',
        questions: concurso.specific_knowledge_3_questions || 0,
        weight: concurso.specific_knowledge_3_weight || 1
      });
    }

    // Add evaluation sections
    if (concurso.has_discursive) {
      evaluationSections.push({
        id: `legacy-discursive-${Date.now()}`,
        type: 'discursive',
        name: 'Discursiva',
        maxScore: concurso.discursive_weight || 100
      });
    }

    if (concurso.has_case_study_1) {
      evaluationSections.push({
        id: `legacy-case1-${Date.now()}`,
        type: 'casestudy',
        name: 'Estudo de Caso 1',
        maxScore: concurso.case_study_1_weight || 100
      });
    }

    if (concurso.has_case_study_2) {
      evaluationSections.push({
        id: `legacy-case2-${Date.now()}`,
        type: 'casestudy',
        name: 'Estudo de Caso 2',
        maxScore: concurso.case_study_2_weight || 100
      });
    }

    if (concurso.has_case_study_3) {
      evaluationSections.push({
        id: `legacy-case3-${Date.now()}`,
        type: 'casestudy',
        name: 'Estudo de Caso 3',
        maxScore: concurso.case_study_3_weight || 100
      });
    }

    return { knowledgeSections, evaluationSections };
  };

  // Update form values when editing an existing concurso
  React.useEffect(() => {
    if (existingConcurso) {
      // Find if the title exists in job titles
      const existingJobTitle = jobTitles.find(jt => jt.title === existingConcurso.titulo);
      const shouldUseCustomTitle = !existingJobTitle;
      setIsCustomTitle(shouldUseCustomTitle);
      
      // Map the new dynamic sections structure
      const { knowledgeSections, evaluationSections } = mapLegacyToNewStructure(existingConcurso);
      
      form.reset({
        titulo: existingConcurso.titulo,
        orgao: existingConcurso.orgao,
        banca: existingConcurso.banca,
        vagas: existingConcurso.vagas,
        inscritos: existingConcurso.inscritos,
        data_publicacao: existingConcurso.data_publicacao ? new Date(existingConcurso.data_publicacao).toISOString().split('T')[0] : undefined,
        etapa_atual: existingConcurso.etapa_atual,
        status: existingConcurso.status,
        exam_type: existingConcurso.exam_type,
        alternatives_count: existingConcurso.alternatives_count,
        wrong_answer_penalty: existingConcurso.wrong_answer_penalty,
        link: existingConcurso.link,
        predefined_job_title: shouldUseCustomTitle ? 'OUTRO' : existingConcurso.titulo,
        custom_job_title: shouldUseCustomTitle ? existingConcurso.titulo : '',
        knowledgeSections,
        evaluationSections
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

  // Transform dynamic structure to database format
  const prepareSectionsForDatabase = (data: FormData) => {
    const examSections = data.knowledgeSections.map(section => ({
      type: section.type,
      name: section.name,
      questions: section.questions,
      weight: section.weight
    }));

    const evaluationSections = data.evaluationSections.map(section => ({
      type: section.type,
      name: section.name,
      max_score: section.maxScore
    }));

    return { examSections, evaluationSections };
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

      // Prepare sections data
      const { examSections, evaluationSections } = prepareSectionsForDatabase(data);

      // Remover campos não necessários para o envio
      const { custom_job_title, predefined_job_title, knowledgeSections, evaluationSections: evalSections, ...dataToSubmit } = data;
      
      if (isEditing) {
        // Update existing concurso
        const { error } = await supabase
          .from('concursos')
          .update(dataToSubmit)
          .eq('id', id);
          
        if (error) throw error;
        
        // Delete existing sections first
        await supabase.from('exam_sections').delete().eq('concurso_id', id);
        await supabase.from('evaluation_sections').delete().eq('concurso_id', id);
        
        // Add exam sections
        if (examSections.length > 0) {
          const { error: examSectionError } = await supabase
            .from('exam_sections')
            .insert(examSections.map(section => ({
              ...section,
              concurso_id: id
            })));
            
          if (examSectionError) throw examSectionError;
        }
        
        // Add evaluation sections
        if (evaluationSections.length > 0) {
          const { error: evalSectionError } = await supabase
            .from('evaluation_sections')
            .insert(evaluationSections.map(section => ({
              ...section,
              concurso_id: id
            })));
            
          if (evalSectionError) throw evalSectionError;
        }
        
        toast({
          title: "Ranking atualizado",
          description: "As informações do ranking foram atualizadas com sucesso."
        });
      } else {
        // Create new concurso using the createRanking function
        try {
          const result = await createRanking({
            ...dataToSubmit,
            examSections,
            evaluationSections
          });
          
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
                    handleJobTitleChange={handleJobTitleChange}
                    handleCustomTitleChange={handleCustomTitleChange}
                  />
                  
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
