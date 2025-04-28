
import React from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { QuestionBlock } from '@/types/question-blocks';
import { createQuestionBlocks, updateQuestionBlocks } from '@/services/questionBlockService';

interface QuestionBlocksFormProps {
  concursoId: string;
  existingBlocks?: QuestionBlock[];
  onSave?: () => void;
}

export const QuestionBlocksForm: React.FC<QuestionBlocksFormProps> = ({
  concursoId,
  existingBlocks = [],
  onSave
}) => {
  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      blocks: existingBlocks.length > 0 ? existingBlocks : [
        { name: '', startIndex: 1, endIndex: 10, weight: 1 }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'blocks'
  });

  const onSubmit = async (data: { blocks: QuestionBlock[] }) => {
    try {
      const result = existingBlocks.length > 0 
        ? await updateQuestionBlocks(concursoId, data.blocks)
        : await createQuestionBlocks(concursoId, data.blocks);

      if (result.success) {
        toast.success('Blocos de questões salvos com sucesso!');
        onSave?.();
      } else {
        toast.error(result.error || 'Erro ao salvar blocos');
      }
    } catch (error) {
      toast.error('Erro ao salvar blocos de questões');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocos de Questões</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Bloco {index + 1}</Label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`blocks.${index}.name`}>Nome do Bloco</Label>
                  <Input
                    {...register(`blocks.${index}.name`)}
                    placeholder="Ex: Conhecimentos Básicos"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`blocks.${index}.weight`}>Peso do Bloco</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register(`blocks.${index}.weight`, { valueAsNumber: true })}
                    placeholder="Ex: 1.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`blocks.${index}.startIndex`}>Questão Inicial</Label>
                  <Input
                    type="number"
                    {...register(`blocks.${index}.startIndex`, { valueAsNumber: true })}
                    placeholder="Ex: 1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`blocks.${index}.endIndex`}>Questão Final</Label>
                  <Input
                    type="number"
                    {...register(`blocks.${index}.endIndex`, { valueAsNumber: true })}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: '', startIndex: 1, endIndex: 10, weight: 1 })}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Bloco
            </Button>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Blocos'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
