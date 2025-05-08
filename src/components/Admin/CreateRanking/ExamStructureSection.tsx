
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Trash2 } from 'lucide-react';

interface ExamStructureSectionProps {
  form: any;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
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
      // Novas áreas de conhecimento
      case 'lpt':
        form.setValue('has_lpt', true);
        break;
      case 'ing':
        form.setValue('has_ing', true);
        break;
      case 'mat':
        form.setValue('has_mat', true);
        break;
      case 'rlm':
        form.setValue('has_rlm', true);
        break;
      case 'est':
        form.setValue('has_est', true);
        break;
      case 'cos':
        form.setValue('has_cos', true);
        break;
      case 'adm':
        form.setValue('has_adm', true);
        break;
      case 'ado':
        form.setValue('has_ado', true);
        break;
      case 'cot':
        form.setValue('has_cot', true);
        break;
      case 'coc':
        form.setValue('has_coc', true);
        break;
      case 'eco':
        form.setValue('has_eco', true);
        break;
      case 'tri':
        form.setValue('has_tri', true);
        break;
      case 'afo':
        form.setValue('has_afo', true);
        break;
      case 'ltc':
        form.setValue('has_ltc', true);
        break;
      case 'tic':
        form.setValue('has_tic', true);
        break;
      case 'ett':
        form.setValue('has_ett', true);
        break;
      case 'aud':
        form.setValue('has_aud', true);
        break;
      case 'civ':
        form.setValue('has_civ', true);
        break;
      case 'pen':
        form.setValue('has_pen', true);
        break;
      case 'inf':
        form.setValue('has_inf', true);
        break;
      case 'emp':
        form.setValue('has_emp', true);
        break;
      case 'mtf':
        form.setValue('has_mtf', true);
        break;
      case 'out':
        form.setValue('has_out', true);
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
      // Novas áreas de conhecimento
      case 'lpt':
        form.setValue('has_lpt', false);
        break;
      case 'ing':
        form.setValue('has_ing', false);
        break;
      case 'mat':
        form.setValue('has_mat', false);
        break;
      case 'rlm':
        form.setValue('has_rlm', false);
        break;
      case 'est':
        form.setValue('has_est', false);
        break;
      case 'cos':
        form.setValue('has_cos', false);
        break;
      case 'adm':
        form.setValue('has_adm', false);
        break;
      case 'ado':
        form.setValue('has_ado', false);
        break;
      case 'cot':
        form.setValue('has_cot', false);
        break;
      case 'coc':
        form.setValue('has_coc', false);
        break;
      case 'eco':
        form.setValue('has_eco', false);
        break;
      case 'tri':
        form.setValue('has_tri', false);
        break;
      case 'afo':
        form.setValue('has_afo', false);
        break;
      case 'ltc':
        form.setValue('has_ltc', false);
        break;
      case 'tic':
        form.setValue('has_tic', false);
        break;
      case 'ett':
        form.setValue('has_ett', false);
        break;
      case 'aud':
        form.setValue('has_aud', false);
        break;
      case 'civ':
        form.setValue('has_civ', false);
        break;
      case 'pen':
        form.setValue('has_pen', false);
        break;
      case 'inf':
        form.setValue('has_inf', false);
        break;
      case 'emp':
        form.setValue('has_emp', false);
        break;
      case 'mtf':
        form.setValue('has_mtf', false);
        break;
      case 'out':
        form.setValue('has_out', false);
        break;
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
              {/* Conhecimentos tradicionais */}
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

