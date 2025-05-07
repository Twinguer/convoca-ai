import React, { useState, useMemo } from 'react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { DEFAULT_SUBJECTS, generateSubjectCode } from '@/integrations/supabase/rankings/examStructure';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [customSubjectDialogOpen, setCustomSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  
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
  
  // Exam structure type selector
  const renderExamTypeSelector = () => (
    <FormField
      control={form.control}
      name="minimum_score_type"
      render={({ field }) => (
        <FormItem className="mb-6">
          <FormLabel>Tipo de Estrutura da Prova</FormLabel>
          <Select 
            onValueChange={(value) => {
              // Clear current sections when changing type
              if (value === 'knowledge') {
                // Reset knowledge sections but keep values for future
                const current = form.getValues();
                form.reset({
                  ...current,
                  has_basic_knowledge: false,
                  has_specific_knowledge_1: false,
                  has_specific_knowledge_2: false,
                  has_specific_knowledge_3: false,
                  has_discursive: false,
                  has_case_study_1: false,
                  has_case_study_2: false,
                  has_case_study_3: false,
                  minimum_score_type: 'knowledge',
                  subjects: []
                });
              } else if (value === 'subject') {
                // Reset subject sections but keep values for future
                const current = form.getValues();
                form.reset({
                  ...current,
                  has_basic_knowledge: false,
                  has_specific_knowledge_1: false,
                  has_specific_knowledge_2: false,
                  has_specific_knowledge_3: false,
                  has_discursive: false,
                  has_case_study_1: false,
                  has_case_study_2: false,
                  has_case_study_3: false,
                  minimum_score_type: 'subject',
                  subjects: []
                });
              }
              field.onChange(value);
            }} 
            value={field.value || "knowledge"}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de estrutura" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="knowledge">Mínimos por Conhecimento</SelectItem>
              <SelectItem value="subject">Mínimos por Disciplina</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Escolha como a prova será estruturada: por áreas de conhecimento ou por disciplinas
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Check which sections are enabled
  const basicKnowledgeEnabled = form.watch('has_basic_knowledge');
  const specificKnowledge1Enabled = form.watch('has_specific_knowledge_1');
  const specificKnowledge2Enabled = form.watch('has_specific_knowledge_2');
  const specificKnowledge3Enabled = form.watch('has_specific_knowledge_3');
  const discursiveEnabled = form.watch('has_discursive');
  const caseStudy1Enabled = form.watch('has_case_study_1');
  const caseStudy2Enabled = form.watch('has_case_study_2');
  const caseStudy3Enabled = form.watch('has_case_study_3');
  
  // Get selected exam structure type
  const examStructureType = form.watch('minimum_score_type') || 'knowledge';
  
  // Get current subjects
  const subjects = form.watch('subjects') || [];
  
  // Handle new custom subject
  const handleAddCustomSubject = () => {
    if (!newSubjectName.trim()) return;
    
    const code = newSubjectCode || generateSubjectCode(newSubjectName);
    const newSubject = {
      code,
      name: newSubjectName.trim(),
      question_count: 0,
      weight: 1,
      minimum_score: 0,
      minimum_score_unit_type: 'points'
    };
    
    const currentSubjects = form.getValues('subjects') || [];
    form.setValue('subjects', [...currentSubjects, newSubject]);
    
    // Reset form fields
    setNewSubjectName('');
    setNewSubjectCode('');
    setCustomSubjectDialogOpen(false);
  };
  
  // Handle subject removal
  const handleRemoveSubject = (index: number) => {
    const currentSubjects = [...(form.getValues('subjects') || [])];
    currentSubjects.splice(index, 1);
    form.setValue('subjects', currentSubjects);
  };
  
  // Handle adding a predefined subject
  const handleAddPredefinedSubject = (subject: { code: string; name: string }) => {
    const currentSubjects = form.getValues('subjects') || [];
    
    // Check if subject already exists
    if (currentSubjects.some(s => s.code === subject.code)) {
      return; // Already added
    }
    
    const newSubject = {
      ...subject,
      question_count: 0,
      weight: 1,
      minimum_score: 0,
      minimum_score_unit_type: 'points'
    };
    
    form.setValue('subjects', [...currentSubjects, newSubject]);
  };
  
  // Toggle a section on/off
  const toggleSection = (name: string, value: boolean) => {
    form.setValue(name, value);
  };

  // Helper to update subject field by index
  const handleSubjectFieldChange = (index: number, field: string, value: any) => {
    const currentSubjects = [...(form.getValues('subjects') || [])];
    if (!currentSubjects[index]) return;
    
    currentSubjects[index] = {
      ...currentSubjects[index],
      [field]: value
    };
    
    form.setValue('subjects', currentSubjects);
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
            onClick={() => toggleSection(enabledFlag, false)}
            className="text-red-500 hover:text-red-700"
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

  // Render a subject card
  const renderSubjectCard = (subject: any, index: number) => {
    return (
      <div key={`subject-${index}`} className="border p-4 rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-medium">{subject.name}</h4>
            <span className="text-xs text-gray-500">Código: {subject.code}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleRemoveSubject(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantidade de questões */}
          <div className="w-full">
            <FormLabel>Quantidade de Questões</FormLabel>
            <Input 
              type="number" 
              min="0"
              value={subject.question_count || 0}
              onChange={(e) => handleSubjectFieldChange(index, 'question_count', Number(e.target.value))}
            />
          </div>
          
          {/* Peso */}
          <div>
            <FormLabel>Peso</FormLabel>
            <Select 
              value={(subject.weight || 1).toString()}
              onValueChange={(value) => handleSubjectFieldChange(index, 'weight', Number(value))}
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
          
          {/* Pontuação mínima */}
          <div>
            <FormLabel>Pontuação Mínima</FormLabel>
            <div className="flex space-x-2">
              <Input 
                type="number" 
                min="0"
                value={subject.minimum_score || 0}
                onChange={(e) => handleSubjectFieldChange(index, 'minimum_score', Number(e.target.value))}
                className="w-full"
              />
              <Select 
                value={subject.minimum_score_unit_type || 'points'}
                onValueChange={(value) => handleSubjectFieldChange(index, 'minimum_score_unit_type', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">pontos</SelectItem>
                  <SelectItem value="percentage">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        
        {/* Selector for exam structure type */}
        {renderExamTypeSelector()}
      </div>
      
      <div className="flex justify-between items-center">
        <h4 className="font-medium">
          {examStructureType === 'knowledge' ? 'Áreas de Conhecimento' : 'Disciplinas'}
        </h4>
        
        {examStructureType === 'knowledge' ? (
          /* Knowledge sections dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          /* Subjects dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Disciplina
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Disciplinas Comuns</DropdownMenuLabel>
              {DEFAULT_SUBJECTS.slice(0, 8).map((subject) => (
                <DropdownMenuItem 
                  key={subject.code}
                  onClick={() => handleAddPredefinedSubject(subject)}
                >
                  {subject.name}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Mais Disciplinas</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {DEFAULT_SUBJECTS.slice(8).map((subject) => (
                    <DropdownMenuItem 
                      key={subject.code}
                      onClick={() => handleAddPredefinedSubject(subject)}
                    >
                      {subject.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setCustomSubjectDialogOpen(true)}>
                Outra Disciplina...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Render appropriate section based on type */}
      {examStructureType === 'knowledge' ? (
        /* Knowledge sections */
        <>
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
        </>
      ) : (
        /* Subject sections */
        <>
          {subjects.map((subject, index) => renderSubjectCard(subject, index))}
        </>
      )}

      {/* Display empty state message when no sections are added */}
      {examStructureType === 'knowledge' && 
       !basicKnowledgeEnabled && 
       !specificKnowledge1Enabled && 
       !specificKnowledge2Enabled && 
       !specificKnowledge3Enabled && 
       !discursiveEnabled && 
       !caseStudy1Enabled && 
       !caseStudy2Enabled && 
       !caseStudy3Enabled && (
        <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
          Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
        </div>
      )}
      
      {examStructureType === 'subject' && subjects.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
          Nenhuma disciplina adicionada. Clique em "Adicionar Disciplina" para incluir disciplinas na prova.
        </div>
      )}
      
      {/* Dialog for adding custom subject */}
      <Dialog open={customSubjectDialogOpen} onOpenChange={setCustomSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Disciplina</DialogTitle>
            <DialogDescription>
              Preencha o nome da disciplina e opcionalmente um código de 3 letras.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Nome</FormLabel>
              <Input 
                id="subject-name" 
                value={newSubjectName}
                onChange={(e) => {
                  setNewSubjectName(e.target.value);
                  if (!newSubjectCode) {
                    setNewSubjectCode(generateSubjectCode(e.target.value));
                  }
                }}
                className="col-span-3"
                placeholder="Ex: Direito Constitucional"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <FormLabel className="text-right">Código</FormLabel>
              <Input 
                id="subject-code" 
                value={newSubjectCode}
                onChange={(e) => {
                  // Limite a 3 caracteres, apenas letras maiúsculas
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, '')
                    .substring(0, 3);
                  setNewSubjectCode(value);
                }}
                className="col-span-3"
                placeholder="Código de 3 letras (ex: DCO)"
                maxLength={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomSubjectDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddCustomSubject}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
