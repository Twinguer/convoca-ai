import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
interface MinimumScoreSectionProps {
  form: any;
}
export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({
  form
}) => {
  return <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4">
          
          
          
          
          
          <FormField control={form.control} name="has_minimum_score" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                <div className="space-y-0.5">
                  <FormLabel>Habilitar pontuação mínima para a prova</FormLabel>
                  
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />
          
          <FormField control={form.control} name="total_minimum_score" render={({
          field
        }) => <FormItem>
                
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} value={field.value || 0} onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              field.onChange(value);
              // Automaticamente habilitar minimum_score se o valor for maior que 0
              if (value > 0 && !form.getValues().has_minimum_score) {
                form.setValue('has_minimum_score', true);
              } else if (value === 0 && form.getValues().has_minimum_score) {
                form.setValue('has_minimum_score', false);
              }
            }} className="w-full md:w-1/3" disabled={!form.getValues().has_minimum_score} />
                </FormControl>
                
              </FormItem>} />
          
          
          
          
        </div>
      </CardContent>
    </Card>;
};