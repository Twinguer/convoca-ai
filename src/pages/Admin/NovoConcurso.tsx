
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnswerKeyForm } from '@/components/Admin/AnswerKeyForm';

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
  basic_knowledge_weight: z.coerce.number().default(1),
  specific_knowledge_weight: z.coerce.number().default(1),
  discursive_weight: z.coerce.number().default(1),
  link: z.string().optional(),
  has_basic_knowledge: z.boolean().default(true),
  has_specific_knowledge_1: z.boolean().default(true),
  has_specific_knowledge_2: z.boolean().default(false),
  has_discursive: z.boolean().default(false),
  basic_knowledge_questions: z.coerce.number().optional(),
  specific_knowledge_1_questions: z.coerce.number().optional(),
  specific_knowledge_2_questions: z.coerce.number().optional(),
  predefined_job_title: z.string().optional(),
  custom_job_title: z.string().optional(),
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
  const [jobTitles, setJobTitles] = useState<{id: string, title: string}[]>([]);
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
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data as Concurso;
    },
    enabled: isEditing,
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
      basic_knowledge_weight: 1,
      specific_knowledge_weight: 1,
      discursive_weight: 1,
      link: '',
      has_basic_knowledge: true,
      has_specific_knowledge_1: true,
      has_specific_knowledge_2: false,
      has_discursive: false,
      basic_knowledge_questions: 40,
      specific_knowledge_1_questions: 60,
      specific_knowledge_2_questions: 0,
      predefined_job_title: '',
      custom_job_title: '',
    },
  });
  
  // Update form values when editing an existing concurso
  React.useEffect(() => {
    if (existingConcurso) {
      const isOtherTitle = !jobTitles.find(jt => jt.title === existingConcurso.titulo);
      setIsCustomTitle(isOtherTitle);
      
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
        basic_knowledge_weight: existingConcurso.basic_knowledge_weight,
        specific_knowledge_weight: existingConcurso.specific_knowledge_weight,
        discursive_weight: existingConcurso.discursive_weight,
        link: existingConcurso.link,
        has_basic_knowledge: existingConcurso.has_basic_knowledge ?? true,
        has_specific_knowledge_1: existingConcurso.has_specific_knowledge_1 ?? true,
        has_specific_knowledge_2: existingConcurso.has_specific_knowledge_2 ?? false,
        has_discursive: existingConcurso.has_discursive ?? false,
        basic_knowledge_questions: existingConcurso.basic_knowledge_questions,
        specific_knowledge_1_questions: existingConcurso.specific_knowledge_1_questions,
        specific_knowledge_2_questions: existingConcurso.specific_knowledge_2_questions,
        predefined_job_title: isOtherTitle ? 'OUTRO' : existingConcurso.titulo,
        custom_job_title: isOtherTitle ? existingConcurso.titulo : '',
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
      
      // Remover campos não necessários para o envio
      const { custom_job_title, predefined_job_title, ...dataToSubmit } = data;
      
      if (isEditing) {
        // Update existing concurso
        const { error } = await supabase
          .from('concursos')
          .update(dataToSubmit)
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Ranking atualizado",
          description: "As informações do ranking foram atualizadas com sucesso.",
        });
      } else {
        // Create new concurso using the createRanking function
        try {
          const result = await createRanking(dataToSubmit);
          
          if (!result) {
            throw new Error('Erro ao criar ranking: Nenhum dado retornado');
          }
          
          toast({
            title: "Ranking criado",
            description: "O novo ranking foi criado com sucesso.",
          });
          
          // Redirect to the answer key tab if it's a new concurso
          if (result[0] && result[0].id) {
            navigate(`/project/admin/man/concursos/editar/${result[0].id}`, { state: { showAnswerKeyTab: true } });
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
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check the URL state for showing answer key tab
  React.useEffect(() => {
    // Fix: Using type assertion to access the state property
    const locationState = location.state as { showAnswerKeyTab?: boolean } | null;
    
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
  
  const getTotalQuestions = () => {
    const values = form.getValues();
    let total = 0;
    
    if (values.has_basic_knowledge && values.basic_knowledge_questions) {
      total += Number(values.basic_knowledge_questions);
    }
    
    if (values.has_specific_knowledge_1 && values.specific_knowledge_1_questions) {
      total += Number(values.specific_knowledge_1_questions);
    }
    
    if (values.has_specific_knowledge_2 && values.specific_knowledge_2_questions) {
      total += Number(values.specific_knowledge_2_questions);
    }
    
    return total;
  };
  
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
              <CardDescription>
                Preencha os campos abaixo para {isEditing ? 'atualizar' : 'cadastrar'} um ranking no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cargo Predefinido */}
                    <FormField
                      control={form.control}
                      name="predefined_job_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleJobTitleChange(value);
                            }}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cargo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80">
                              {jobTitles.map((jobTitle) => (
                                <SelectItem key={jobTitle.id} value={jobTitle.title}>
                                  {jobTitle.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Selecione o cargo ou função do concurso
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Cargo Personalizado (aparece somente se "OUTRO" for selecionado) */}
                    {isCustomTitle && (
                      <FormField
                        control={form.control}
                        name="custom_job_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especifique o cargo</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleCustomTitleChange(e);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Digite o nome completo do cargo
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="orgao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Concurso</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Ex: Tribunal Regional Federal da 1ª Região
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="banca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banca Organizadora</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma banca" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cebraspe">Cebraspe</SelectItem>
                              <SelectItem value="FGV">FGV</SelectItem>
                              <SelectItem value="FCC">FCC</SelectItem>
                              <SelectItem value="IBFC">IBFC</SelectItem>
                              <SelectItem value="Vunesp">Vunesp</SelectItem>
                              <SelectItem value="Outra">Outra</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vagas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Vagas</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inscritos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Inscritos</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="data_publicacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Prova</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="etapa_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etapa Atual</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Ex: Edital publicado, Inscrições abertas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Em andamento">Em andamento</SelectItem>
                              <SelectItem value="Concluído">Concluído</SelectItem>
                              <SelectItem value="Cancelado">Cancelado</SelectItem>
                              <SelectItem value="Suspenso">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exam_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Prova</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Alternativas">Múltipla Escolha</SelectItem>
                              <SelectItem value="Certo ou Errado">Certo ou Errado</SelectItem>
                              <SelectItem value="Dissertativa">Dissertativa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="alternatives_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade de Alternativas</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Para provas de Certo ou Errado, considere 2
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Estrutura da Prova - Nova Seção */}
                  <div className="space-y-4 border p-4 rounded-md">
                    <h3 className="text-lg font-medium">Estrutura da Prova</h3>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="has_basic_knowledge"
                        render={({ field }) => (
                          <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
                            <div className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none w-full">
                                <FormLabel>Conhecimentos Básicos</FormLabel>
                                {field.value && (
                                  <FormField
                                    control={form.control}
                                    name="basic_knowledge_questions"
                                    render={({ field: questionsField }) => (
                                      <FormItem className="mt-2">
                                        <FormLabel>Número de questões</FormLabel>
                                        <FormControl>
                                          <Input type="number" {...questionsField} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="has_specific_knowledge_1"
                        render={({ field }) => (
                          <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
                            <div className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none w-full">
                                <FormLabel>Conhecimentos Específicos-1</FormLabel>
                                {field.value && (
                                  <FormField
                                    control={form.control}
                                    name="specific_knowledge_1_questions"
                                    render={({ field: questionsField }) => (
                                      <FormItem className="mt-2">
                                        <FormLabel>Número de questões</FormLabel>
                                        <FormControl>
                                          <Input type="number" {...questionsField} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="has_specific_knowledge_2"
                        render={({ field }) => (
                          <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
                            <div className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none w-full">
                                <FormLabel>Conhecimentos Específicos-2</FormLabel>
                                {field.value && (
                                  <FormField
                                    control={form.control}
                                    name="specific_knowledge_2_questions"
                                    render={({ field: questionsField }) => (
                                      <FormItem className="mt-2">
                                        <FormLabel>Número de questões</FormLabel>
                                        <FormControl>
                                          <Input type="number" {...questionsField} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="has_discursive"
                        render={({ field }) => (
                          <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
                            <div className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange} 
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none w-full">
                                <FormLabel>Discursiva</FormLabel>
                                {field.value && (
                                  <FormField
                                    control={form.control}
                                    name="discursive_weight"
                                    render={({ field: weightField }) => (
                                      <FormItem className="mt-2">
                                        <FormLabel>Valor máximo</FormLabel>
                                        <FormControl>
                                          <Input type="number" step="0.1" {...weightField} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )}
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Total de questões: <span className="font-semibold">{getTotalQuestions()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="wrong_answer_penalty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalidade por Erro</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Para Cebraspe, geralmente é 1 (perde um ponto por erro)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="link"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link do Edital</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            URL completa para o edital do concurso
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        isEditing ? 'Atualizar Ranking' : 'Cadastrar Ranking'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gabarito">
          {isEditing && id ? (
            <AnswerKeyForm concursoId={id} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-muted-foreground">
                  Salve as informações do ranking primeiro para cadastrar o gabarito.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NovoConcurso;
