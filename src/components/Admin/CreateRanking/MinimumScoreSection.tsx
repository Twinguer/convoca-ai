
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface MinimumScoreSectionProps {
  form: any;
}

export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({ form }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">Pontuação Mínima</h3>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="total_minimum_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mínimo geral da prova (valor absoluto)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value || 0}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
