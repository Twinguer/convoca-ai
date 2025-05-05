
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface MinimumScoreSectionProps {
  form: UseFormReturn<any>;
  sectionId: string;
  label: string;
}

export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({
  form,
  sectionId,
  label
}) => {
  const minimumScoreEnabled = form.watch('has_minimum_score');
  const minimumScoreType = form.watch('minimum_score_type') || 'knowledge';
  const minimumScoreUnitType = form.watch('minimum_score_unit_type') || 'percentage';
  
  return (
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
      
      {minimumScoreEnabled && (
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
          
          {/* Total minimum score */}
          <FormField
            control={form.control}
            name="total_minimum_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nota mínima total {minimumScoreUnitType === 'percentage' ? '(%)' : '(pontos)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    max={minimumScoreUnitType === 'percentage' ? 100 : undefined}
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
          
          {/* Section-specific minimum scores (only shown when minimum_score_type === 'knowledge') */}
          {minimumScoreType === 'knowledge' && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <h4 className="font-medium">Notas mínimas por seção</h4>
              
              {sectionId === 'basic_knowledge' && form.watch('has_basic_knowledge') && (
                <MinimumScoreInput 
                  form={form}
                  name="basic_knowledge_minimum_score"
                  label="Conhecimentos Básicos"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'specific_knowledge_1' && form.watch('has_specific_knowledge_1') && (
                <MinimumScoreInput 
                  form={form}
                  name="specific_knowledge_1_minimum_score"
                  label="Conhecimentos Específicos 1"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'specific_knowledge_2' && form.watch('has_specific_knowledge_2') && (
                <MinimumScoreInput 
                  form={form}
                  name="specific_knowledge_2_minimum_score"
                  label="Conhecimentos Específicos 2"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'specific_knowledge_3' && form.watch('has_specific_knowledge_3') && (
                <MinimumScoreInput 
                  form={form}
                  name="specific_knowledge_3_minimum_score"
                  label="Conhecimentos Específicos 3"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'discursive' && form.watch('has_discursive') && (
                <MinimumScoreInput 
                  form={form}
                  name="discursive_minimum_score"
                  label="Dissertativa"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'case_study_1' && form.watch('has_case_study_1') && (
                <MinimumScoreInput 
                  form={form}
                  name="case_study_1_minimum_score"
                  label="Estudo de Caso 1"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'case_study_2' && form.watch('has_case_study_2') && (
                <MinimumScoreInput 
                  form={form}
                  name="case_study_2_minimum_score"
                  label="Estudo de Caso 2"
                  unitType={minimumScoreUnitType}
                />
              )}
              
              {sectionId === 'case_study_3' && form.watch('has_case_study_3') && (
                <MinimumScoreInput 
                  form={form}
                  name="case_study_3_minimum_score"
                  label="Estudo de Caso 3"
                  unitType={minimumScoreUnitType}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface MinimumScoreInputProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  unitType: string;
}

const MinimumScoreInput: React.FC<MinimumScoreInputProps> = ({
  form,
  name,
  label,
  unitType
}) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {unitType === 'percentage' ? '(%)' : '(pontos)'}
          </FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min={0} 
              max={unitType === 'percentage' ? 100 : undefined}
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
