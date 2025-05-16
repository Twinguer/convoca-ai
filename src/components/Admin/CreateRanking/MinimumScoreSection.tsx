
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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
            Configure a pontuação mínima geral da prova. Os candidatos que não atingirem este valor serão destacados em vermelho.
          </p>
          
          <Alert className="mb-4">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription className="text-sm">
              Este valor representa o mínimo absoluto que deve ser atingido na pontuação total da prova objetiva.
            </AlertDescription>
          </Alert>
          
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
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    className="w-full md:w-1/3"
                  />
                </FormControl>
                <FormDescription>
                  O candidato será destacado em vermelho caso sua pontuação total seja menor que este valor.
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
