
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
          <h3 className="text-lg font-semibold">Pontuação Mínima da Prova</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure a pontuação mínima geral da prova. Os candidatos que não atingirem este valor serão destacados em vermelho e considerados eliminados.
          </p>
          
          <Alert className="mb-4">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription className="text-sm">
              Este valor representa o mínimo absoluto que deve ser atingido na pontuação total da prova objetiva.
              Candidatos abaixo deste valor serão marcados como eliminados na tabela de classificação.
            </AlertDescription>
          </Alert>
          
          <FormField
            control={form.control}
            name="has_minimum_score"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mb-4">
                <div className="space-y-0.5">
                  <FormLabel>Habilitar pontuação mínima</FormLabel>
                  <FormDescription>
                    Aplicar regra de pontuação mínima para classificação
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
          
          <FormField
            control={form.control}
            name="total_minimum_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontuação mínima geral da prova (valor absoluto)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value || 0}
                    onChange={e => {
                      const value = parseFloat(e.target.value) || 0;
                      field.onChange(value);
                      // Automaticamente habilitar minimum_score se o valor for maior que 0
                      if (value > 0 && !form.getValues().has_minimum_score) {
                        form.setValue('has_minimum_score', true);
                      } else if (value === 0 && form.getValues().has_minimum_score) {
                        form.setValue('has_minimum_score', false);
                      }
                    }}
                    className="w-full md:w-1/3"
                    disabled={!form.getValues().has_minimum_score}
                  />
                </FormControl>
                <FormDescription>
                  O candidato será destacado em vermelho e considerado eliminado caso sua pontuação total seja menor que este valor.
                </FormDescription>
              </FormItem>
            )}
          />
          
          <Separator className="my-4" />
          
          <p className="text-sm text-muted-foreground mb-4">
            As pontuações mínimas por bloco e por disciplina podem ser configuradas diretamente na seção de estrutura da prova abaixo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
