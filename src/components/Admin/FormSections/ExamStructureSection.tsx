
import React from 'react';
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
import { MinimumScoreSection } from './MinimumScoreSection';
import { KnowledgeAreaSelector } from './KnowledgeAreaSelector';
import { Switch } from '@/components/ui/switch';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  // Helper para renderizar o componente de seleção de peso
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

  // Helper para inputs de quantidade de questões
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

  // Renderizar dropdown de penalidade para erros
  const renderPenaltySelect = () => (
    <FormField
      control={form.control}
      name="wrong_answer_penalty"
      render={({ field }) => (
        <FormItem className="w-full md:w-auto">
          <FormLabel>Penalidade para Erros</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(parseFloat(value))} 
            value={field.value?.toString() || "0"}
          >
            <FormControl>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Selecione a penalidade" />
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
          <FormDescription>
            Pontos perdidos ao errar questões
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Verificar quais seções estão habilitadas
  const basicKnowledgeEnabled = form.watch('has_basic_knowledge');
  const specificKnowledge1Enabled = form.watch('has_specific_knowledge_1');
  const specificKnowledge2Enabled = form.watch('has_specific_knowledge_2');
  const specificKnowledge3Enabled = form.watch('has_specific_knowledge_3');
  const discursiveEnabled = form.watch('has_discursive');
  const caseStudy1Enabled = form.watch('has_case_study_1');
  const caseStudy2Enabled = form.watch('has_case_study_2');
  const caseStudy3Enabled = form.watch('has_case_study_3');
  
  // Verificar configurações de pontuação mínima
  const hasMinimumScore = form.watch('has_minimum_score');
  const minimumScoreType = form.watch('minimum_score_type') || 'knowledge';

  // Alternar uma seção ligada/desligada
  const toggleSection = (name: string, value: boolean) => {
    form.setValue(name, value);
  };

  // Renderizar um card de seção com seus inputs
  const renderSectionCard = (
    title: string, 
    enabledFlag: string, 
    isEnabled: boolean, 
    questionField?: string, 
    weightField?: string,
    sectionId?: string
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
        
        {/* Knowledge Areas Selector - Mostrar apenas para as seções apropriadas se minimum_score_type === 'subject' */}
        {hasMinimumScore && minimumScoreType === 'subject' && sectionId && (
          <div className="mt-4 pt-4 border-t">
            <KnowledgeAreaSelector form={form} sectionId={sectionId} />
          </div>
        )}
        
        {/* Seção de Pontuação Mínima */}
        {hasMinimumScore && minimumScoreType === 'knowledge' && sectionId && (
          <div className="mt-4">
            <MinimumScoreSection 
              form={form} 
              sectionId={sectionId}
              label={title} 
            />
          </div>
        )}
      </div>
    );
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
      </div>
      
      {/* Configuração do Exame */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-md">
        <FormField
          control={form.control}
          name="exam_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Prova</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || "Alternativas"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de prova" />
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
        
        <FormField
          control={form.control}
          name="alternatives_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Alternativas</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value?.toString() || "5"}
                disabled={form.watch('exam_type') !== 'Alternativas'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Quantidade de alternativas" />
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
        
        {renderPenaltySelect()}
      </div>
      
      {/* Configuração de Pontuação Mínima - Configurações globais */}
      <div className="space-y-4 p-4 border rounded-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium">Nota Mínima</h3>
          
          <FormField
            control={form.control}
            name="has_minimum_score"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">
                    Habilitar nota de corte
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {hasMinimumScore && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minimum_score_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de nota mínima</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || 'knowledge'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="knowledge">Por Conhecimento</SelectItem>
                        <SelectItem value="subject">Por Matéria</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define como a nota mínima será calculada
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minimum_score_unit_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade da nota mínima</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || 'percentage'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="points">Pontos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Pontuação mínima total */}
            <FormField
              control={form.control}
              name="total_minimum_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nota mínima total {form.watch('minimum_score_unit_type') === 'percentage' ? '(%)' : '(pontos)'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      max={form.watch('minimum_score_unit_type') === 'percentage' ? 100 : undefined}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Nota mínima geral para classificação
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      {/* Renderizar todas as seções habilitadas */}
      {renderSectionCard(
        "Conhecimentos Básicos", 
        "has_basic_knowledge", 
        basicKnowledgeEnabled, 
        "basic_knowledge_questions", 
        "basic_knowledge_weight",
        "basic_knowledge"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 1", 
        "has_specific_knowledge_1", 
        specificKnowledge1Enabled,
        "specific_knowledge_1_questions", 
        "specific_knowledge_1_weight",
        "specific_knowledge_1"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 2", 
        "has_specific_knowledge_2", 
        specificKnowledge2Enabled,
        "specific_knowledge_2_questions", 
        "specific_knowledge_2_weight",
        "specific_knowledge_2"
      )}
      
      {renderSectionCard(
        "Conhecimentos Específicos 3", 
        "has_specific_knowledge_3", 
        specificKnowledge3Enabled,
        "specific_knowledge_3_questions", 
        "specific_knowledge_3_weight",
        "specific_knowledge_3"
      )}
      
      {renderSectionCard(
        "Discursiva", 
        "has_discursive", 
        discursiveEnabled, 
        undefined, 
        "discursive_weight",
        "discursive"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 1", 
        "has_case_study_1", 
        caseStudy1Enabled, 
        undefined, 
        "case_study_1_weight",
        "case_study_1"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 2", 
        "has_case_study_2", 
        caseStudy2Enabled, 
        undefined, 
        "case_study_2_weight",
        "case_study_2"
      )}
      
      {renderSectionCard(
        "Estudo de Caso 3", 
        "has_case_study_3", 
        caseStudy3Enabled, 
        undefined, 
        "case_study_3_weight",
        "case_study_3"
      )}

      {!basicKnowledgeEnabled && 
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
    </div>
  );
};
