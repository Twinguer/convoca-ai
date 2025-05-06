
import React, { useState } from 'react';
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SubjectConfig, availableSubjects, generateSubjectCode } from '@/types/concursos';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  const [minimumScoreType, setMinimumScoreType] = useState<'percentage' | 'points'>('percentage');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

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

  // Função específica para manipular configurações de disciplinas
  const handleAddSubject = (subjectName: string) => {
    let name = subjectName;
    let code = '';
    
    // Se for disciplina personalizada
    if (subjectName === 'Outro') {
      if (!customSubjectName.trim()) return;
      name = customSubjectName;
      code = generateSubjectCode(customSubjectName);
      setCustomSubjectName('');
    } else {
      // Busca o código da lista de disciplinas disponíveis
      const subject = availableSubjects.find(s => s.name === subjectName);
      code = subject ? subject.code : generateSubjectCode(subjectName);
    }
    
    // Adiciona a disciplina à lista
    const newSubject: SubjectConfig = {
      name,
      code,
      questions: 0,
      weight: 1,
      minimum_score: 0,
      minimum_score_unit_type: minimumScoreType
    };
    
    setSubjects([...subjects, newSubject]);
    
    // Atualiza o formulário com a lista atualizada de disciplinas
    form.setValue('subjects', [...subjects, newSubject]);
  };
  
  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = [...subjects];
    updatedSubjects.splice(index, 1);
    setSubjects(updatedSubjects);
    form.setValue('subjects', updatedSubjects);
  };
  
  // Atualiza um valor específico de uma disciplina
  const updateSubjectField = (index: number, field: keyof SubjectConfig, value: any) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    setSubjects(updatedSubjects);
    form.setValue('subjects', updatedSubjects);
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
  
  // Verificar o tipo de mínimo selecionado
  const minimumType = form.watch('minimum_score_type') || 'knowledge';

  // Toggle a section on/off
  const toggleSection = (name: string, value: boolean) => {
    form.setValue(name, value);
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
  
  // Renderiza um card de disciplina
  const renderSubjectCard = (subject: SubjectConfig, index: number) => {
    return (
      <div key={index} className="border p-4 rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">{subject.name} <span className="text-sm text-gray-500">({subject.code})</span></h4>
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
          {/* Quantidade de Questões */}
          <div className="w-full">
            <FormLabel>Quantidade de Questões</FormLabel>
            <Input 
              type="number" 
              min="0"
              value={subject.questions}
              onChange={(e) => updateSubjectField(index, 'questions', Number(e.target.value))}
            />
          </div>
          
          {/* Peso */}
          <div className="w-full">
            <FormLabel>Peso</FormLabel>
            <Select 
              value={subject.weight.toString()}
              onValueChange={(value) => updateSubjectField(index, 'weight', parseInt(value))}
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
            <FormDescription>
              Multiplicador da pontuação
            </FormDescription>
          </div>
          
          {/* Nota Mínima */}
          <div className="w-full">
            <FormLabel>Nota Mínima {subject.minimum_score_unit_type === 'percentage' ? '(%)' : '(pontos)'}</FormLabel>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input 
                  type="number" 
                  min="0"
                  max={subject.minimum_score_unit_type === 'percentage' ? 100 : subject.questions} 
                  value={subject.minimum_score}
                  onChange={(e) => updateSubjectField(index, 'minimum_score', Number(e.target.value))}
                />
              </div>
              <Tabs 
                value={subject.minimum_score_unit_type}
                className="w-[180px]"
                onValueChange={(value) => {
                  updateSubjectField(index, 'minimum_score_unit_type', value as 'percentage' | 'points');
                }}
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="percentage">%</TabsTrigger>
                  <TabsTrigger value="points">Pontos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <FormDescription>
              {subject.minimum_score_unit_type === 'percentage' 
                ? 'Porcentagem mínima para aprovação (0-100%)' 
                : `Pontuação mínima para aprovação (0-${subject.questions})`}
            </FormDescription>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Estrutura da Prova</h3>
        
        {/* Seletor de tipo de mínimo (conhecimento ou disciplina) */}
        <div className="mb-4">
          <FormField
            control={form.control}
            name="minimum_score_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Nota Mínima</FormLabel>
                <RadioGroup 
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Limpa as disciplinas quando muda para conhecimento
                    if (value === 'knowledge') {
                      setSubjects([]);
                      form.setValue('subjects', []);
                    }
                  }}
                  defaultValue={field.value || 'knowledge'}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="knowledge" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Por Área de Conhecimento
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="subject" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Por Disciplina
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
                <FormMessage />
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
      
      {/* Campo hidden para armazenar as disciplinas */}
      <FormField
        control={form.control}
        name="subjects"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input 
                type="hidden" 
                {...field} 
                value={JSON.stringify(subjects)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Botão de adicionar áreas ou disciplinas */}
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar {minimumType === 'knowledge' ? 'Área' : 'Disciplina'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {minimumType === 'knowledge' ? (
              // Dropdown para adicionar áreas de conhecimento
              <>
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
              </>
            ) : (
              // Dropdown para adicionar disciplinas
              <>
                {availableSubjects.map((subject) => (
                  <DropdownMenuItem 
                    key={subject.code}
                    onClick={() => handleAddSubject(subject.name)}
                    disabled={subjects.some(s => s.code === subject.code)}
                  >
                    {subject.name} ({subject.code})
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem 
                  onClick={() => {
                    if (customSubjectName.trim()) {
                      handleAddSubject('Outro');
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span>Outro:</span>
                    <Input 
                      placeholder="Digite a disciplina" 
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-32"
                    />
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (customSubjectName.trim()) {
                          handleAddSubject('Outro');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Para conhecimentos por área */}
      {minimumType === 'knowledge' && (
        <>
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
        </>
      )}
      
      {/* Para disciplinas */}
      {minimumType === 'subject' && (
        <>
          {subjects.map((subject, index) => renderSubjectCard(subject, index))}
        </>
      )}

      {/* Mensagem quando não há seções ou disciplinas */}
      {minimumType === 'knowledge' && 
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
      
      {minimumType === 'subject' && subjects.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
          Nenhuma disciplina adicionada. Clique em "Adicionar" para incluir disciplinas da prova.
        </div>
      )}
    </div>
  );
};
