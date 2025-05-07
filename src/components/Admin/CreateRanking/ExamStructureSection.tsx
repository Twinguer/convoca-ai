import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, Trash2 } from 'lucide-react';
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
  form: any;
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
  
  // Render a subject card
  const renderSubjectCard = (subject: any, index: number) => {
    return (
      <div key={`subject-${index}`} className="border p-4 rounded-md mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h5 className="font-medium">{subject.name}</h5>
            <span className="text-xs text-gray-500">Código: {subject.code}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleRemoveSubject(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
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

  // Get selected exam structure type
  const examStructureType = form.watch('minimum_score_type') || 'knowledge';
  
  // Get current subjects
  const subjects = form.watch('subjects') || [];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Estrutura da Prova</h3>
          </div>
          <div className="flex justify-end">
            {/* Tipo de estrutura de prova */}
            {renderExamTypeSelector()}
            
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
        
        {/* Seções da Prova */}
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">
            {examStructureType === 'knowledge' ? 'Áreas de Conhecimento' : 'Disciplinas'}
          </h4>
          
          {examStructureType === 'knowledge' ? (
            /* Knowledge sections dropdown */
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
          ) : (
            /* Subjects dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
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
        
        <div className="space-y-4">
          {/* Área vazia se não tiver nenhuma seção */}
          {examStructureType === 'knowledge' && 
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

          {examStructureType === 'subject' && subjects.length === 0 && (
            <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhuma disciplina adicionada. Clique em "Adicionar Disciplina" para incluir disciplinas na prova.
            </div>
          )}
          
          {/* Knowledge Area sections */}
          {examStructureType === 'knowledge' && (
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
            </>
          )}
          
          {/* Subject sections */}
          {examStructureType === 'subject' && 
            subjects.map((subject, index) => renderSubjectCard(subject, index))
          }
        </div>
        
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
      </CardContent>
    </Card>
  );
};
