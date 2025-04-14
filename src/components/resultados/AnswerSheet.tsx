import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertTriangle, Check, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { AnswerMatrix } from './AnswerMatrix';
import { SectionToggle } from './SectionToggle';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnswerSheetProps {
  concurso: Concurso;
  rankingId: string;
  onSuccess: () => void;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({
  concurso,
  rankingId,
  onSuccess
}) => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const { toast } = useToast();
  
  const {
    answers,
    selectedSection,
    setSelectedSection,
    isSaving,
    setIsSaving,
    error,
    setError,
    savedSuccess,
    setSavedSuccess,
    handleAnswerChange,
    handleClearAnswer,
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType,
    getAnsweredQuestionsCount
  } = useAnswerSheet(concurso, rankingId);

  const { data: userRankingData, isLoading: isLoadingRanking } = useQuery({
    queryKey: ['user-ranking-detail', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('id', rankingId)
        .single();
      
      if (error) throw error;
      return data || {};
    }
  });

  useEffect(() => {
    if (userRankingData?.discursive_score !== undefined && userRankingData?.discursive_score !== null) {
      setDiscursiveScore(userRankingData.discursive_score);
    }
  }, [userRankingData]);

  const { handleSaveAnswers } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    questionType,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore,
    editCount: userRankingData?.edit_count || 0
  });

  const { isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['user-answers', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', rankingId);
      if (error) throw error;
      return data || [];
    }
  });

  const handleDiscursiveScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setDiscursiveScore(null);
      return;
    }
    
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return;
    
    if (numberValue < 0 || numberValue > 100) {
      toast({
        title: "Valor inválido",
        description: "A nota da discursiva deve estar entre 0 e 100.",
        variant: "destructive"
      });
      return;
    }
    
    setDiscursiveScore(numberValue);
  };

  if (isLoadingAnswers || isLoadingRanking) {
    return <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-center text-gray-600">Carregando cartão de respostas...</p>
        </CardContent>
      </Card>;
  }

  const totalQuestions = getTotalQuestions();
  const answeredQuestions = getAnsweredQuestionsCount();
  const progressPercentage = totalQuestions ? answeredQuestions / totalQuestions * 100 : 0;
  const editsLeft = 3 - (userRankingData?.edit_count || 0);
  const canEdit = editsLeft > 0;

  return <Card className="shadow-lg">
      <CardHeader className="bg-emerald-50 border-b">
        <CardTitle className="text-xl md:text-2xl">Cartão de Respostas - {concurso.titulo}</CardTitle>
        <CardDescription>
          {userRankingData?.edit_count !== undefined && userRankingData?.edit_count > 0 && (
            <div className="text-sm font-medium text-emerald-700 mt-2">
              Edições disponíveis: {editsLeft} de 3
              {!canEdit && (
                <span className="text-destructive ml-2">
                  (Você atingiu o limite de edições permitidas)
                </span>
              )}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {error && <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>}
        
        {savedSuccess && <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Respostas salvas com sucesso! Calculando pontuação...</p>
          </div>}
        
        <AnswerSheetHeader concurso={concurso} getTotalQuestions={getTotalQuestions} />
        
        {concurso.exam_type === 'Alternativas' && (
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Importante:</strong> Neste tipo de prova, você deve responder a todas as questões antes de salvar o cartão.
            </p>
          </div>
        )}
        
        {concurso.exam_type === 'Certo ou Errado' && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200 flex items-start gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p><strong>Dica:</strong> Neste tipo de prova:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Você pode deixar questões em branco (não marca nem perde pontos)</li>
                <li>Acertos somam pontos</li>
                {concurso.wrong_answer_penalty > 0 && (
                  <li>Erros subtraem {concurso.wrong_answer_penalty} ponto(s)</li>
                )}
                <li>Para remover uma resposta, clique no botão "Limpar"</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="font-medium">Progresso: {answeredQuestions} de {totalQuestions} questões</div>
          <div className="text-sm text-gray-500">{Math.round(progressPercentage)}% completo</div>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200" />
        
        <div className="border rounded-md overflow-hidden shadow-sm">
          <SectionToggle selectedSection={selectedSection} onSectionChange={setSelectedSection} concurso={concurso} />
          
          <AnswerMatrix 
            matrix={createAnswerMatrix()} 
            answers={answers} 
            onAnswerChange={handleAnswerChange}
            onClearAnswer={handleClearAnswer} 
            getOptionsForQuestion={getOptionsForQuestion}
            disabled={!canEdit && userRankingData?.edit_count !== undefined}
            examType={concurso.exam_type as 'Alternativas' | 'Certo ou Errado'} 
          />
        </div>
        
        {concurso.has_discursive && (
          <div className="border p-4 rounded-md shadow-sm space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <Label htmlFor="discursive-score" className="text-base font-medium">
                Nota da Prova Discursiva / Estudo de Caso
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Informe sua nota na prova discursiva (0-100). Este campo é opcional.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center">
              <Input 
                id="discursive-score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Informe sua nota (opcional)"
                value={discursiveScore === null ? '' : discursiveScore}
                onChange={handleDiscursiveScoreChange}
                className="w-64"
                disabled={!canEdit && userRankingData?.edit_count !== undefined}
              />
              <span className="ml-2 text-gray-500">/ 100</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 border-t">
        <Button 
          onClick={handleSaveAnswers} 
          className="flex items-center w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
          disabled={isSaving || (!canEdit && userRankingData?.edit_count !== undefined)} 
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvando respostas...
            </>
          ) : !canEdit && userRankingData?.edit_count !== undefined ? (
            <>
              <AlertTriangle className="h-5 w-5 mr-2" />
              Limite de edições atingido
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Cartão de Respostas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>;
};
