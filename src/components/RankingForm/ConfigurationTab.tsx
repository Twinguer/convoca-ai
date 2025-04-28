
import React from 'react';
import { QuestionBlocksForm } from '@/components/resultados/QuestionBlocksForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';

interface ConfigurationTabProps {
  concursoId: string;
  onSave?: () => void;
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = ({ concursoId, onSave }) => {
  const [hasTrueFalse, setHasTrueFalse] = React.useState(false);
  const { register } = useForm();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Pontuação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Switch
              id="true-false"
              checked={hasTrueFalse}
              onCheckedChange={setHasTrueFalse}
            />
            <Label htmlFor="true-false">Incluir questões Certo/Errado</Label>
          </div>
          
          {hasTrueFalse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pontos por Acerto (C/E)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 2.5"
                  {...register('pointsIfCorrect')}
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto por Erro (C/E)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: -1.0"
                  {...register('pointsIfWrong')}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <QuestionBlocksForm concursoId={concursoId} onSave={onSave} />
    </div>
  );
};
