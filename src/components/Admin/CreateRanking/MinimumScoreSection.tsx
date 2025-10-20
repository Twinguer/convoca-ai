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
          <h3 className="text-lg font-semibold mb-4">Pontuação Mínima da Prova</h3>
          
          <FormField control={form.control} name="total_minimum_score" render={({
            field
          }) => <FormItem className="mb-4">
                  <FormLabel>Pontuação mínima geral da prova objetiva (valor absoluto)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="999"
                      maxLength={3}
                      {...field} 
                      value={field.value || 0} 
                      onChange={e => {
                        const value = e.target.value;
                        if (value.length <= 3 && !isNaN(parseFloat(value)) && parseFloat(value) <= 999) {
                          field.onChange(parseFloat(value) || 0);
                        }
                      }} 
                      className="w-full md:w-1/3" 
                    />
                  </FormControl>
                </FormItem>} />
          
          <Separator className="my-4" />
          
          {/* Seção de Pontuação Mínima para Cotas */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-3">Pontuação Mínima para Cotas</h4>
            
            <FormField control={form.control} name="quota_minimum_score" render={({
              field
            }) => <FormItem>
                    <FormLabel>Pontuação mínima para cotas (valor absoluto)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="999"
                        maxLength={3}
                        {...field} 
                        value={field.value || 0} 
                        onChange={e => {
                          const value = e.target.value;
                          if (value.length <= 3 && !isNaN(parseFloat(value)) && parseFloat(value) <= 999) {
                            field.onChange(parseFloat(value) || 0);
                          }
                        }} 
                        className="w-full md:w-1/3" 
                      />
                    </FormControl>
                  </FormItem>} />
          </div>
        </div>
      </CardContent>
    </Card>;
};