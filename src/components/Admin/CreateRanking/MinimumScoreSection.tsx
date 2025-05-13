
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface MinimumScoreSectionProps {
  form: UseFormReturn<any>;
}

export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({ form }) => {
  const watchHasMinimumScore = form.watch('has_minimum_score');
  const watchMinimumScoreType = form.watch('minimum_score_type');
  const watchMinimumScoreUnitType = form.watch('minimum_score_unit_type');
  const watchHasQuotaMinimumScore = form.watch('has_quota_minimum_score');
  const watchHasCustomKnowledge = form.watch('has_custom_knowledge');
  const watchDisciplines = form.watch('disciplines') || [];

  // Determinar se o tipo de mínimo selecionado permite configuração por conhecimento/disciplina
  const showCustomMinimums = watchHasMinimumScore && 
    (watchMinimumScoreType === 'knowledge' || watchMinimumScoreType === 'both');

  // Verificar se há disciplinas habilitadas no modo customizado
  const hasEnabledDisciplines = Array.isArray(watchDisciplines) && 
    watchDisciplines.some((d: any) => d.isEnabled === true);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-medium">Pontuações Mínimas</CardTitle>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        {/* Toggle para ativar pontuações mínimas */}
        <FormField
          control={form.control}
          name="has_minimum_score"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Usar pontuações mínimas
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Desclassifica candidatos que não atingirem o mínimo necessário
                </div>
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

        {watchHasMinimumScore && (
          <div className="space-y-4 pl-3 border-l-2 border-gray-100">
            {/* Tipo de Pontuação Mínima */}
            <FormField
              control={form.control}
              name="minimum_score_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de pontuação mínima</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || 'knowledge'}
                    value={field.value || 'knowledge'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="knowledge">Por disciplina</SelectItem>
                      <SelectItem value="total">Por total da prova</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Unidade de pontuação mínima */}
            <FormField
              control={form.control}
              name="minimum_score_unit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de pontuação mínima</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || 'percentage'}
                    value={field.value || 'percentage'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="absolute">Valor absoluto</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Pontuação mínima para ampla concorrência */}
            {(watchMinimumScoreType === 'total' || watchMinimumScoreType === 'both') && (
              <FormField
                control={form.control}
                name="total_minimum_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Pontuação mínima para ampla concorrência
                      {watchMinimumScoreUnitType === 'percentage' ? ' (%)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max={watchMinimumScoreUnitType === 'percentage' ? '100' : undefined}
                        step="0.1"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Pontuações mínimas por disciplina - Modo disciplinas customizadas */}
            {showCustomMinimums && watchHasCustomKnowledge && hasEnabledDisciplines && (
              <div className="space-y-4">
                <Separator />
                <div className="text-sm font-medium">Pontuações mínimas por disciplina</div>
                
                {watchDisciplines.map((discipline: any, index: number) => 
                  discipline.isEnabled ? (
                    <div key={`discipline-min-${index}`} className="grid grid-cols-2 gap-2">
                      <Label className="self-center">{discipline.name}</Label>
                      <FormField
                        control={form.control}
                        name={`disciplines.${index}.minimumScore`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                max={watchMinimumScoreUnitType === 'percentage' ? '100' : undefined}
                                step="0.1"
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                placeholder={watchMinimumScoreUnitType === 'percentage' ? '% mínima' : 'Valor mínimo'}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* Pontuações mínimas diferentes para cotas */}
            <Separator className="my-4" />

            <FormField
              control={form.control}
              name="has_quota_minimum_score"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Usar pontuação mínima diferenciada para cotas
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Candidatos de cotas terão pontuação mínima diferente
                    </div>
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

            {watchHasQuotaMinimumScore && (
              <FormField
                control={form.control}
                name="quota_minimum_score"
                render={({ field }) => (
                  <FormItem className="pl-3 border-l-2 border-gray-100">
                    <FormLabel>
                      Pontuação mínima para cotas 
                      {watchMinimumScoreUnitType === 'percentage' ? ' (%)' : ''}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max={watchMinimumScoreUnitType === 'percentage' ? '100' : undefined}
                        step="0.1"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
