
import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISCIPLINES, generateCustomDisciplineSigla } from '@/hooks/useAnswerSheet/sectionUtils';

interface ExamStructureSectionProps {
  form: any;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [minimumScoreType, setMinimumScoreType] = useState<'percentage' | 'points'>('percentage');
  const [isAddingCustomDiscipline, setIsAddingCustomDiscipline] = useState(false);
  const [customDisciplineName, setCustomDisciplineName] = useState('');
  
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
  
  // Helper function for minimum score inputs
  const renderMinimumScoreInput = (name: string, questionsFieldName: string) => {
    const questionsValue = form.watch(questionsFieldName) || 0;
    
    return (
      <FormField 
        control={form.control} 
        name={name} 
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nota Mínima {minimumScoreType === 'percentage' ? '(%)' : '(pontos)'}</FormLabel>
            <div className="flex space-x-2">
              <div className="flex-1">
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    max={minimumScoreType === 'percentage' ? 100 : questionsValue} 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
              </div>
              <Tabs 
                defaultValue={minimumScoreType} 
                className="w-[140px]"
                onValueChange={(value) => {
                  setMinimumScoreType(value as 'percentage' | 'points');
                  form.setValue('minimum_score_unit_type', value as 'percentage' | 'points');
                }}
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="percentage">%</TabsTrigger>
                  <TabsTrigger value="points">Pontos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </FormItem>
        )} 
      />
    );
  };

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

  // Helper to add discipline
  const addDiscipline = (disciplineName: string) => {
    if (disciplineName === 'Outro') {
      setIsAddingCustomDiscipline(true);
      return;
    }
    
    const discipline = DISCIPLINES.find(d => d.name === disciplineName);
    if (!discipline) return;

    const currentDisciplines = form.watch('disciplines') || [];
    
    // Check if already added
    if (currentDisciplines.some((d: any) => d.name === disciplineName)) {
      return;
    }

    // Add the new discipline
    form.setValue('disciplines', [...currentDisciplines, {
      name: discipline.name,
      sigla: discipline.sigla,
      questions: 0,
      weight: 1,
      minimumScore: 0
    }]);
  };
  
  // Add custom discipline
  const addCustomDiscipline = () => {
    if (!customDisciplineName.trim()) return;
    
    const currentDisciplines = form.watch('disciplines') || [];
    const sigla = generateCustomDisciplineSigla();
    
    // Add the custom discipline
    form.setValue('disciplines', [...currentDisciplines, {
      name: customDisciplineName.trim(),
      sigla: sigla,
      questions: 0,
      weight: 1,
      minimumScore: 0
    }]);
    
    // Reset custom discipline state
    setCustomDisciplineName('');
    setIsAddingCustomDiscipline(false);
  };

  // Helper to remove discipline
  const removeDiscipline = (index: number) => {
    const currentDisciplines = form.watch('disciplines') || [];
    const updatedDisciplines = [...currentDisciplines];
    updatedDisciplines.splice(index, 1);
    form.setValue('disciplines', updatedDisciplines);
  };

  // Update discipline field
  const updateDisciplineField = (index: number, field: string, value: any) => {
    const currentDisciplines = form.watch('disciplines') || [];
    const updatedDisciplines = [...currentDisciplines];
    updatedDisciplines[index][field] = value;
    form.setValue('disciplines', updatedDisciplines);
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
        
        {/* Define tipo de unidade para nota mínima */}
        <FormField
          control={form.control}
          name="minimum_score_unit_type"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input 
                  type="hidden" 
                  {...field} 
                  value={minimumScoreType}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
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
              <DropdownMenuGroup>
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
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Disciplinas</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {DISCIPLINES.map((discipline) => (
                    <DropdownMenuItem 
                      key={discipline.sigla}
                      onClick={() => addDiscipline(discipline.name)}
                      disabled={
                        discipline.name !== 'Outro' &&
                        (form.watch('disciplines') || []).some((d: any) => d.name === discipline.name)
                      }
                    >
                      {discipline.name} {discipline.name !== 'Outro' && `(${discipline.sigla})`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* UI para adicionar disciplina customizada */}
        {isAddingCustomDiscipline && (
          <div className="mb-4 p-4 border rounded-md bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-sm font-medium">Adicionar Disciplina Personalizada</h5>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsAddingCustomDiscipline(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                placeholder="Nome da disciplina"
                value={customDisciplineName}
                onChange={(e) => setCustomDisciplineName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addCustomDiscipline} disabled={!customDisciplineName.trim()}>
                Adicionar
              </Button>
            </div>
          </div>
        )}
        
        {/* Áreas de conhecimento - cards */}
        <div className="space-y-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderQuestionsInput("basic_knowledge_questions")}
                {renderWeightSelect("basic_knowledge_weight")}
                {renderMinimumScoreInput("basic_knowledge_minimum_score", "basic_knowledge_questions")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderQuestionsInput("specific_knowledge_1_questions")}
                {renderWeightSelect("specific_knowledge_1_weight")}
                {renderMinimumScoreInput("specific_knowledge_1_minimum_score", "specific_knowledge_1_questions")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderQuestionsInput("specific_knowledge_2_questions")}
                {renderWeightSelect("specific_knowledge_2_weight")}
                {renderMinimumScoreInput("specific_knowledge_2_minimum_score", "specific_knowledge_2_questions")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderQuestionsInput("specific_knowledge_3_questions")}
                {renderWeightSelect("specific_knowledge_3_weight")}
                {renderMinimumScoreInput("specific_knowledge_3_minimum_score", "specific_knowledge_3_questions")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderWeightSelect("discursive_weight")}
                {renderMinimumScoreInput("discursive_minimum_score", "discursive_weight")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderWeightSelect("case_study_1_weight")}
                {renderMinimumScoreInput("case_study_1_minimum_score", "case_study_1_weight")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderWeightSelect("case_study_2_weight")}
                {renderMinimumScoreInput("case_study_2_minimum_score", "case_study_2_weight")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderWeightSelect("case_study_3_weight")}
                {renderMinimumScoreInput("case_study_3_minimum_score", "case_study_3_weight")}
              </div>
            </div>
          )}

          {/* Disciplinas */}
          {form.watch('disciplines') && form.watch('disciplines').length > 0 && (
            <>
              {form.watch('disciplines').map((discipline: any, index: number) => (
                <div key={index} className="border p-4 rounded-md">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium">
                      {discipline.name} <span className="text-sm text-gray-500">({discipline.sigla})</span>
                    </h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDiscipline(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Questões */}
                    <div>
                      <FormLabel>Número de Questões</FormLabel>
                      <Input 
                        type="number" 
                        min="0"
                        value={discipline.questions}
                        onChange={(e) => updateDisciplineField(index, 'questions', Number(e.target.value))}
                      />
                    </div>
                    
                    {/* Peso */}
                    <div>
                      <FormLabel>Peso</FormLabel>
                      <Select 
                        value={String(discipline.weight)} 
                        onValueChange={(value) => updateDisciplineField(index, 'weight', Number(value))}
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
                    
                    {/* Nota mínima */}
                    <div>
                      <FormLabel>Nota Mínima {minimumScoreType === 'percentage' ? '(%)' : '(pontos)'}</FormLabel>
                      <div className="flex space-x-2">
                        <Input 
                          type="number" 
                          min="0"
                          max={minimumScoreType === 'percentage' ? 100 : discipline.questions} 
                          value={discipline.minimumScore}
                          onChange={(e) => updateDisciplineField(index, 'minimumScore', Number(e.target.value))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
