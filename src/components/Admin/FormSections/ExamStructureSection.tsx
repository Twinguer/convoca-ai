
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISCIPLINES, generateCustomDisciplineSigla } from '@/hooks/useAnswerSheet/sectionUtils';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
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
        <FormItem className="w-full">
          <FormLabel>Peso</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(parseInt(value))} 
            value={field.value?.toString() || "1"}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o peso" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Multiplicador da pontuação
          </FormDescription>
          <FormMessage />
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
        <FormItem className="w-full">
          <FormLabel>Quantidade de Questões</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0"
              {...field} 
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormMessage />
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
          <FormItem className="w-full">
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
                className="w-[180px]"
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
            <FormDescription>
              {minimumScoreType === 'percentage' 
                ? 'Porcentagem mínima para aprovação (0-100%)' 
                : `Pontuação mínima para aprovação (0-${questionsValue})`}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )} 
      />
    );
  };

  // Check which sections are enabled
  const basicKnowledgeEnabled = form.watch('has_basic_knowledge');
  const specificKnowledge1Enabled = form.watch('has_specific_knowledge_1');
  const specificKnowledge2Enabled = form.watch('has_specific_knowledge_2');
  const specificKnowledge3Enabled = form.watch('has_specific_knowledge_3');
  const discursiveEnabled = form.watch('has_discursive');
  const caseStudy1Enabled = form.watch('has_case_study_1');
  const caseStudy2Enabled = form.watch('has_case_study_2');
  const caseStudy3Enabled = form.watch('has_case_study_3');
  const disciplines = form.watch('disciplines') || [];

  // Toggle a section on/off
  const toggleSection = (name: string, value: boolean) => {
    form.setValue(name, value);
  };

  // Add a discipline
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

  // Remove a discipline
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

  // Render a section card with its inputs
  const renderSectionCard = (
    title: string, 
    enabledFlag: string, 
    isEnabled: boolean, 
    questionField?: string, 
    weightField?: string,
    minimumScoreField?: string
  ) => {
    if (!isEnabled) return null;
    
    return (
      <div className="border p-4 rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">{title}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleSection(enabledFlag, false)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {questionField && renderQuestionsInput(questionField)}
          {weightField && renderWeightSelect(weightField)}
          {minimumScoreField && questionField && renderMinimumScoreInput(minimumScoreField, questionField)}
        </div>
      </div>
    );
  };

  // Render a discipline card
  const renderDisciplineCard = (discipline: any, index: number) => {
    return (
      <div key={index} className="border p-4 rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">
            {discipline.name} <span className="text-sm text-gray-500">({discipline.sigla})</span>
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => removeDiscipline(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Questions input */}
          <div className="w-full">
            <FormLabel>Quantidade de Questões</FormLabel>
            <Input 
              type="number" 
              min="0"
              value={discipline.questions}
              onChange={(e) => updateDisciplineField(index, 'questions', Number(e.target.value))}
            />
          </div>
          
          {/* Weight select */}
          <div className="w-full">
            <FormLabel>Peso</FormLabel>
            <Select 
              value={String(discipline.weight)} 
              onValueChange={(value) => updateDisciplineField(index, 'weight', Number(value))}
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
            <p className="text-sm text-gray-500">Multiplicador da pontuação</p>
          </div>
          
          {/* Minimum score input */}
          <div className="w-full">
            <FormLabel>Nota Mínima {minimumScoreType === 'percentage' ? '(%)' : '(pontos)'}</FormLabel>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input 
                  type="number" 
                  min="0"
                  max={minimumScoreType === 'percentage' ? 100 : discipline.questions} 
                  value={discipline.minimumScore}
                  onChange={(e) => updateDisciplineField(index, 'minimumScore', Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {minimumScoreType === 'percentage' 
                ? 'Porcentagem mínima para aprovação (0-100%)' 
                : `Pontuação mínima para aprovação (0-${discipline.questions})`}
            </p>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_basic_knowledge', true)} 
                disabled={basicKnowledgeEnabled}
              >
                Conhecimentos Básicos
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_specific_knowledge_1', true)} 
                disabled={specificKnowledge1Enabled}
              >
                Conhecimentos Específicos 1
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_specific_knowledge_2', true)} 
                disabled={specificKnowledge2Enabled}
              >
                Conhecimentos Específicos 2
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_specific_knowledge_3', true)} 
                disabled={specificKnowledge3Enabled}
              >
                Conhecimentos Específicos 3
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_discursive', true)} 
                disabled={discursiveEnabled}
              >
                Discursiva
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_case_study_1', true)} 
                disabled={caseStudy1Enabled}
              >
                Estudo de Caso 1
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_case_study_2', true)} 
                disabled={caseStudy2Enabled}
              >
                Estudo de Caso 2
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleSection('has_case_study_3', true)} 
                disabled={caseStudy3Enabled}
              >
                Estudo de Caso 3
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Disciplinas</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {DISCIPLINES.map((discipline) => (
                  <DropdownMenuItem 
                    key={discipline.sigla}
                    onClick={() => addDiscipline(discipline.name)}
                    disabled={disciplines.some((d: any) => d.name === discipline.name)}
                  >
                    {discipline.name} ({discipline.sigla})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <Button 
              onClick={addCustomDiscipline} 
              disabled={!customDisciplineName.trim()}
            >
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Render all enabled sections */}
      {renderSectionCard(
        "Conhecimentos Básicos", 
        "has_basic_knowledge", 
        basicKnowledgeEnabled, 
        "basic_knowledge_questions", 
        "basic_knowledge_weight",
        "basic_knowledge_minimum_score"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 1", 
        "has_specific_knowledge_1", 
        specificKnowledge1Enabled,
        "specific_knowledge_1_questions", 
        "specific_knowledge_1_weight",
        "specific_knowledge_1_minimum_score"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 2", 
        "has_specific_knowledge_2", 
        specificKnowledge2Enabled,
        "specific_knowledge_2_questions", 
        "specific_knowledge_2_weight",
        "specific_knowledge_2_minimum_score"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 3", 
        "has_specific_knowledge_3", 
        specificKnowledge3Enabled,
        "specific_knowledge_3_questions", 
        "specific_knowledge_3_weight",
        "specific_knowledge_3_minimum_score"
      )}
      
      {renderSectionCard(
        "Discursiva", 
        "has_discursive", 
        discursiveEnabled, 
        undefined, 
        "discursive_weight",
        "discursive_minimum_score"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 1", 
        "has_case_study_1", 
        caseStudy1Enabled, 
        undefined, 
        "case_study_1_weight",
        "case_study_1_minimum_score"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 2", 
        "has_case_study_2", 
        caseStudy2Enabled, 
        undefined, 
        "case_study_2_weight",
        "case_study_2_minimum_score"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 3", 
        "has_case_study_3", 
        caseStudy3Enabled, 
        undefined, 
        "case_study_3_weight",
        "case_study_3_minimum_score"
      )}

      {/* Render discipline cards */}
      {disciplines && disciplines.length > 0 && (
        <>
          <h4 className="font-medium mt-8 mb-2">Disciplinas</h4>
          {disciplines.map((discipline: any, index: number) => renderDisciplineCard(discipline, index))}
        </>
      )}

      {!basicKnowledgeEnabled && 
       !specificKnowledge1Enabled && 
       !specificKnowledge2Enabled && 
       !specificKnowledge3Enabled && 
       !discursiveEnabled && 
       !caseStudy1Enabled && 
       !caseStudy2Enabled && 
       !caseStudy3Enabled && 
       (!disciplines || disciplines.length === 0) && (
        <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
          Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
        </div>
      )}
    </div>
  );
};
