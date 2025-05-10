
import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ExamStructureBuilder } from '@/models/examBuilder/ExamStructureBuilder';
import { ExamSectionConfig } from '@/models/examBuilder/ExamSectionBuilder';
import { sectionDisplayNames, SectionType } from '@/integrations/supabase/rankings/examStructure';

interface CustomExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const CustomExamStructureSection: React.FC<CustomExamStructureSectionProps> = ({ form }) => {
  const [examBuilder, setExamBuilder] = useState(() => new ExamStructureBuilder());
  const [enabledSections, setEnabledSections] = useState<ExamSectionConfig[]>([]);
  const [customSectionName, setCustomSectionName] = useState('');
  const [customSectionQuestions, setCustomSectionQuestions] = useState('0');
  const [customSectionWeight, setCustomSectionWeight] = useState('1');
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  // Initialize the builder with form data
  useEffect(() => {
    const builder = new ExamStructureBuilder();
    const values = form.getValues();
    
    // Configure exam type
    builder.withExamType(values.exam_type || 'Alternativas');
    builder.withAlternativesCount(Number(values.alternatives_count) || 5);
    builder.withWrongAnswerPenalty(Number(values.wrong_answer_penalty) || 0);
    
    // Configure existing sections
    if (values.has_basic_knowledge) {
      builder.enableSection('basic', values.basic_knowledge_questions, values.basic_knowledge_weight);
    }
    
    if (values.has_specific_knowledge_1) {
      builder.enableSection('specific1', values.specific_knowledge_1_questions, values.specific_knowledge_1_weight);
    }
    
    if (values.has_specific_knowledge_2) {
      builder.enableSection('specific2', values.specific_knowledge_2_questions, values.specific_knowledge_2_weight);
    }
    
    if (values.has_specific_knowledge_3) {
      builder.enableSection('specific3', values.specific_knowledge_3_questions, values.specific_knowledge_3_weight);
    }
    
    if (values.has_discursive) {
      builder.enableSection('discursive', 0, values.discursive_weight);
    }
    
    if (values.has_case_study_1) {
      builder.enableSection('case_study1', 0, values.case_study_1_weight);
    }
    
    if (values.has_case_study_2) {
      builder.enableSection('case_study2', 0, values.case_study_2_weight);
    }
    
    if (values.has_case_study_3) {
      builder.enableSection('case_study3', 0, values.case_study_3_weight);
    }
    
    // Add custom disciplines if any
    if (values.disciplines && Array.isArray(values.disciplines)) {
      values.disciplines.forEach((discipline: any) => {
        if (discipline.name && discipline.isEnabled) {
          builder.addCustomSection(
            discipline.name,
            discipline.questionCount || 0,
            discipline.weight || 1
          );
        }
      });
    }
    
    setExamBuilder(builder);
    setEnabledSections(builder.getEnabledSections());
  }, [form]);
  
  // Helper function to render weight select
  const renderWeightSelect = (section: ExamSectionConfig) => {
    const fieldName = getWeightFieldName(section.sectionType);
    
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Peso</FormLabel>
            <Select 
              defaultValue={String(section.weight)} 
              onValueChange={(value) => {
                field.onChange(parseInt(value));
                updateSection(section.sectionType, section.questionCount, parseInt(value));
              }}
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
  };
  
