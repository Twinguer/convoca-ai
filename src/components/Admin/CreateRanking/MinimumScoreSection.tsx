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
export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({ form }) => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">Pontuações Mínimas Globais da Prova</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure as pontuações mínimas globais para toda a prova objetiva. Estes valores são salvos em concursos.disciplines (JSONB).
          </p>
          
          <FormField
            control={form.control}
            name="minimumTotalScore"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Pontuação mínima total (Ampla Concorrência)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="999"
                    {...field} 
                    value={field.value || 0} 
                    onChange={e => {
                      const value = e.target.value;
                      if (!isNaN(parseFloat(value)) && parseFloat(value) <= 999) {
                        field.onChange(parseFloat(value) || 0);
                      }
                    }} 
                    className="w-full md:w-1/3" 
                  />
                </FormControl>
                <FormDescription>
                  Salvo em disciplines.minimum_total_score
                </FormDescription>
              </FormItem>
            )}
          />
          
          <Separator className="my-4" />
          
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-3">Pontuação Mínima para Cotas</h4>
            
            <FormField
              control={form.control}
              name="minimumTotalScoreCotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pontuação mínima para cotas</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="999"
                      {...field} 
                      value={field.value || 0} 
                      onChange={e => {
                        const value = e.target.value;
                        if (!isNaN(parseFloat(value)) && parseFloat(value) <= 999) {
                          field.onChange(parseFloat(value) || 0);
                        }
                      }} 
                      className="w-full md:w-1/3" 
                    />
                  </FormControl>
                  <FormDescription>
                    Salvo em disciplines.minimum_total_score_cotas
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};