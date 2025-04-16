
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [showCustomType, setShowCustomType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  
  // Helper function to render weight select component for knowledge sections
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
            defaultValue="1"
          >
            <FormControl>
              <SelectTrigger className="w-full">
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
          <FormLabel>Quantidade</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0"
              max="200"
              step="1"
              {...field} 
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormDescription>
            Número de questões
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} 
    />
  );

  // Helper function for score inputs (discursive and case studies)
  const renderScoreInput = (name: string) => (
    <FormField 
      control={form.control} 
      name={name} 
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Pontuação</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0"
              max="100"
              step="1"
              {...field} 
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormDescription>
            Valor máximo (0-100)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} 
    />
  );

  // Check if basic knowledge is enabled
  const basicKnowledgeEnabled = form.watch('has_basic_knowledge');
  const specificKnowledge1Enabled = form.watch('has_specific_knowledge_1');
  const specificKnowledge2Enabled = form.watch('has_specific_knowledge_2');
  const specificKnowledge3Enabled = form.watch('has_specific_knowledge_3');
  const discursiveEnabled = form.watch('has_discursive');
  const caseStudy1Enabled = form.watch('has_case_study_1');
  const caseStudy2Enabled = form.watch('has_case_study_2');
  const caseStudy3Enabled = form.watch('has_case_study_3');

  // Toggle a section on/off
  const toggleSection = (name: string, value: boolean) => {
    form.setValue(name, value);
  };

  // Add a new section from dropdown
  const addSection = (sectionType: string) => {
    switch(sectionType) {
      case 'basic':
        toggleSection('has_basic_knowledge', true);
        break;
      case 'specific1':
        toggleSection('has_specific_knowledge_1', true);
        break;
      case 'specific2':
        toggleSection('has_specific_knowledge_2', true);
        break;
      case 'specific3':
        toggleSection('has_specific_knowledge_3', true);
        break;
      case 'discursive':
        toggleSection('has_discursive', true);
        break;
      case 'case1':
        toggleSection('has_case_study_1', true);
        break;
      case 'case2':
        toggleSection('has_case_study_2', true);
        break;
      case 'case3':
        toggleSection('has_case_study_3', true);
        break;
      case 'custom':
        setShowCustomType(true);
        break;
    }
  };
  
  // Remove a section
  const removeSection = (sectionType: string) => {
    toggleSection(sectionType, false);
  };

  // Render a section card with its inputs
  const renderSectionCard = (
    title: string, 
    enabledFlag: string, 
    isEnabled: boolean, 
    questionField?: string, 
    weightField?: string
  ) => {
    if (!isEnabled) return null;
    
    return (
      <div className="border p-4 rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">{title}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => removeSection(enabledFlag)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questionField && renderQuestionsInput(questionField)}
          {weightField && renderWeightSelect(weightField)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 border p-4 rounded-md bg-gray-50">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={() => addSection('basic')} 
              disabled={basicKnowledgeEnabled}
            >
              Conhecimentos Básicos
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('specific1')} 
              disabled={specificKnowledge1Enabled}
            >
              Conhecimentos Específicos 1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('specific2')} 
              disabled={specificKnowledge2Enabled}
            >
              Conhecimentos Específicos 2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('specific3')} 
              disabled={specificKnowledge3Enabled}
            >
              Conhecimentos Específicos 3
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('discursive')} 
              disabled={discursiveEnabled}
            >
              Discursiva
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('case1')} 
              disabled={caseStudy1Enabled}
            >
              Estudo de Caso 1
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('case2')} 
              disabled={caseStudy2Enabled}
            >
              Estudo de Caso 2
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('case3')} 
              disabled={caseStudy3Enabled}
            >
              Estudo de Caso 3
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => addSection('custom')}
            >
              Outro...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {showCustomType && (
        <div className="border p-4 rounded-md bg-white mb-4">
          <h4 className="font-medium mb-2">Novo Tipo de Seção</h4>
          <div className="flex space-x-2">
            <Input
              value={customTypeName}
              onChange={(e) => setCustomTypeName(e.target.value)}
              placeholder="Nome da seção"
              className="flex-1"
            />
            <Button 
              onClick={() => {
                // Here you would create a custom section
                // For now, just close the input
                setShowCustomType(false);
                setCustomTypeName('');
              }}
            >
              Adicionar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCustomType(false);
                setCustomTypeName('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {/* Render all enabled sections */}
        {renderSectionCard(
          "Conhecimentos Básicos", 
          "has_basic_knowledge", 
          basicKnowledgeEnabled, 
          "basic_knowledge_questions", 
          "basic_knowledge_weight"
        )}
        
        {renderSectionCard(
          "Conhecimentos Específicos 1", 
          "has_specific_knowledge_1", 
          specificKnowledge1Enabled,
          "specific_knowledge_1_questions", 
          "specific_knowledge_1_weight"
        )}
        
        {renderSectionCard(
          "Conhecimentos Específicos 2", 
          "has_specific_knowledge_2", 
          specificKnowledge2Enabled,
          "specific_knowledge_2_questions", 
          "specific_knowledge_2_weight"
        )}
        
        {renderSectionCard(
          "Conhecimentos Específicos 3", 
          "has_specific_knowledge_3", 
          specificKnowledge3Enabled,
          "specific_knowledge_3_questions", 
          "specific_knowledge_3_weight"
        )}
        
        {renderSectionCard(
          "Discursiva", 
          "has_discursive", 
          discursiveEnabled, 
          undefined, 
          "discursive_weight"
        )}
        
        {renderSectionCard(
          "Estudo de Caso 1", 
          "has_case_study_1", 
          caseStudy1Enabled, 
          undefined, 
          "case_study_1_weight"
        )}
        
        {renderSectionCard(
          "Estudo de Caso 2", 
          "has_case_study_2", 
          caseStudy2Enabled, 
          undefined, 
          "case_study_2_weight"
        )}
        
        {renderSectionCard(
          "Estudo de Caso 3", 
          "has_case_study_3", 
          caseStudy3Enabled, 
          undefined, 
          "case_study_3_weight"
        )}
      </div>
      
      {!basicKnowledgeEnabled && 
       !specificKnowledge1Enabled && 
       !specificKnowledge2Enabled && 
       !specificKnowledge3Enabled && 
       !discursiveEnabled && 
       !caseStudy1Enabled && 
       !caseStudy2Enabled && 
       !caseStudy3Enabled && (
        <div className="bg-gray-100 border border-dashed border-gray-300 rounded-md p-6 text-center text-gray-500">
          Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
        </div>
      )}
    </div>
  );
};
