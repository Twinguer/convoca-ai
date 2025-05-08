
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

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
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

  // Check which sections are enabled
  const basicKnowledgeEnabled = form.watch('has_basic_knowledge');
  const specificKnowledge1Enabled = form.watch('has_specific_knowledge_1');
  const specificKnowledge2Enabled = form.watch('has_specific_knowledge_2');
  const specificKnowledge3Enabled = form.watch('has_specific_knowledge_3');
  const discursiveEnabled = form.watch('has_discursive');
  const caseStudy1Enabled = form.watch('has_case_study_1');
  const caseStudy2Enabled = form.watch('has_case_study_2');
  const caseStudy3Enabled = form.watch('has_case_study_3');
  
  // Novos conhecimentos
  const lptEnabled = form.watch('has_lpt');
  const ingEnabled = form.watch('has_ing');
  const matEnabled = form.watch('has_mat');
  const rlmEnabled = form.watch('has_rlm');
  const estEnabled = form.watch('has_est');
  const cosEnabled = form.watch('has_cos');
  const admEnabled = form.watch('has_adm');
  const adoEnabled = form.watch('has_ado');
  const cotEnabled = form.watch('has_cot');
  const cocEnabled = form.watch('has_coc');
  const ecoEnabled = form.watch('has_eco');
  const triEnabled = form.watch('has_tri');
  const afoEnabled = form.watch('has_afo');
  const ltcEnabled = form.watch('has_ltc');
  const ticEnabled = form.watch('has_tic');
  const ettEnabled = form.watch('has_ett');
  const audEnabled = form.watch('has_aud');
  const civEnabled = form.watch('has_civ');
  const penEnabled = form.watch('has_pen');
  const infEnabled = form.watch('has_inf');
  const empEnabled = form.watch('has_emp');
  const mtfEnabled = form.watch('has_mtf');
  const outEnabled = form.watch('has_out');

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
            {/* Seções Básicas */}
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
            
            {/* Novos Conhecimentos - Mover "Outro (OUT)" para o final */}
            <DropdownMenuItem 
              onClick={() => toggleSection('has_lpt', true)} 
              disabled={lptEnabled}
            >
              Português (LPT)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_ing', true)} 
              disabled={ingEnabled}
            >
              Inglês (ING)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_mat', true)} 
              disabled={matEnabled}
            >
              Matemática (MAT)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_rlm', true)} 
              disabled={rlmEnabled}
            >
              RLM
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_est', true)} 
              disabled={estEnabled}
            >
              Estatística (EST)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_cos', true)} 
              disabled={cosEnabled}
            >
              Constitucional (COS)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_adm', true)} 
              disabled={admEnabled}
            >
              Administrativo (ADM)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_ado', true)} 
              disabled={adoEnabled}
            >
              Administração (ADO)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_cot', true)} 
              disabled={cotEnabled}
            >
              Contabilidade (COT)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_coc', true)} 
              disabled={cocEnabled}
            >
              Contabilidade Custos (COC)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_eco', true)} 
              disabled={ecoEnabled}
            >
              Economia (ECO)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_tri', true)} 
              disabled={triEnabled}
            >
              Tributário (TRI)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_afo', true)} 
              disabled={afoEnabled}
            >
              AFO
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_ltc', true)} 
              disabled={ltcEnabled}
            >
              Legislação Tributária (LTC)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_tic', true)} 
              disabled={ticEnabled}
            >
              Tecnologia da Informação (TIC)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_ett', true)} 
              disabled={ettEnabled}
            >
              Estatuto (ETT)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_aud', true)} 
              disabled={audEnabled}
            >
              Auditoria (AUD)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_civ', true)} 
              disabled={civEnabled}
            >
              Civil (CIV)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_pen', true)} 
              disabled={penEnabled}
            >
              Penal (PEN)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_inf', true)} 
              disabled={infEnabled}
            >
              Informática (INF)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_emp', true)} 
              disabled={empEnabled}
            >
              Empresarial (EMP)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => toggleSection('has_mtf', true)} 
              disabled={mtfEnabled}
            >
              Mat. Financeira (MTF)
            </DropdownMenuItem>
            
            {/* Seções de Discursiva e Estudos de Caso */}
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
            
            {/* Movido para o final - Outro conhecimento customizável */}
            <DropdownMenuItem 
              onClick={() => toggleSection('has_out', true)} 
              disabled={outEnabled}
            >
              Outro (OUT)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
      
      {/* Novos Conhecimentos */}
      {renderSectionCard(
        "Português (LPT)", 
        "has_lpt", 
        lptEnabled, 
        "lpt_questions", 
        "lpt_weight"
      )}
      
      {renderSectionCard(
        "Inglês (ING)", 
        "has_ing", 
        ingEnabled, 
        "ing_questions", 
        "ing_weight"
      )}
      
      {renderSectionCard(
        "Matemática (MAT)", 
        "has_mat", 
        matEnabled, 
        "mat_questions", 
        "mat_weight"
      )}
      
      {renderSectionCard(
        "RLM", 
        "has_rlm", 
        rlmEnabled, 
        "rlm_questions", 
        "rlm_weight"
      )}
      
      {renderSectionCard(
        "Estatística (EST)", 
        "has_est", 
        estEnabled, 
        "est_questions", 
        "est_weight"
      )}
      
      {renderSectionCard(
        "Constitucional (COS)", 
        "has_cos", 
        cosEnabled, 
        "cos_questions", 
        "cos_weight"
      )}
      
      {renderSectionCard(
        "Administrativo (ADM)", 
        "has_adm", 
        admEnabled, 
        "adm_questions", 
        "adm_weight"
      )}
      
      {renderSectionCard(
        "Administração (ADO)", 
        "has_ado", 
        adoEnabled, 
        "ado_questions", 
        "ado_weight"
      )}
      
      {renderSectionCard(
        "Contabilidade (COT)", 
        "has_cot", 
        cotEnabled, 
        "cot_questions", 
        "cot_weight"
      )}
      
      {renderSectionCard(
        "Contabilidade Custos (COC)", 
        "has_coc", 
        cocEnabled, 
        "coc_questions", 
        "coc_weight"
      )}
      
      {renderSectionCard(
        "Economia (ECO)", 
        "has_eco", 
        ecoEnabled, 
        "eco_questions", 
        "eco_weight"
      )}
      
      {renderSectionCard(
        "Tributário (TRI)", 
        "has_tri", 
        triEnabled, 
        "tri_questions", 
        "tri_weight"
      )}
      
      {renderSectionCard(
        "AFO", 
        "has_afo", 
        afoEnabled, 
        "afo_questions", 
        "afo_weight"
      )}
      
      {renderSectionCard(
        "Legislação Tributária (LTC)", 
        "has_ltc", 
        ltcEnabled, 
        "ltc_questions", 
        "ltc_weight"
      )}
      
      {renderSectionCard(
        "Tecnologia da Informação (TIC)", 
        "has_tic", 
        ticEnabled, 
        "tic_questions", 
        "tic_weight"
      )}
      
      {renderSectionCard(
        "Estatuto (ETT)", 
        "has_ett", 
        ettEnabled, 
        "ett_questions", 
        "ett_weight"
      )}
      
      {renderSectionCard(
        "Auditoria (AUD)", 
        "has_aud", 
        audEnabled, 
        "aud_questions", 
        "aud_weight"
      )}
      
      {renderSectionCard(
        "Civil (CIV)", 
        "has_civ", 
        civEnabled, 
        "civ_questions", 
        "civ_weight"
      )}
      
      {renderSectionCard(
        "Penal (PEN)", 
        "has_pen", 
        penEnabled, 
        "pen_questions", 
        "pen_weight"
      )}
      
      {renderSectionCard(
        "Informática (INF)", 
        "has_inf", 
        infEnabled, 
        "inf_questions", 
        "inf_weight"
      )}
      
      {renderSectionCard(
        "Empresarial (EMP)", 
        "has_emp", 
        empEnabled, 
        "emp_questions", 
        "emp_weight"
      )}
      
      {renderSectionCard(
        "Mat. Financeira (MTF)", 
        "has_mtf", 
        mtfEnabled, 
        "mtf_questions", 
        "mtf_weight"
      )}
      
      {renderSectionCard(
        "Outro (OUT)", 
        "has_out", 
        outEnabled, 
        "out_questions", 
        "out_weight"
      )}
      
      {/* Seções de Discursiva e Estudos de Caso */}
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
  );
};
