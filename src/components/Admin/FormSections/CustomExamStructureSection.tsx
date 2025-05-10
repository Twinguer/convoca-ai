
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

  // Initialize the builder with form data when the form changes
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
  
  // Helper to get the weight field name for a section
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
  
  // Helper to get the questions field name for a section
  const getQuestionsFieldName = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'basic': return 'basic_knowledge_questions';
      case 'specific1': return 'specific_knowledge_1_questions';
      case 'specific2': return 'specific_knowledge_2_questions';
      case 'specific3': return 'specific_knowledge_3_questions';
      default: 
        // For custom sections, we need to configure in the disciplines array
        return 'questionCount';
    }
  };

  // Update a section in the builder and in the form
  const updateSection = (sectionType: SectionType, questionCount: number, weight: number) => {
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy sections from current builder
    examBuilder.getEnabledSections().forEach(section => {
      if (section.sectionType === sectionType) {
        // Update the specific section
        updatedBuilder.enableSection(sectionType, questionCount, weight);
      } else {
        // Manter as outras seções como estão
        updatedBuilder.enableSection(
          section.sectionType,
          section.questionCount,
          section.weight
        );
      }
    });
    
    // Update the builder and enabled sections
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form
    const concursoValues = updatedBuilder.toConcurso();
    Object.entries(concursoValues).forEach(([key, value]) => {
      if (key !== 'disciplines') { // Disciplines are handled separately
        form.setValue(key as any, value);
      }
    });
    
    // Update disciplines in the form
    if (concursoValues.disciplines) {
      form.setValue('disciplines', concursoValues.disciplines);
    }
  };

  // Add a new section
  const addSection = (sectionType: SectionType) => {
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy existing sections
    examBuilder.getEnabledSections().forEach(section => {
      updatedBuilder.enableSection(
        section.sectionType,
        section.questionCount,
        section.weight
      );
    });
    
    // Add the new section
    updatedBuilder.enableSection(sectionType);
    
    // Update the builder and enabled sections
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form
    const hasKey = `has_${getSectionKey(sectionType)}` as keyof typeof form.getValues();
    form.setValue(hasKey as any, true);
  };
  
  // Helper to get the correct key for a section
  const getSectionKey = (sectionType: SectionType): string => {
    switch (sectionType) {
      case 'specific1': return 'specific_knowledge_1';
      case 'specific2': return 'specific_knowledge_2';
      case 'specific3': return 'specific_knowledge_3';
      case 'case_study1': return 'case_study_1';
      case 'case_study2': return 'case_study_2';
      case 'case_study3': return 'case_study_3';
      default: return sectionType;
    }
  };

  // Remove a section
  const removeSection = (sectionType: SectionType) => {
    const updatedBuilder = new ExamStructureBuilder();
    
    // Copy only the sections that won't be removed
    examBuilder.getEnabledSections()
      .filter(section => section.sectionType !== sectionType)
      .forEach(section => {
        updatedBuilder.enableSection(
          section.sectionType,
          section.questionCount,
          section.weight
        );
      });
    
    // Update the builder and enabled sections
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form
    if (['basic', 'specific1', 'specific2', 'specific3', 'discursive', 'case_study1', 'case_study2', 'case_study3'].includes(sectionType)) {
      const hasKey = `has_${getSectionKey(sectionType)}` as keyof typeof form.getValues();
      form.setValue(hasKey as any, false);
    } else {
      // For custom sections, update the disciplines list in the form
      const disciplines = form.getValues('disciplines') || [];
      const updatedDisciplines = disciplines.filter((d: any) => 
        d.type !== sectionType || d.name !== sectionDisplayNames[sectionType as keyof typeof sectionDisplayNames]
      );
      form.setValue('disciplines', updatedDisciplines);
    }
  };

  // Add custom section
  const addCustomSection = () => {
    if (!customSectionName.trim()) return;
    
    const questionCount = parseInt(customSectionQuestions) || 0;
    const weight = parseInt(customSectionWeight) || 1;
    
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
    
    // Update the builder and enabled sections
    setExamBuilder(updatedBuilder);
    setEnabledSections(updatedBuilder.getEnabledSections());
    
    // Update form - add to disciplines list
    const disciplines = form.getValues('disciplines') || [];
    const type = customSectionName.toLowerCase().replace(/\s+/g, '_');
    disciplines.push({
      name: customSectionName,
      type: type,
      questionCount: questionCount,
      weight: weight,
      isEnabled: true
    });
    form.setValue('disciplines', disciplines);
    
    // Clear fields
    setCustomSectionName('');
    setCustomSectionQuestions('0');
    setCustomSectionWeight('1');
    setIsCustomDialogOpen(false);
  };

  // Check which sections are already enabled
  const isEnabledSection = (sectionType: SectionType): boolean => {
    return enabledSections.some(section => section.sectionType === sectionType);
  };

  // Get available sections to add
  const getAvailableSections = () => {
    const available: Array<{ type: SectionType, name: string }> = [];
    
    // Standard sections
    if (!isEnabledSection('basic')) available.push({ type: 'basic', name: 'Conhecimentos Básicos' });
    if (!isEnabledSection('specific1')) available.push({ type: 'specific1', name: 'Conhecimentos Específicos' });
    if (!isEnabledSection('specific2')) available.push({ type: 'specific2', name: 'Conhecimentos Específicos 2' });
    if (!isEnabledSection('specific3')) available.push({ type: 'specific3', name: 'Conhecimentos Específicos 3' });
    if (!isEnabledSection('discursive')) available.push({ type: 'discursive', name: 'Dissertativa' });
    if (!isEnabledSection('case_study1')) available.push({ type: 'case_study1', name: 'Estudo de Caso' });
    if (!isEnabledSection('case_study2')) available.push({ type: 'case_study2', name: 'Estudo de Caso 2' });
    if (!isEnabledSection('case_study3')) available.push({ type: 'case_study3', name: 'Estudo de Caso 3' });
    
    // Specific predefined disciplines
    Object.entries(sectionDisplayNames).forEach(([type, name]) => {
      if (!['basic', 'specific1', 'specific2', 'specific3', 'discursive', 
            'case_study1', 'case_study2', 'case_study3'].includes(type) &&
          !isEnabledSection(type as SectionType)) {
        available.push({ type: type as SectionType, name });
      }
    });
    
    return available;
  };

  // Handler to open custom section dialog
  const handleCustomSectionClick = () => {
    setIsCustomDialogOpen(true);
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        
        <div className="flex gap-2">
          <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Conhecimento Customizado
              </Button>
            </DialogTrigger>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Seção Pré-definida
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Standard sections */}
              {!isEnabledSection('basic') && (
                <DropdownMenuItem onClick={() => addSection('basic')}>
                  Conhecimentos Básicos
                </DropdownMenuItem>
              )}
              {!isEnabledSection('specific1') && (
                <DropdownMenuItem onClick={() => addSection('specific1')}>
                  Conhecimentos Específicos
                </DropdownMenuItem>
              )}
              {!isEnabledSection('specific2') && (
                <DropdownMenuItem onClick={() => addSection('specific2')}>
                  Conhecimentos Específicos 2
                </DropdownMenuItem>
              )}
              {!isEnabledSection('specific3') && (
                <DropdownMenuItem onClick={() => addSection('specific3')}>
                  Conhecimentos Específicos 3
                </DropdownMenuItem>
              )}
              {!isEnabledSection('discursive') && (
                <DropdownMenuItem onClick={() => addSection('discursive')}>
                  Dissertativa
                </DropdownMenuItem>
              )}
              {!isEnabledSection('case_study1') && (
                <DropdownMenuItem onClick={() => addSection('case_study1')}>
                  Estudo de Caso
                </DropdownMenuItem>
              )}
              {!isEnabledSection('case_study2') && (
                <DropdownMenuItem onClick={() => addSection('case_study2')}>
                  Estudo de Caso 2
                </DropdownMenuItem>
              )}
              {!isEnabledSection('case_study3') && (
                <DropdownMenuItem onClick={() => addSection('case_study3')}>
                  Estudo de Caso 3
                </DropdownMenuItem>
              )}
              
              {/* Separator for custom option */}
              <DropdownMenuSeparator />
              
              {/* Option to add custom knowledge */}
              <DropdownMenuItem onClick={handleCustomSectionClick}>
                Outro: Digite o Conhecimento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* General exam settings */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h4 className="font-medium mb-4">Configurações Gerais do Exame</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exam Type */}
          <FormField
            control={form.control}
            name="exam_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Prova</FormLabel>
                <Select 
                  defaultValue={field.value} 
                  onValueChange={(value) => {
                    field.onChange(value);
                    examBuilder.withExamType(value as 'Alternativas' | 'Certo ou Errado');
                  }}
                >
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
                <FormDescription>
                  Formato das questões do exame
                </FormDescription>
              </FormItem>
            )}
          />
          
          {/* Alternatives Count */}
          <FormField
            control={form.control}
            name="alternatives_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade de Alternativas</FormLabel>
                <Select 
                  defaultValue={String(field.value)} 
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    examBuilder.withAlternativesCount(Number(value));
                  }}
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
                <FormDescription>
                  Para provas de múltipla escolha
                </FormDescription>
              </FormItem>
            )}
          />
          
          {/* Wrong Answer Penalty */}
          <FormField
            control={form.control}
            name="wrong_answer_penalty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penalidade para Erro</FormLabel>
                <Select 
                  defaultValue={String(field.value)} 
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    examBuilder.withWrongAnswerPenalty(Number(value));
                  }}
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
                <FormDescription>
                  Pontos descontados por resposta errada
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
      </div>
      
      {/* Configured sections list */}
      <div className="space-y-4">
        {enabledSections.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
            Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
          </div>
        )}
        
        {enabledSections.map(section => (
          <div key={section.sectionType} className="border p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium">
                {section.isCustom ? section.customName : section.displayName}
              </h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSection(section.sectionType)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderQuestionsInput(section)}
              {renderWeightSelect(section)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomExamStructureSection;
