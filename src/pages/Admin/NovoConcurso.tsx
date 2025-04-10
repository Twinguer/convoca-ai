
import React from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
});

type FormData = z.infer<typeof formSchema>;

const NovoConcurso = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
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
    },
  });
  
  // Update form values when editing an existing concurso
  React.useEffect(() => {
    if (existingConcurso) {
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
      });
    }
  }, [existingConcurso, form]);
  
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      
      if (isEditing) {
        // Update existing concurso
        const { error } = await supabase
          .from('concursos')
          .update(data)
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Ranking atualizado",
          description: "As informações do ranking foram atualizadas com sucesso.",
        });
      } else {
        // Create new concurso using the createRanking function
        await createRanking(data);
        
        toast({
          title: "Ranking criado",
          description: "O novo ranking foi criado com sucesso.",
        });
      }
      
      // Generate fake rankings for demo purposes (optional)
      if (!isEditing) {
        try {
          // Could add code here to generate fake rankings data
          console.log('Ranking criado com sucesso');
        } catch (e) {
          console.error('Error generating fake rankings:', e);
          // Non-critical error, don't throw
        }
      }
      
      navigate('/project/admin/man/concursos');
    } catch (error) {
      console.error('Error saving concurso:', error);
      setErrorMessage("Ocorreu um erro ao salvar o ranking. Por favor, tente novamente.");
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o ranking. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Ex: Analista Judiciário - Área Administrativa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="basic_knowledge_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso - Conhecimentos Básicos</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specific_knowledge_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso - Conhecimentos Específicos</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discursive_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pontos da discursiva</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
    </div>
  );
};

export default NovoConcurso;
