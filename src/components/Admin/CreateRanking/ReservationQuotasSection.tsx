
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Percent, CircleDollarSign } from 'lucide-react';

interface ReservationQuotasSectionProps {
  form: any;
}

export const ReservationQuotasSection: React.FC<ReservationQuotasSectionProps> = ({ form }) => {
  const quotaMinimumScoreType = form.watch('quota_minimum_score_unit_type') || 'percentage';
  
  const toggleScoreType = () => {
    const currentType = form.getValues('quota_minimum_score_unit_type');
    const newType = currentType === 'percentage' ? 'points' : 'percentage';
    form.setValue('quota_minimum_score_unit_type', newType);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Cotas de Reserva</h3>
        
        <div className="mb-6">
          <FormField
            control={form.control}
            name="has_quota_minimum_score"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
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
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <FormField
                    control={form.control}
                    name="quota_minimum_score"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Nota Mínima {quotaMinimumScoreType === 'percentage' ? '(%)' : '(Pontos)'}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step={quotaMinimumScoreType === 'percentage' ? "0.1" : "0.01"}
                            placeholder={quotaMinimumScoreType === 'percentage' ? "Ex: 40" : "Ex: 5"}
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            className="w-full"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-1 mt-7">
                    <Button 
                      type="button"
                      variant={quotaMinimumScoreType === 'percentage' ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleScoreType}
                      className="px-3"
                    >
                      <Percent size={16} />
                    </Button>
                    <Button 
                      type="button"
                      variant={quotaMinimumScoreType === 'points' ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleScoreType}
                      className="px-3"
                    >
                      <CircleDollarSign size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="has_ampla_concorrencia"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Ampla Concorrência</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_ppp"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">PPP (Pessoas Pretas e Pardas)</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_pcd"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">PCD (Pessoas com Deficiência)</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_hipossuficientes"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Hipossuficientes</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_indigenas"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Indígenas</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_transsexuais"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Pessoas Trans</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
