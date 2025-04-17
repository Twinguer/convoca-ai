
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Control } from 'react-hook-form';
import { AnswerKeyForm } from '@/components/Admin/AnswerKeyForm';

interface AnswerKeySectionProps {
  form: {
    control: Control<any>;
  };
  concursoId?: string;
}

export const AnswerKeySection: React.FC<AnswerKeySectionProps> = ({ 
  form,
  concursoId
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Gabarito Oficial</h3>
            
            {concursoId ? (
              <AnswerKeyForm concursoId={concursoId} />
            ) : (
              <p className="text-sm text-gray-500">
                Você poderá adicionar o gabarito oficial após criar o ranking.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
