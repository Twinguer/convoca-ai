
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface MinimumScoreSectionProps {
  form: UseFormReturn<any>;
  sectionId: string;
  label: string;
}

export const MinimumScoreSection: React.FC<MinimumScoreSectionProps> = ({
  form,
  sectionId,
  label
}) => {
  const minimumScoreEnabled = form.watch('has_minimum_score');
  const minimumScoreType = form.watch('minimum_score_type') || 'knowledge';
  const minimumScoreUnitType = form.watch('minimum_score_unit_type') || 'percentage';
  
  return (
    <div className="space-y-4">
      {/* Section-specific minimum scores (only shown when minimum_score_type === 'knowledge') */}
      {minimumScoreEnabled && minimumScoreType === 'knowledge' && sectionId !== 'global' && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name={`${sectionId}_minimum_score`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {label} {minimumScoreUnitType === 'percentage' ? '(%)' : '(pontos)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    max={minimumScoreUnitType === 'percentage' ? 100 : undefined}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Nota mínima necessária para essa seção
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};