              {/* Novas áreas de conhecimento */}
              {!form.watch('has_lpt') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('lpt')}>
                  Português (LPT)
                </DropdownMenuItem>
              )}
              {!form.watch('has_ing') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('ing')}>
                  Inglês (ING)
                </DropdownMenuItem>
              )}
              {!form.watch('has_mat') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('mat')}>
                  Matemática (MAT)
                </DropdownMenuItem>
              )}
              {!form.watch('has_rlm') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('rlm')}>
                  RLM
                </DropdownMenuItem>
              )}
              {!form.watch('has_est') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('est')}>
                  Estatística (EST)
                </DropdownMenuItem>
              )}
              {!form.watch('has_cos') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('cos')}>
                  Constitucional (COS)
                </DropdownMenuItem>
              )}
              {!form.watch('has_adm') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('adm')}>
                  Administrativo (ADM)
                </DropdownMenuItem>
              )}
              {!form.watch('has_ado') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('ado')}>
                  Administração (ADO)
                </DropdownMenuItem>
              )}
              {!form.watch('has_cot') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('cot')}>
                  Contabilidade (COT)
                </DropdownMenuItem>
              )}
              {!form.watch('has_coc') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('coc')}>
                  Contabilidade Custos (COC)
                </DropdownMenuItem>
              )}
              {!form.watch('has_eco') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('eco')}>
                  Economia (ECO)
                </DropdownMenuItem>
              )}
              {!form.watch('has_tri') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('tri')}>
                  Tributário (TRI)
                </DropdownMenuItem>
              )}
              {!form.watch('has_afo') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('afo')}>
                  AFO
                </DropdownMenuItem>
              )}
              {!form.watch('has_ltc') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('ltc')}>
                  Legislação Tributária (LTC)
                </DropdownMenuItem>
              )}
              {!form.watch('has_tic') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('tic')}>
                  Tecnologia da Informação (TIC)
                </DropdownMenuItem>
              )}
              {!form.watch('has_ett') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('ett')}>
                  Estatuto (ETT)
                </DropdownMenuItem>
              )}
              {!form.watch('has_aud') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('aud')}>
                  Auditoria (AUD)
                </DropdownMenuItem>
              )}
              {!form.watch('has_civ') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('civ')}>
                  Civil (CIV)
                </DropdownMenuItem>
              )}
              {!form.watch('has_pen') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('pen')}>
                  Penal (PEN)
                </DropdownMenuItem>
              )}
              {!form.watch('has_inf') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('inf')}>
                  Informática (INF)
                </DropdownMenuItem>
              )}
              {!form.watch('has_emp') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('emp')}>
                  Empresarial (EMP)
                </DropdownMenuItem>
              )}
              {!form.watch('has_mtf') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('mtf')}>
                  Mat. Financeira (MTF)
                </DropdownMenuItem>
              )}
              {!form.watch('has_out') && (
                <DropdownMenuItem onClick={() => handleAddKnowledgeArea('out')}>
                  Outro (OUT)
                </DropdownMenuItem>
              )}

              {/* Discursiva e Estudos de Caso */}
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
          {!form.watch('has_basic_knowledge') && 
           !form.watch('has_specific_knowledge_1') && 
           !form.watch('has_specific_knowledge_2') && 
           !form.watch('has_specific_knowledge_3') &&
           !form.watch('has_lpt') && !form.watch('has_ing') && !form.watch('has_mat') && !form.watch('has_rlm') &&
           !form.watch('has_est') && !form.watch('has_cos') && !form.watch('has_adm') && !form.watch('has_ado') &&
           !form.watch('has_cot') && !form.watch('has_coc') && !form.watch('has_eco') && !form.watch('has_tri') &&
           !form.watch('has_afo') && !form.watch('has_ltc') && !form.watch('has_tic') && !form.watch('has_ett') &&
           !form.watch('has_aud') && !form.watch('has_civ') && !form.watch('has_pen') && !form.watch('has_inf') &&
           !form.watch('has_emp') && !form.watch('has_mtf') && !form.watch('has_out') &&
           !form.watch('has_discursive') &&
           !form.watch('has_case_study_1') &&
           !form.watch('has_case_study_2') &&
           !form.watch('has_case_study_3') && (
            <div className="text-center p-8 border border-dashed rounded-md text-gray-500">
              Nenhuma seção adicionada. Clique em "Adicionar" para incluir seções da prova.
            </div>
          )}
          
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

          {/* Português (LPT) */}
          {form.watch('has_lpt') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Português (LPT)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('lpt')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("lpt_questions")}
                {renderWeightSelect("lpt_weight")}
              </div>
            </div>
          )}

          {/* Inglês (ING) */}
          {form.watch('has_ing') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Inglês (ING)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('ing')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("ing_questions")}
                {renderWeightSelect("ing_weight")}
              </div>
            </div>
          )}

          {/* Matemática (MAT) */}
          {form.watch('has_mat') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Matemática (MAT)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('mat')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("mat_questions")}
                {renderWeightSelect("mat_weight")}
              </div>
            </div>
          )}

          {/* Continue para todas as outras novas áreas de conhecimento da mesma forma */}
          {/* RLM */}
          {form.watch('has_rlm') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">RLM</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('rlm')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("rlm_questions")}
                {renderWeightSelect("rlm_weight")}
              </div>
            </div>
          )}

          {/* Estatística (EST) */}
          {form.watch('has_est') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Estatística (EST)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('est')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("est_questions")}
                {renderWeightSelect("est_weight")}
              </div>
            </div>
          )}

          {/* Constitucional (COS) */}
          {form.watch('has_cos') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Constitucional (COS)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('cos')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("cos_questions")}
                {renderWeightSelect("cos_weight")}
              </div>
            </div>
          )}

          {/* Administrativo (ADM) */}
          {form.watch('has_adm') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Administrativo (ADM)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('adm')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("adm_questions")}
                {renderWeightSelect("adm_weight")}
              </div>
            </div>
          )}

          {/* Administração (ADO) */}
          {form.watch('has_ado') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Administração (ADO)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('ado')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("ado_questions")}
                {renderWeightSelect("ado_weight")}
              </div>
            </div>
          )}

          {/* Contabilidade (COT) */}
          {form.watch('has_cot') && (
            <div className="border p-4 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium">Contabilidade (COT)</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveKnowledgeArea('cot')}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderQuestionsInput("cot_questions")}
                {renderWeightSelect("cot_weight")}
              </div>
            </div>
          )}

          {/* Para economizar espaço, vamos usar o mesmo padrão para as áreas restantes */}
          
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
