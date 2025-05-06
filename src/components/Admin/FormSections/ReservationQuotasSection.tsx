
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReservationQuotasSectionProps {
  form: UseFormReturn<any>;
}

export const ReservationQuotasSection: React.FC<ReservationQuotasSectionProps> = ({
  form
}) => {
  const quotaMinimumScoreType = form.watch('quota_minimum_score_unit_type') || 'percentage';
  
  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Reserva de Vagas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <FormField
          control={form.control}
          name="has_quota_minimum_score"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Nota Mínima para Cotistas
                </FormLabel>
                <FormDescription className="text-xs">
                  Ative para definir nota mínima específica para cotistas
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {form.watch('has_quota_minimum_score') && (
          <>
            <FormField
              control={form.control}
              name="quota_minimum_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Mínima para Cotistas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={quotaMinimumScoreType === 'percentage' ? "0.1" : "0.01"}
                      placeholder={quotaMinimumScoreType === 'percentage' ? "Ex: 40 para 40%" : "Ex: 5 pontos"}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {quotaMinimumScoreType === 'percentage' 
                      ? 'Valor em porcentagem (0-100)' 
                      : 'Valor absoluto em pontos'}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quota_minimum_score_unit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Valor</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="points">Pontos (valor absoluto)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Escolha se a nota mínima é um percentual ou valor absoluto
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField 
          control={form.control} 
          name="has_ampla_concorrencia" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  disabled={true} // Ampla is always enabled
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Ampla Concorrência
                </FormLabel>
                <FormDescription className="text-xs">
                  Lista principal de classificação
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="has_ppp" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  PPP
                </FormLabel>
                <FormDescription className="text-xs">
                  Pessoas Pretas e Pardas
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="has_pcd" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  PCD
                </FormLabel>
                <FormDescription className="text-xs">
                  Pessoas com Deficiência
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="has_hipossuficientes" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Hipossuficientes
                </FormLabel>
                <FormDescription className="text-xs">
                  Pessoas de baixa renda
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="has_indigenas" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Indígenas
                </FormLabel>
                <FormDescription className="text-xs">
                  Povos originários
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="has_transsexuais" 
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Pessoas Trans
                </FormLabel>
                <FormDescription className="text-xs">
                  Transexuais e transgêneros
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
