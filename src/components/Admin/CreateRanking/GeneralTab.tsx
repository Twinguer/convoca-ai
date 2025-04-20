import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReservationQuotasSection } from '../FormSections/ReservationQuotasSection';
import { Plus, MapPin } from 'lucide-react';

interface GeneralTabProps {
  form: any;
  jobTitles: Array<{id: string, title: string}>;
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleNextTab: () => void;
}

const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const GeneralTab: React.FC<GeneralTabProps> = ({
  form,
  jobTitles,
  isCustomTitle,
  isCustomBanca,
  handleJobTitleChange,
  handleCustomTitleChange,
  handleBancaChange,
  handleNextTab
}) => {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  const handleStateSelection = (estado: string) => {
    setSelectedStates(prev => {
      if (prev.includes(estado)) {
        return prev.filter(s => s !== estado);
      }
      return [...prev, estado];
    });
    
    form.setValue('estados', selectedStates);
  };
  
  const handleAddKnowledgeArea = (type: string) => {
    switch (type) {
      case 'specific1':
        form.setValue('has_specific_knowledge_1', true);
        break;
      case 'specific2':
        form.setValue('has_specific_knowledge_2', true);
        break;
      case 'specific3':
        form.setValue('has_specific_knowledge_3', true);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cargo */}
            <div>
              <FormField
                control={form.control}
                name="predefined_job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleJobTitleChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobTitles.map(job => (
                          <SelectItem key={job.id} value={job.title}>
                            {job.title}
                          </SelectItem>
                        ))}
                        <SelectItem value="OUTRO">Outro (especificar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {isCustomTitle && (
                <FormField
                  control={form.control}
                  name="custom_job_title"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Cargo personalizado</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Digite o cargo"
                          onChange={(e) => {
                            field.onChange(e);
                            handleCustomTitleChange(e);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Órgão */}
            <FormField
              control={form.control}
              name="orgao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Ministério da Economia" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Localidade */}
            <div className="col-span-2">
              <FormItem>
                <FormLabel>Localidade</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {selectedStates.map(estado => (
                    <div key={estado} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                      {estado}
                    </div>
                  ))}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Adicionar Estado
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Selecione os Estados</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            {ESTADOS_BRASILEIROS.map(estado => (
                              <div key={estado} className="flex items-center space-x-2">
                                <Checkbox
                                  id={estado}
                                  checked={selectedStates.includes(estado)}
                                  onCheckedChange={() => handleStateSelection(estado)}
                                />
                                <label htmlFor={estado} className="text-sm font-medium leading-none cursor-pointer">
                                  {estado}
                                </label>
                              </div>
                            ))}
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Fechar</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </FormItem>
            </div>
            
            {/* Banca */}
            <div>
              <FormField
                control={form.control}
                name="banca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banca</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleBancaChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma banca" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cebraspe">Cebraspe</SelectItem>
                        <SelectItem value="FGV">FGV</SelectItem>
                        <SelectItem value="VUNESP">VUNESP</SelectItem>
                        <SelectItem value="FCC">FCC</SelectItem>
                        <SelectItem value="FUNDATEC">FUNDATEC</SelectItem>
                        <SelectItem value="OUTRO">Outro (especificar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {isCustomBanca && (
                <FormField
                  control={form.control}
                  name="custom_banca"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Banca personalizada</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o nome da banca" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Data de Publicação */}
            <FormField
              control={form.control}
              name="data_publicacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Publicação</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Status do Concurso */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Concurso</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Etapa Atual */}
            <FormField
              control={form.control}
              name="etapa_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa Atual</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Inscrições">Inscrições</SelectItem>
                      <SelectItem value="Prova Objetiva">Prova Objetiva</SelectItem>
                      <SelectItem value="Prova Discursiva">Prova Discursiva</SelectItem>
                      <SelectItem value="Avaliação de Títulos">Avaliação de Títulos</SelectItem>
                      <SelectItem value="Curso de Formação">Curso de Formação</SelectItem>
                      <SelectItem value="Resultado Final">Resultado Final</SelectItem>
                      <SelectItem value="Nomeação">Nomeação</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Link do Edital */}
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do Edital</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Vagas */}
            <FormField
              control={form.control}
              name="vagas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Vagas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Inscritos */}
            <FormField
              control={form.control}
              name="inscritos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Inscritos</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Estrutura da Prova */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Estrutura da Prova</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!form.watch('has_specific_knowledge_1') && (
                  <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific1')}>
                    Conhecimentos Específicos 1
                  </DropdownMenuItem>
                )}
                {!form.watch('has_specific_knowledge_2') && form.watch('has_specific_knowledge_1') && (
                  <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific2')}>
                    Conhecimentos Específicos 2
                  </DropdownMenuItem>
                )}
                {!form.watch('has_specific_knowledge_3') && form.watch('has_specific_knowledge_2') && (
                  <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific3')}>
                    Conhecimentos Específicos 3
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Tipo de Prova */}
            <FormField
              control={form.control}
              name="exam_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Prova</FormLabel>
                  <Select defaultValue={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alternativas">Múltipla Escolha</SelectItem>
                      <SelectItem value="Certo-Errado">Certo ou Errado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Quantidade de Alternativas */}
            <FormField
              control={form.control}
              name="alternatives_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Alternativas</FormLabel>
                  <Select 
                    defaultValue={String(field.value)} 
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={form.watch('exam_type') !== 'Alternativas'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4">4 (A-D)</SelectItem>
                      <SelectItem value="5">5 (A-E)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Penalidade para Erro */}
            <FormField
              control={form.control}
              name="wrong_answer_penalty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalidade para Erro</FormLabel>
                  <Select 
                    defaultValue={String(field.value)} 
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Sem penalidade</SelectItem>
                      <SelectItem value="0.25">0.25 pontos</SelectItem>
                      <SelectItem value="0.33">0.33 pontos</SelectItem>
                      <SelectItem value="0.5">0.5 pontos</SelectItem>
                      <SelectItem value="1">1 ponto</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          
          {/* Áreas de Conhecimento */}
          <h4 className="font-medium mb-2">Áreas de Conhecimento</h4>
          
          {/* Conhecimentos Básicos */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="has_basic_knowledge"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Conhecimentos Básicos</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch('has_basic_knowledge') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <FormField
                  control={form.control}
                  name="basic_knowledge_questions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Questões</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min="0"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="basic_knowledge_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <Select 
                        defaultValue={String(field.value)} 
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* Conhecimentos Específicos 1 */}
          <div className="space-y-4 mb-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="has_specific_knowledge_1"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="m-0">Conhecimentos Específicos 1</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch('has_specific_knowledge_1') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <FormField
                  control={form.control}
                  name="specific_knowledge_1_questions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Questões</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          min="0"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specific_knowledge_1_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso</FormLabel>
                      <Select 
                        defaultValue={String(field.value)} 
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* Cotas de Reserva */}
          <h4 className="font-medium mb-2 mt-4">Cotas de Reserva</h4>
          
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="has_ampla_concorrencia"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">Ampla Concorrência</FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_ppp"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">PPP (Pessoas Pretas e Pardas)</FormLabel>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_pcd"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">PCD (Pessoas com Deficiência)</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="button" onClick={handleNextTab}>
          Próximo: Gabarito
        </Button>
      </div>
    </div>
  );
};
