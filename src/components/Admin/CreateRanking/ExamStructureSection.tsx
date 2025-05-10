import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Settings } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExamStructureSectionProps {
  form: any;
}

export const ExamStructureSectionComponent: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [isCustomKnowledge, setIsCustomKnowledge] = useState<boolean>(
    form.watch('has_custom_knowledge') || false
  );

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
    if (type === 'custom') {
      // Adicionar conhecimento customizado
      const currentDisciplines = form.watch('disciplines') || [];
      const newDiscipline = {
        id: uuidv4(),
        name: 'Novo Conhecimento',
        type: `custom_${uuidv4().slice(0, 8)}`, // Identificador único para a seção
        isEnabled: true,
        questionCount: 10,
        weight: 1
      };
      
      form.setValue('disciplines', [...currentDisciplines, newDiscipline]);
      form.setValue('has_custom_knowledge', true);
      setIsCustomKnowledge(true);
    } else {
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
    }
  };

  // Helper to remove knowledge area
  const handleRemoveKnowledgeArea = (type: string, customId?: string) => {
    if (type === 'custom' && customId) {
      // Remover conhecimento customizado pelo ID
      const currentDisciplines = form.watch('disciplines') || [];
      const updatedDisciplines = currentDisciplines.filter(
        (d: any) => d.id !== customId
      );
      form.setValue('disciplines', updatedDisciplines);
      
      // Se não houver mais disciplinas customizadas, desabilitar o modo customizado
      if (updatedDisciplines.length === 0) {
        form.setValue('has_custom_knowledge', false);
        setIsCustomKnowledge(false);
      }
    } else {
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
    }
  };

  // Handler para atualizar um campo específico de uma disciplina
  const handleDisciplineChange = (disciplineId: string, field: string, value: any) => {
    const currentDisciplines = form.watch('disciplines') || [];
    const updatedDisciplines = currentDisciplines.map((d: any) => 
      d.id === disciplineId ? { ...d, [field]: value } : d
    );
    form.setValue('disciplines', updatedDisciplines);
  };

  // Modified handler for toggle between knowledge types
  const handleKnowledgeTypeToggle = (value: boolean) => {
    setIsCustomKnowledge(value);
    form.setValue('has_custom_knowledge', value);
    
    if (value) {
      // Switching to custom mode - disable all standard knowledge sections
      form.setValue('has_basic_knowledge', false);
      form.setValue('has_specific_knowledge_1', false);
      form.setValue('has_specific_knowledge_2', false);
      form.setValue('has_specific_knowledge_3', false);
      
      // Keep discursive and case study settings as they are compatible with both modes
      
      // If no disciplines exist yet, create an initial one
      if (!form.watch('disciplines') || form.watch('disciplines').length === 0) {
        const newDiscipline = {
          id: uuidv4(),
          name: 'Novo Conhecimento',
          type: `custom_${uuidv4().slice(0, 8)}`,
          isEnabled: true,
          questionCount: 10,
          weight: 1
        };
        form.setValue('disciplines', [newDiscipline]);
      }
    } else {
      // Switching to standard mode - enable at least basic knowledge
      form.setValue('has_basic_knowledge', true);
      form.setValue('basic_knowledge_questions', 10);
      form.setValue('basic_knowledge_weight', 1);
      
      // We don't clear disciplines array to preserve data if user toggles back
    }
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

        {/* Toggle for switching between traditional and custom knowledge */}
        <div className="flex items-center space-x-2 mb-6">
          <Switch 
            checked={isCustomKnowledge}
            onCheckedChange={handleKnowledgeTypeToggle}
            id="knowledge-type-toggle"
          />
          <label htmlFor="knowledge-type-toggle" className="text-sm font-medium">
            Usar conhecimentos customizáveis
          </label>
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
              {isCustomKnowledge ? (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('custom')}>
                  Conhecimento (Customizável)
                </DropdownMenuItem>
              ) : (
                <>
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
                </>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Áreas de conhecimento - cards */}
        <div className="space-y-4">
          {/* Área vazia se não tiver nenhuma seção */}
          {!isCustomKnowledge &&
           !form.watch('has_basic_knowledge') && 
           !form.watch('has_specific_knowledge_1') && 
           !form.watch('has_specific_knowledge_2') && 
           !form.watch('has_specific_knowledge_3') &&
           !form.watch('has_discursive') &&
           !form.watch('has_case_study_1') &&
           !form.watch('has_case_study_2') &&
           !form.watch('has_case_study_3') && (
            <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
            </div>
          )}
          
          {isCustomKnowledge && (!form.watch('disciplines') || form.watch('disciplines').length === 0) && (
            <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhuma seção customizada adicionada. Clique em "Adicionar" para incluir conhecimentos.
            </div>
          )}
          
          {/* Seções customizadas */}
          {isCustomKnowledge && form.watch('disciplines') && form.watch('disciplines').map((discipline: any, index: number) => (
            <div className="border p-4 rounded-md" key={discipline.id || index}>
              <div className="flex justify-between items-center mb-4">
                <input
                  className="font-medium bg-transparent border-b border-gray-300 focus:border-gray-600 outline-none w-[70%]"
                  value={discipline.name}
                  onChange={(e) => handleDisciplineChange(discipline.id, 'name', e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('custom', discipline.id)}
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
                    value={discipline.questionCount || 0} 
                    min="0"
                    onChange={(e) => handleDisciplineChange(discipline.id, 'questionCount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select 
                    value={String(discipline.weight || 1)} 
                    onValueChange={(value) => handleDisciplineChange(discipline.id, 'weight', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o peso" />
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
          
          {/* Seções tradicionais */}
          {!isCustomKnowledge && (
            <>
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
            </>
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
        </div>
      </CardContent>
    </Card>
  );
};

// Adicionando uma exportação com o nome esperado pela GeneralTab
export const ExamStructureSection = ExamStructureSectionComponent;