  // Helper to get weight field name for a section
  const getWeightFieldName = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'basic': return 'basic_knowledge_weight';
      case 'specific1': return 'specific_knowledge_1_weight';
      case 'specific2': return 'specific_knowledge_2_weight';
      case 'specific3': return 'specific_knowledge_3_weight';
      case 'discursive': return 'discursive_weight';
      case 'case_study1': return 'case_study_1_weight';
      case 'case_study2': return 'case_study_2_weight';
      case 'case_study3': return 'case_study_3_weight';
      default: return `${sectionType}_weight`;
    }
  };
  
  // Helper function to render questions input
  const renderQuestionsInput = (section: ExamSectionConfig) => {
    // For subjective sections, we don't have question count
    if (['discursive', 'case_study1', 'case_study2', 'case_study3'].includes(section.sectionType)) {
      return null;
    }
    
    const fieldName = getQuestionsFieldName(section.sectionType);
    
    return (
      <FormField 
        control={form.control} 
        name={fieldName} 
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quantidade de Questões</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min="0"
                {...field} 
                onChange={(e) => {
                  const value = Number(e.target.value);
                  field.onChange(value);
                  updateSection(section.sectionType, value, section.weight);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />
    );
  };
  
  // Helper to get questions field name for a section
  const getQuestionsFieldName = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'basic': return 'basic_knowledge_questions';
      case 'specific1': return 'specific_knowledge_1_questions';
      case 'specific2': return 'specific_knowledge_2_questions';
      case 'specific3': return 'specific_knowledge_3_questions';
      default: return 'questionCount'; // For custom sections
    }
  };

  // Update a section in the builder and form
  const updateSection = (sectionType: SectionType, questionCount: number, weight: number) => {
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy sections from current builder
    examBuilder.getEnabledSections().forEach(section => {
      if (section.sectionType === sectionType) {
        updatedBuilder.enableSection(sectionType, questionCount, weight);
      } else {
        updatedBuilder.enableSection(
          section.sectionType,
          section.questionCount,
          section.weight
        );
      }
    });
    
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form values
    form.setValue(`has_${sectionType}`, true);
    
    // Only update question count for objective sections
    if (!['discursive', 'case_study1', 'case_study2', 'case_study3'].includes(sectionType)) {
      const questionsField = getQuestionsFieldName(sectionType);
      form.setValue(questionsField, questionCount);
    }
    
    const weightField = getWeightFieldName(sectionType);
    form.setValue(weightField, weight);
  };
  
  // Add a new section
  const addSection = (sectionType: SectionType) => {
    // Default values
    const questionCount = ['discursive', 'case_study1', 'case_study2', 'case_study3'].includes(sectionType) 
      ? 0 : 10;
    const weight = 1;
    
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy existing sections
    examBuilder.getEnabledSections().forEach(section => {
      updatedBuilder.enableSection(
        section.sectionType,
        section.questionCount,
        section.weight
      );
    });
    
    // Add new section
    updatedBuilder.enableSection(sectionType, questionCount, weight);
    
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form values
    form.setValue(`has_${sectionType}`, true);
    
    if (!['discursive', 'case_study1', 'case_study2', 'case_study3'].includes(sectionType)) {
      const questionsField = getQuestionsFieldName(sectionType);
      form.setValue(questionsField, questionCount);
    }
    
    const weightField = getWeightFieldName(sectionType);
    form.setValue(weightField, weight);
  };
  
  // Remove a section
  const removeSection = (sectionType: SectionType) => {
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy all sections except the one being removed
    examBuilder.getEnabledSections().forEach(section => {
      if (section.sectionType !== sectionType) {
        updatedBuilder.enableSection(
          section.sectionType,
          section.questionCount,
          section.weight
        );
      }
    });
    
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form values
    form.setValue(`has_${sectionType}`, false);
  };
  
  // Add a custom section
  const addCustomSection = () => {
    if (!customSectionName.trim()) {
      return;
    }
    
    const questionCount = parseInt(customSectionQuestions) || 0;
    const weight = parseInt(customSectionWeight) || 1;
    
    // Create a custom section ID
    const customId = `custom_${Date.now()}`;
    
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy existing sections
    examBuilder.getEnabledSections().forEach(section => {
      updatedBuilder.enableSection(
        section.sectionType,
        section.questionCount,
        section.weight
      );
    });
    
    // Add new custom section
    updatedBuilder.addCustomSection(customSectionName, questionCount, weight);
    
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update disciplines in form
    const currentDisciplines = form.getValues('disciplines') || [];
    const newDisciplines = [
      ...currentDisciplines,
      {
        name: customSectionName,
        questionCount,
        weight,
        isEnabled: true,
        type: 'custom'
      }
    ];
    
    form.setValue('disciplines', newDisciplines);
    
    // Reset custom section inputs
    setCustomSectionName('');
    setCustomSectionQuestions('0');
    setCustomSectionWeight('1');
    setIsCustomDialogOpen(false);
  };

  // Get available sections that can be added
  const getAvailableSections = () => {
    const enabledSectionTypes = enabledSections.map(s => s.sectionType);
    
    const availableSections = [
      { type: 'basic', label: 'Conhecimentos Básicos' },
      { type: 'specific1', label: 'Conhecimentos Específicos 1' },
      { type: 'specific2', label: 'Conhecimentos Específicos 2' },
      { type: 'specific3', label: 'Conhecimentos Específicos 3' },
      { type: 'discursive', label: 'Prova Discursiva' },
      { type: 'case_study1', label: 'Estudo de Caso 1' },
      { type: 'case_study2', label: 'Estudo de Caso 2' },
      { type: 'case_study3', label: 'Estudo de Caso 3' }
    ].filter(section => !enabledSectionTypes.includes(section.type as SectionType));
    
    return availableSections;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Seção
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {getAvailableSections().map((section) => (
              <DropdownMenuItem 
                key={section.type} 
                onClick={() => addSection(section.type as SectionType)}
              >
                {section.label}
              </DropdownMenuItem>
            ))}
            {getAvailableSections().length > 0 && (
              <DropdownMenuSeparator />
            )}
            <DialogTrigger asChild onClick={() => setIsCustomDialogOpen(true)}>
              <DropdownMenuItem>Adicionar Seção Personalizada</DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Show message if no sections are enabled */}
      {enabledSections.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          Adicione pelo menos uma seção para configurar a estrutura da prova
        </div>
      )}
      
      {/* Render enabled sections */}
      <div className="space-y-6">
        {enabledSections.map((section) => (
          <div key={section.sectionType} className="border rounded-lg p-4 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2" 
              onClick={() => removeSection(section.sectionType)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <h4 className="font-medium mb-3">
              {section.sectionType.startsWith('custom_') 
                ? section.name 
                : sectionDisplayNames[section.sectionType] || section.sectionType}
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {renderQuestionsInput(section)}
              {renderWeightSelect(section)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Dialog for adding custom section */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Seção Personalizada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="custom-section-name" className="text-sm font-medium">
                Nome da Seção
              </label>
              <Input
                id="custom-section-name"
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
                placeholder="Ex: Matemática"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="custom-questions" className="text-sm font-medium">
                  Quantidade de Questões
                </label>
                <Input
                  id="custom-questions"
                  type="number"
                  min="0"
                  value={customSectionQuestions}
                  onChange={(e) => setCustomSectionQuestions(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="custom-weight" className="text-sm font-medium">
                  Peso
                </label>
                <Input
                  id="custom-weight"
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={customSectionWeight}
                  onChange={(e) => setCustomSectionWeight(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addCustomSection}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FormField
        control={form.control}
        name="disciplines"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} type="hidden" />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};
