
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UseFormReturn } from 'react-hook-form';

interface MinimumScoreSectionProps {
  form: UseFormReturn<any>;
}

export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({ form }) => {
  // Check if minimum score is enabled
  const hasMinimumScore = form.watch('has_minimum_score');
  const minimumScoreType = form.watch('minimum_score_type');
  const minimumScoreUnitType = form.watch('minimum_score_unit_type');
  
  const hasBasicKnowledge = form.watch('has_basic_knowledge');
  const hasSpecificKnowledge1 = form.watch('has_specific_knowledge_1');
  const hasSpecificKnowledge2 = form.watch('has_specific_knowledge_2');
  const hasSpecificKnowledge3 = form.watch('has_specific_knowledge_3');
  const hasDiscursive = form.watch('has_discursive');
  const hasCaseStudy1 = form.watch('has_case_study_1');
  const hasCaseStudy2 = form.watch('has_case_study_2');
  const hasCaseStudy3 = form.watch('has_case_study_3');
  
  // Helper function for score input fields
  const renderScoreField = (name: string, label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={minimumScoreUnitType === 'percentage' ? 100 : undefined}
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="w-full"
            />
          </FormControl>
          <FormDescription>
            {minimumScoreUnitType === 'percentage' ? 'Percentual (%)' : 'Pontuação absoluta'}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div>
        <h3 className="text-lg font-medium mb-2">Nota de corte</h3>
        <FormField
          control={form.control}
          name="has_minimum_score"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Aplicar nota de corte</FormLabel>
                <FormDescription>
                  Ative para definir pontuações mínimas para classificação
                </FormDescription>
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
        <Card className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Tipo de nota de corte */}
            <div>
              <FormLabel>Tipo de nota de corte</FormLabel>
              <FormField
                control={form.control}
                name="minimum_score_type"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="knowledge" id="knowledge" />
                      <Label htmlFor="knowledge">Por conhecimento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="subject" id="subject" />
                      <Label htmlFor="subject">Por assunto</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            {/* Unidade de medida */}
            <div>
              <FormLabel>Unidade de medida</FormLabel>
              <FormField
                control={form.control}
                name="minimum_score_unit_type"
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentual (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="absolute" id="absolute" />
                      <Label htmlFor="absolute">Pontos absolutos</Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="font-medium mb-4">Configurar pontuações mínimas</h4>
              
              {/* Se for por assunto, mostra apenas pontuação total */}
              {minimumScoreType === 'subject' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderScoreField('total_minimum_score', 'Pontuação total mínima')}
                </div>
              )}
              
              {/* Se for por conhecimento, mostra campos para cada seção da prova */}
              {minimumScoreType === 'knowledge' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasBasicKnowledge && (
                    renderScoreField('basic_knowledge_minimum_score', 'Conhecimentos Básicos')
                  )}
                  {hasSpecificKnowledge1 && (
                    renderScoreField('specific_knowledge_1_minimum_score', 'Conhecimentos Específicos 1')
                  )}
                  {hasSpecificKnowledge2 && (
                    renderScoreField('specific_knowledge_2_minimum_score', 'Conhecimentos Específicos 2')
                  )}
                  {hasSpecificKnowledge3 && (
                    renderScoreField('specific_knowledge_3_minimum_score', 'Conhecimentos Específicos 3')
                  )}
                  {hasDiscursive && (
                    renderScoreField('discursive_minimum_score', 'Discursiva')
                  )}
                  {hasCaseStudy1 && (
                    renderScoreField('case_study_1_minimum_score', 'Estudo de Caso 1')
                  )}
                  {hasCaseStudy2 && (
                    renderScoreField('case_study_2_minimum_score', 'Estudo de Caso 2')
                  )}
                  {hasCaseStudy3 && (
                    renderScoreField('case_study_3_minimum_score', 'Estudo de Caso 3')
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
