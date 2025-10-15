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
          
          <FormField control={form.control} name="has_minimum_score" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                <div className="space-y-0.5">
                  <FormLabel>Habilitar pontuação mínima</FormLabel>
                  <FormDescription className="text-xs">
                    Ative para definir uma pontuação mínima necessária na prova
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />
          
          {form.watch('has_minimum_score') && (
            <>
              <FormField control={form.control} name="total_minimum_score" render={({
              field
            }) => <FormItem>
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
                    <FormDescription className="text-xs">
                      Insira o valor mínimo de pontos que o candidato precisa obter (máx. 999)
                    </FormDescription>
                  </FormItem>} />
              
              <Separator className="my-4" />
            </>
          )}
          
          {/* Seção de Pontuação Mínima para Cotas */}
          <div className="mb-4">
            <h4 className="text-md font-semibold mb-3">Pontuação Mínima para Cotas</h4>
            
            <FormField control={form.control} name="has_quota_minimum_score" render={({
              field
            }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                    <div className="space-y-0.5">
                      <FormLabel>Habilitar pontuação mínima para cotas</FormLabel>
                      <FormDescription className="text-xs">
                        Ative para definir uma pontuação mínima específica para candidatos de cotas (PCD, PPI, etc.)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>} />
            
            {form.watch('has_quota_minimum_score') && (
              <>
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
                      <FormDescription className="text-xs">
                        Insira o valor mínimo de pontos que candidatos de cotas precisam obter (máx. 999)
                      </FormDescription>
                    </FormItem>} />
                
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Importante:</strong> Esta pontuação será aplicada apenas para candidatos que não concorrem por Ampla Concorrência. 
                    Se não habilitada, será usada a pontuação mínima geral da prova.
                  </AlertDescription>
                </Alert>
                
                <Separator className="my-4" />
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>;
};