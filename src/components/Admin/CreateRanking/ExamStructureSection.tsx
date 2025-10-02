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
export const ExamStructureSectionComponent: React.FC<ExamStructureSectionProps> = ({
  form
}) => {
  // Set custom knowledge to true by default
  const [isCustomKnowledge, setIsCustomKnowledge] = useState<boolean>(true);
  const [hasMinimumScore, setHasMinimumScore] = useState<boolean>(true);

  // Determine if we should show penalty options
  const showPenaltyOptions = form.watch('exam_type') === 'Certo ou Errado';
  useEffect(() => {
    // Set default values if they don't exist
    // Always use custom knowledge
    form.setValue('has_custom_knowledge', true);

    // Check if we have any disciplines and add default if not
    const disciplines = form.watch('disciplines') || [];
    if (disciplines.length === 0) {
      // Migrar disciplinas existentes para blocos se existirem
      const existingDisciplines = form.watch('disciplines') || [];
      if (existingDisciplines.length > 0) {
        // Criar um bloco padrão com as disciplinas existentes
        const defaultBlock = {
          id: uuidv4(),
          name: "Conhecimentos",
          minimum_score: 0,
          disciplines: [...existingDisciplines]
        };
        form.setValue('disciplines', [defaultBlock]);
      } else {
        // Caso não tenha disciplinas, criar um bloco vazio com uma disciplina padrão
        const newDiscipline = {
          id: uuidv4(),
          name: 'Nova Disciplina',
          type: `custom_${uuidv4().slice(0, 8)}`,
          isEnabled: true,
          questionCount: 10,
          weight: 1,
          minimum_score: 0
        };
        const defaultBlock = {
          id: uuidv4(),
          name: "Bloco 1",
          minimum_score: 0,
          disciplines: [newDiscipline]
        };
        form.setValue('disciplines', [defaultBlock]);
      }
    } else {
      // Garantir que todos os blocos têm minimum_score
      const updatedDisciplines = disciplines.map(block => {
        if (block.minimum_score === undefined) {
          return {
            ...block,
            minimum_score: 0
          };
        }
        return block;
      });

      // Garantir que todas as disciplinas têm minimum_score
      const fullyUpdatedDisciplines = updatedDisciplines.map(block => {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          return {
            ...block,
            disciplines: block.disciplines.map(discipline => {
              if (discipline.minimum_score === undefined) {
                return {
                  ...discipline,
                  minimum_score: 0
                };
              }
              return discipline;
            })
          };
        }
        return block;
      });
      form.setValue('disciplines', fullyUpdatedDisciplines);
    }
  }, [form]);

  // Helper function for questions count inputs
  const renderQuestionsInput = (name: string) => <FormField control={form.control} name={name} render={({
    field
  }) => <FormItem>
          <FormLabel>Número de Questões</FormLabel>
          <FormControl>
            <Input type="number" {...field} min="0" onChange={e => field.onChange(Number(e.target.value))} />
          </FormControl>
        </FormItem>} />;

  // Adicionar um novo bloco
  const handleAddBlock = () => {
    const currentBlocks = form.watch('disciplines') || [];
    const newBlock = {
      id: uuidv4(),
      name: `Bloco ${currentBlocks.length + 1}`,
      minimum_score: 0,
      disciplines: [{
        id: uuidv4(),
        name: 'Nova Disciplina',
        type: `custom_${uuidv4().slice(0, 8)}`,
        isEnabled: true,
        questionCount: 10,
        weight: 1,
        minimum_score: 0
      }]
    };
    form.setValue('disciplines', [...currentBlocks, newBlock]);
  };

  // Remover um bloco
  const handleRemoveBlock = (blockId: string) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.filter(block => block.id !== blockId);
    form.setValue('disciplines', updatedBlocks);
  };

  // Atualizar nome de um bloco
  const handleBlockNameChange = (blockId: string, name: string) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.map(block => block.id === blockId ? {
      ...block,
      name
    } : block);
    form.setValue('disciplines', updatedBlocks);
  };

  // Atualizar nota mínima de um bloco
  const handleBlockMinimumScoreChange = (blockId: string, minimumScore: number) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.map(block => block.id === blockId ? {
      ...block,
      minimum_score: minimumScore
    } : block);
    form.setValue('disciplines', updatedBlocks);
  };

  // Adicionar disciplina a um bloco
  const handleAddDiscipline = (blockId: string) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          disciplines: [...(block.disciplines || []), {
            id: uuidv4(),
            name: 'Nova Disciplina',
            type: `custom_${uuidv4().slice(0, 8)}`,
            isEnabled: true,
            questionCount: 10,
            weight: 1,
            minimum_score: 0
          }]
        };
      }
      return block;
    });
    form.setValue('disciplines', updatedBlocks);
  };

  // Remover disciplina de um bloco
  const handleRemoveDiscipline = (blockId: string, disciplineId: string) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          disciplines: (block.disciplines || []).filter(discipline => discipline.id !== disciplineId)
        };
      }
      return block;
    });
    form.setValue('disciplines', updatedBlocks);
  };

  // Atualizar campo de disciplina
  const handleDisciplineChange = (blockId: string, disciplineId: string, field: string, value: any) => {
    const currentBlocks = form.watch('disciplines') || [];
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          disciplines: (block.disciplines || []).map(discipline => {
            if (discipline.id === disciplineId) {
              return {
                ...discipline,
                [field]: value
              };
            }
            return discipline;
          })
        };
      }
      return block;
    });
    form.setValue('disciplines', updatedBlocks);
  };

  // Modified handler for toggle between knowledge types
  const handleKnowledgeTypeToggle = (value: boolean) => {
    console.log(`Toggling knowledge type to custom: ${value}`);
    setIsCustomKnowledge(value);
    form.setValue('has_custom_knowledge', value);
    if (value) {
      // Switching to custom mode - disable all standard knowledge sections
      form.setValue('has_basic_knowledge', false);
      form.setValue('has_specific_knowledge_1', false);
      form.setValue('has_specific_knowledge_2', false);
      form.setValue('has_specific_knowledge_3', false);
    } else {
      // Switching to standard mode - enable at least basic knowledge
      form.setValue('has_basic_knowledge', true);
      form.setValue('basic_knowledge_questions', 10);
      form.setValue('basic_knowledge_weight', 1);
    }
  };
  return <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Estrutura da Prova</h3>
          </div>
          <div className="flex flex-col gap-4">
            {/* Tipo de Prova */}
            <FormField control={form.control} name="exam_type" render={({
            field
          }) => <FormItem>
                  <FormLabel>Tipo de Prova</FormLabel>
                  <Select defaultValue={field.value || 'Alternativas'} onValueChange={field.onChange}>
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
                </FormItem>} />
            
            {/* Quantidade de Alternativas - apenas para multipla escolha */}
            {form.watch('exam_type') !== 'Certo ou Errado' && <FormField control={form.control} name="alternatives_count" render={({
            field
          }) => <FormItem>
                    <FormLabel>Quantidade de Alternativas</FormLabel>
                    <Select defaultValue={String(field.value || 5)} onValueChange={value => field.onChange(Number(value))}>
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
                  </FormItem>} />}
            
            {/* Penalidade para Erro - somente para Certo ou Errado */}
            {showPenaltyOptions && <FormField control={form.control} name="wrong_answer_penalty" render={({
            field
          }) => <FormItem>
                    <FormLabel>Penalidade para Erro</FormLabel>
                    <Select defaultValue={String(field.value || 0)} onValueChange={value => field.onChange(Number(value))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Sem penalidade</SelectItem>
                        <SelectItem value="0.5">0.5 pontos</SelectItem>
                        <SelectItem value="1">1 ponto</SelectItem>
                        <SelectItem value="1.5">1.5 pontos</SelectItem>
                        <SelectItem value="2">2 pontos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>} />}
          </div>
        </div>

        {/* Blocos de Disciplinas */}
        <div className="mb-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Blocos de Disciplinas</h4>
            <Button variant="outline" size="sm" onClick={handleAddBlock}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bloco
            </Button>
          </div>
          
          {/* Renderização dos blocos */}
          {form.watch('disciplines')?.map((block, blockIndex) => <div key={block.id} className="border p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex-grow">
                  <input className="font-medium text-lg bg-transparent border-b border-gray-300 focus:border-gray-600 outline-none w-[70%]" value={block.name} onChange={e => handleBlockNameChange(block.id, e.target.value.slice(0, 15))} placeholder="Nome do Bloco" maxLength={15} />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveBlock(block.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Bloco
                  </Button>
                </div>
              </div>
              
              {/* Nota mínima do bloco */}
              <div className="mb-4">
                <FormLabel>Nota mínima do bloco (valor absoluto)</FormLabel>
                <Input type="number" step="0.01" min="0" value={block.minimum_score || 0} onChange={e => handleBlockMinimumScoreChange(block.id, parseFloat(e.target.value) || 0)} className="w-full md:w-1/3" />
              </div>
              
              {/* Disciplinas do bloco */}
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                {block.disciplines?.map((discipline, disciplineIndex) => <div key={discipline.id} className="border p-4 rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <input className="font-medium bg-transparent border-b border-gray-300 focus:border-gray-600 outline-none w-[70%]" value={discipline.name} onChange={e => handleDisciplineChange(block.id, discipline.id, 'name', e.target.value.slice(0, 50))} placeholder="Nome da Disciplina" maxLength={50} />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDiscipline(block.id, discipline.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <FormLabel>Número de Questões</FormLabel>
                        <Input type="number" value={discipline.questionCount || 0} min="0" onChange={e => handleDisciplineChange(block.id, discipline.id, 'questionCount', Number(e.target.value))} />
                      </div>
                      <div>
                        <FormLabel>Peso</FormLabel>
                        <Select value={String(discipline.weight || 1)} onValueChange={value => handleDisciplineChange(block.id, discipline.id, 'weight', Number(value))}>
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
                      <div>
                        <FormLabel>Nota mínima (valor absoluto)</FormLabel>
                        <Input type="number" step="0.01" min="0" value={discipline.minimum_score || 0} onChange={e => handleDisciplineChange(block.id, discipline.id, 'minimum_score', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>)}
                
                {/* Botão para adicionar disciplina ao bloco */}
                <Button variant="outline" size="sm" onClick={() => handleAddDiscipline(block.id)} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Disciplina
                </Button>
              </div>
            </div>)}
          
          {/* Mensagem se não houver blocos */}
          {(!form.watch('disciplines') || form.watch('disciplines').length === 0) && <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhum bloco adicionado. Clique em "Adicionar Bloco" para criar blocos de disciplinas.
            </div>}
        </div>
        
        {/* Dissertativa e Estudos de Caso - Mantém igual ao original */}
        <div className="mb-4 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Discursivas/Est. Caso</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!form.watch('has_discursive') && <DropdownMenuItem onClick={() => form.setValue('has_discursive', true)}>
                  Dissertativa
                </DropdownMenuItem>}
                {!form.watch('has_case_study_1') && <DropdownMenuItem onClick={() => form.setValue('has_case_study_1', true)}>
                  Estudo de Caso
                </DropdownMenuItem>}
                {!form.watch('has_case_study_2') && <DropdownMenuItem onClick={() => form.setValue('has_case_study_2', true)}>
                  Estudo de Caso 2
                </DropdownMenuItem>}
                {!form.watch('has_case_study_3') && <DropdownMenuItem onClick={() => form.setValue('has_case_study_3', true)}>
                  Estudo de Caso 3
                </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Dissertativa */}
          {form.watch('has_discursive') && <div className="border p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Dissertativa</h5>
                <Button variant="ghost" size="sm" onClick={() => form.setValue('has_discursive', false)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select value={String(form.watch('discursive_weight') || 1)} onValueChange={value => form.setValue('discursive_weight', Number(value))}>
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
            </div>}
          
          {/* Estudo de Caso 1 */}
          {form.watch('has_case_study_1') && <div className="border p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso</h5>
                <Button variant="ghost" size="sm" onClick={() => form.setValue('has_case_study_1', false)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select value={String(form.watch('case_study_1_weight') || 1)} onValueChange={value => form.setValue('case_study_1_weight', Number(value))}>
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
            </div>}
          
          {/* Estudo de Caso 2 */}
          {form.watch('has_case_study_2') && <div className="border p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso 2</h5>
                <Button variant="ghost" size="sm" onClick={() => form.setValue('has_case_study_2', false)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select value={String(form.watch('case_study_2_weight') || 1)} onValueChange={value => form.setValue('case_study_2_weight', Number(value))}>
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
            </div>}
          
          {/* Estudo de Caso 3 */}
          {form.watch('has_case_study_3') && <div className="border p-4 rounded-md mb-4">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estudo de Caso 3</h5>
                <Button variant="ghost" size="sm" onClick={() => form.setValue('has_case_study_3', false)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Peso</FormLabel>
                  <Select value={String(form.watch('case_study_3_weight') || 1)} onValueChange={value => form.setValue('case_study_3_weight', Number(value))}>
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
            </div>}
        </div>
      </CardContent>
    </Card>;
};

// Adicionando uma exportação com o nome esperado pela GeneralTab
export const ExamStructureSection = ExamStructureSectionComponent;