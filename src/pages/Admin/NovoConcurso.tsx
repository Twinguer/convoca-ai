
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from '@/lib/utils';

// Form validation schema
const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  orgao: z.string().min(1, 'Órgão é obrigatório'),
  banca: z.string().min(1, 'Banca é obrigatória'),
  bancaOutra: z.string().optional(),
  dataPublicacao: z.string().min(1, 'Data de publicação é obrigatória'),
  vagas: z.number().min(1, 'Número de vagas é obrigatório'),
  status: z.string(),
  tipoProva: z.string(),
  descontoPorErro: z.number().optional(),
  numAlternativas: z.string().optional(),
  pesoBasicos: z.number().optional(),
  pesoEspecificos: z.number().optional(),
  pesoDiscursiva: z.number().optional(),
  fatorMultiplicador: z.string().optional(),
  link: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_FORM_VALUES: FormValues = {
  titulo: '',
  orgao: '',
  banca: '',
  bancaOutra: '',
  dataPublicacao: new Date().toISOString().split('T')[0],
  vagas: 1,
  status: 'Aberto',
  tipoProva: 'Alternativas',
  descontoPorErro: 0,
  numAlternativas: 'ABCDE',
  pesoBasicos: 1,
  pesoEspecificos: 1,
  pesoDiscursiva: 0,
  fatorMultiplicador: 'x1',
  link: '',
};

const bancas = [
  'Cebraspe',
  'FGV',
  'FCC',
  'Vunesp',
  'Cesgranrio',
  'IBFC',
  'IDECAN',
  'QUADRIX',
  'Outra'
];

const NovoConcurso: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  
  const watchBanca = form.watch('banca');
  const watchTipoProva = form.watch('tipoProva');
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the data
      const concursoData = {
        id: uuidv4(),
        titulo: values.titulo,
        orgao: values.orgao,
        banca: values.banca === 'Outra' ? values.bancaOutra : values.banca,
        data_publicacao: values.dataPublicacao,
        vagas: values.vagas,
        status: values.status,
        etapa_atual: 'Inscrições',
        link: values.link || null,
        // Store additional info in a metadata field or separate table in a real app
        meta: JSON.stringify({
          tipoProva: values.tipoProva,
          descontoPorErro: values.descontoPorErro,
          numAlternativas: values.numAlternativas,
          pesoBasicos: values.pesoBasicos,
          pesoEspecificos: values.pesoEspecificos,
          pesoDiscursiva: values.pesoDiscursiva,
          fatorMultiplicador: values.fatorMultiplicador,
        }),
      };
      
      // Insert into Supabase
      const { error } = await supabase
        .from('concursos')
        .insert([concursoData]);
      
      if (error) throw error;
      
      toast({
        title: 'Concurso criado com sucesso!',
        description: 'O novo concurso foi adicionado ao sistema.',
        variant: 'default',
      });
      
      // Redirect to the concursos list
      navigate('/admin/concursos');
    } catch (error) {
      console.error('Erro ao criar concurso:', error);
      toast({
        title: 'Erro ao criar concurso',
        description: 'Ocorreu um erro ao tentar criar o concurso. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cadastrar Novo Concurso</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Informações do Concurso</CardTitle>
          <CardDescription>
            Preencha os campos abaixo com as informações do concurso a ser cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Concurso*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Concurso TSE - Analista Judiciário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="orgao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órgão*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Tribunal Superior Eleitoral" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <div>
                  <FormField
                    control={form.control}
                    name="banca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banca Organizadora*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a banca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bancas.map((banca) => (
                              <SelectItem key={banca} value={banca}>{banca}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchBanca === 'Outra' && (
                    <FormField
                      control={form.control}
                      name="bancaOutra"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel>Nome da banca*</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o nome da banca" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="dataPublicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Publicação*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vagas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Vagas*</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Ex: 10" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Aberto">Aberto</SelectItem>
                          <SelectItem value="Em andamento">Em andamento</SelectItem>
                          <SelectItem value="Encerrado">Encerrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tipoProva"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Prova*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Certo ou Errado" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Certo ou Errado
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Alternativas" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Alternativas
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchTipoProva === 'Certo ou Errado' && (
                <FormField
                  control={form.control}
                  name="descontoPorErro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desconto por Erro</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseFloat(val))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o desconto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Sem desconto</SelectItem>
                          <SelectItem value="0.33">0.33 por item errado</SelectItem>
                          <SelectItem value="0.5">0.5 por item errado</SelectItem>
                          <SelectItem value="1">1.0 por item errado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Quantidade de pontos descontados para cada item errado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {watchTipoProva === 'Alternativas' && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="numAlternativas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Alternativas</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Selecione as alternativas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ABCD">A, B, C, D</SelectItem>
                            <SelectItem value="ABCDE">A, B, C, D, E</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-medium text-lg">Pontuação das Provas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="pesoBasicos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso C. Básicos</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pesoEspecificos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso C. Específicos</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pesoDiscursiva"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso Discursiva</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fatorMultiplicador"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fator Multiplicador</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o multiplicador" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="x1">x1 (sem multiplicador)</SelectItem>
                              <SelectItem value="x2">x2 (dobro da pontuação)</SelectItem>
                              <SelectItem value="x3">x3 (triplo da pontuação)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Aplicado às notas finais
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do Edital (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="URL do edital do concurso" {...field} />
                    </FormControl>
                    <FormDescription>
                      Link para o edital ou site oficial do concurso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Concurso'}
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
