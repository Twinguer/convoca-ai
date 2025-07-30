import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useToast } from '@/hooks/use-toast';

export const QuestionTracker = () => {
  const { addQuestionResult } = useStudyStatistics();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddResult = async (isCorrect: boolean) => {
    setIsAdding(true);
    try {
      await addQuestionResult(isCorrect);
      toast({
        title: isCorrect ? "Acerto registrado!" : "Erro registrado!",
        description: `Questão ${isCorrect ? 'correta' : 'incorreta'} adicionada às estatísticas.`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a questão.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Registrar Questões
        </CardTitle>
        <CardDescription>
          Registre manualmente questões respondidas para acompanhar seu desempenho
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={() => handleAddResult(true)}
            disabled={isAdding}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Acertou
          </Button>
          <Button
            onClick={() => handleAddResult(false)}
            disabled={isAdding}
            variant="outline"
            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />
            Errou
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};