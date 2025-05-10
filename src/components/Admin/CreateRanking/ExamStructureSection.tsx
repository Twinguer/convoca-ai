
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface ExamStructureSectionProps {
  form: any;
}

export const ExamStructureSectionComponent: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customSectionName, setCustomSectionName] = useState('');
  const [customSectionQuestions, setCustomSectionQuestions] = useState('0');
  const [customSectionWeight, setCustomSectionWeight] = useState('1');

  // Helper function to render weight select component
  const renderWeightSelect = (name: string) => (
    <FormField
      control={form.control}
      name={name}
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
  );
  
  // Helper function for questions count inputs
  const renderQuestionsInput = (name: string) => (
    <FormField
      control={form.control}
      name={name}
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
  );

  // Helper to add knowledge area
  const handleAddKnowledgeArea = (type: string) => {
    switch (type) {
      case 'basic':
        form.setValue('has_basic_knowledge', true);
        break;
      case 'specific1':
        form.setValue('has_specific_knowledge_1', true);
        break;
      case 'specific2':
        form.setValue('has_specific_knowledge_2', true);
        break;
      case 'specific3':
        form.setValue('has_specific_knowledge_3', true);
        break;
      case 'custom':
        form.setValue('has_custom_knowledge', true);
        break;
      case 'discursive':
        form.setValue('has_discursive', true);
        break;
      case 'case1':
        form.setValue('has_case_study_1', true);
        break;
      case 'case2':
        form.setValue('has_case_study_2', true);
        break;
      case 'case3':
        form.setValue('has_case_study_3', true);
        break;
    }
  };

  // Helper to remove knowledge area
  const handleRemoveKnowledgeArea = (type: string) => {
    switch (type) {
      case 'basic':
        form.setValue('has_basic_knowledge', false);
        break;
      case 'specific1':
        form.setValue('has_specific_knowledge_1', false);
        break;
      case 'specific2':
        form.setValue('has_specific_knowledge_2', false);
        break;
      case 'specific3':
        form.setValue('has_specific_knowledge_3', false);
        break;
      case 'custom':
        form.setValue('has_custom_knowledge', false);
        break;
      case 'discursive':
        form.setValue('has_discursive', false);
        break;
      case 'case1':
        form.setValue('has_case_study_1', false);
        break;
      case 'case2':
        form.setValue('has_case_study_2', false);
        break;
      case 'case3':
        form.setValue('has_case_study_3', false);
        break;
    }
  };
  
  // Função para lidar com a adição de uma seção customizada
  const handleCustomSectionClick = () => {
    setIsCustomDialogOpen(true);
  };
  
  // Função para adicionar uma seção customizada
  const addCustomSection = () => {
    if (!customSectionName.trim()) return;
    
    // Preparar os dados da disciplina customizada
    const sectionType = customSectionName.toLowerCase().replace(/\s+/g, '_');
    const questionCount = parseInt(customSectionQuestions) || 0;
    const weight = parseInt(customSectionWeight) || 1;
    
    // Adicionar à lista de disciplinas
    const disciplines = form.getValues('disciplines') || [];
    disciplines.push({
      name: customSectionName,
      type: sectionType,
      questionCount: questionCount,
      weight: weight,
      isEnabled: true
    });
    form.setValue('disciplines', disciplines);
    
    // Limpar campos
    setCustomSectionName('');
    setCustomSectionQuestions('0');
    setCustomSectionWeight('1');
    setIsCustomDialogOpen(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Estrutura da Prova</h3>
          </div>
          <div className="flex justify-end">
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
                      <SelectItem value="Certo ou Errado">Certo ou Errado</SelectItem>
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
                <FormItem className="ml-4">
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
                <FormItem className="ml-4">
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
                      <SelectItem value="1.5">1,5 pontos</SelectItem>
                      <SelectItem value="2.5">2,5 pontos</SelectItem>
                      <SelectItem value="3">3 pontos</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Áreas de Conhecimento */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Áreas de Conhecimento</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {!form.watch('has_basic_knowledge') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('basic')}>
                  Conhecimentos Básicos
                </DropdownMenuItem>
              )}
              {!form.watch('has_specific_knowledge_1') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific1')}>
                  Conhecimentos Específicos
                </DropdownMenuItem>
              )}
              {!form.watch('has_specific_knowledge_2') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific2')}>
                  Conhecimentos Específicos 2
                </DropdownMenuItem>
              )}
              {!form.watch('has_specific_knowledge_3') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('specific3')}>
                  Conhecimentos Específicos 3
                </DropdownMenuItem>
              )}
              {!form.watch('has_custom_knowledge') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('custom')}>
                  Conhecimentos Customizados
                </DropdownMenuItem>
              )}
              {!form.watch('has_discursive') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('discursive')}>
                  Dissertativa
                </DropdownMenuItem>
              )}
              {!form.watch('has_case_study_1') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('case1')}>
                  Estudo de Caso
                </DropdownMenuItem>
              )}
              {!form.watch('has_case_study_2') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('case2')}>
                  Estudo de Caso 2
                </DropdownMenuItem>
              )}
              {!form.watch('has_case_study_3') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('case3')}>
                  Estudo de Caso 3
                </DropdownMenuItem>
              )}
              
              {/* Separador para opção customizada */}
              <DropdownMenuSeparator />
              
              {/* Opção para adicionar conhecimento customizado */}
              <DropdownMenuItem onClick={handleCustomSectionClick}>
                Outro: Digite o Conhecimento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Áreas de conhecimento - cards */}
        <div className="space-y-4">
          {/* Área vazia se não tiver nenhuma seção */}
          {!form.watch('has_basic_knowledge') && 
           !form.watch('has_specific_knowledge_1') && 
           !form.watch('has_specific_knowledge_2') && 
           !form.watch('has_specific_knowledge_3') &&
           !form.watch('has_custom_knowledge') &&
           !form.watch('has_discursive') &&
           !form.watch('has_case_study_1') &&
           !form.watch('has_case_study_2') &&
           !form.watch('has_case_study_3') && (
            <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
            </div>
          )}
          
          {/* Conhecimentos Básicos */}
          {form.watch('has_basic_knowledge') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Conhecimentos Básicos</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('basic')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("basic_knowledge_questions")}
                {renderWeightSelect("basic_knowledge_weight")}
              </div>
            </div>
          )}
          
          {/* Conhecimentos Específicos 1 */}
          {form.watch('has_specific_knowledge_1') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Conhecimentos Específicos</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('specific1')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("specific_knowledge_1_questions")}
                {renderWeightSelect("specific_knowledge_1_weight")}
              </div>
            </div>
          )}
          
          {/* Conhecimentos Específicos 2 */}
          {form.watch('has_specific_knowledge_2') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Conhecimentos Específicos 2</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('specific2')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("specific_knowledge_2_questions")}
                {renderWeightSelect("specific_knowledge_2_weight")}
              </div>
            </div>
          )}
          
          {/* Conhecimentos Específicos 3 */}
          {form.watch('has_specific_knowledge_3') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Conhecimentos Específicos 3</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('specific3')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("specific_knowledge_3_questions")}
                {renderWeightSelect("specific_knowledge_3_weight")}
              </div>
            </div>
          )}
          
          {/* Conhecimentos Customizados */}
          {form.watch('has_custom_knowledge') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Conhecimentos Customizados</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('custom')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("custom_knowledge_questions")}
                {renderWeightSelect("custom_knowledge_weight")}
              </div>
            </div>
          )}
          
          {/* Dissertativa */}
          {form.watch('has_discursive') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Dissertativa</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('discursive')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderWeightSelect("discursive_weight")}
              </div>
            </div>
          )}
          
          {/* Estudo de Caso 1 */}
          {form.watch('has_case_study_1') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('case1')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderWeightSelect("case_study_1_weight")}
              </div>
            </div>
          )}
          
          {/* Estudo de Caso 2 */}
          {form.watch('has_case_study_2') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso 2</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('case2')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderWeightSelect("case_study_2_weight")}
              </div>
            </div>
          )}
          
          {/* Estudo de Caso 3 */}
          {form.watch('has_case_study_3') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso 3</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('case3')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderWeightSelect("case_study_3_weight")}
              </div>
            </div>
          )}
          
          {/* Disciplinas customizadas */}
          {form.watch('disciplines')?.map((discipline: any, index: number) => (
            <div key={`custom-${index}`} className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">{discipline.name}</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const disciplines = [...form.getValues('disciplines')];
                    disciplines.splice(index, 1);
                    form.setValue('disciplines', disciplines);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Número de Questões</FormLabel>
                  <Input 
                    type="number" 
                    min="0"
                    value={discipline.questionCount}
                    onChange={(e) => {
                      const disciplines = [...form.getValues('disciplines')];
                      disciplines[index].questionCount = Number(e.target.value);
                      form.setValue('disciplines', disciplines);
                    }}
                  />
                </div>
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select 
                    value={String(discipline.weight)} 
                    onValueChange={(value) => {
                      const disciplines = [...form.getValues('disciplines')];
                      disciplines[index].weight = Number(value);
                      form.setValue('disciplines', disciplines);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Diálogo para adicionar conhecimento customizado */}
        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Conhecimento Customizado</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <FormLabel htmlFor="customName">Nome do Conhecimento</FormLabel>
                <Input
                  id="customName"
                  placeholder="Ex: Direito Administrativo"
                  value={customSectionName}
                  onChange={(e) => setCustomSectionName(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="customQuestions">Quantidade de Questões</FormLabel>
                  <Input
                    id="customQuestions"
                    type="number"
                    min="0"
                    value={customSectionQuestions}
                    onChange={(e) => setCustomSectionQuestions(e.target.value)}
                  />
                </div>
                
                <div>
                  <FormLabel htmlFor="customWeight">Peso</FormLabel>
                  <Select
                    value={customSectionWeight}
                    onValueChange={setCustomSectionWeight}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Peso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>Cancelar</Button>
              <Button onClick={addCustomSection}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
