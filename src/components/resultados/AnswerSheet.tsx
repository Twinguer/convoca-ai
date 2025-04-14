
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, AlertTriangle, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { AnswerMatrix } from './AnswerMatrix';
import { SectionToggle } from './SectionToggle';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, BookText, GraduationCap } from 'lucide-react';

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
  // Get answer sheet state and functions
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
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType,
    getAnsweredQuestionsCount
  } = useAnswerSheet(concurso, rankingId);

  // State for discursive score if applicable
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);

  // Fetch existing discursive score if any
  const { data: existingRanking } = useQuery({
    queryKey: ['user-ranking-details', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('discursive_score, edit_count')
        .eq('id', rankingId)
        .single();
        
      if (error) throw error;
      
      if (data && data.discursive_score) {
        setDiscursiveScore(data.discursive_score);
      }
      
      return data;
    }
  });

  // Use save functionality
  const {
    handleSaveAnswers
  } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    questionType,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore
  });

  // Check if answers are still loading
  const {
    isLoading: isLoadingAnswers
  } = useQuery({
    queryKey: ['user-answers', rankingId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('user_answers').select('*').eq('user_ranking_id', rankingId);
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
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setDiscursiveScore(numValue);
    }
  };

  if (isLoadingAnswers) {
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
  const showValidationWarning = concurso.exam_type !== 'Certo ou Errado' && answeredQuestions < totalQuestions;

  return <Card className="shadow-lg">
      <CardHeader className="bg-emerald-50 border-b">
        <CardTitle className="text-xl md:text-2xl">Cartão de Respostas - {concurso.titulo}</CardTitle>
        <CardDescription>
          {existingRanking && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Edições restantes: </span>
              <span className={`${3 - (existingRanking.edit_count || 0) <= 1 ? 'text-red-600' : 'text-emerald-600'} font-bold`}>
                {Math.max(0, 3 - (existingRanking.edit_count || 0))}
              </span>
              <span> de 3</span>
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
        
        {showValidationWarning && (
          <div className="bg-amber-100 p-3 rounded-md flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <p>Atenção: Para provas de múltipla escolha, todas as questões precisam ser respondidas antes de salvar.</p>
          </div>
        )}
        
        <div className="border rounded-md overflow-hidden shadow-sm">
          <SectionToggle selectedSection={selectedSection} onSectionChange={setSelectedSection} concurso={concurso} />
          
          <AnswerMatrix matrix={createAnswerMatrix()} answers={answers} onAnswerChange={handleAnswerChange} getOptionsForQuestion={getOptionsForQuestion} />
        </div>
        
        {concurso.has_discursive && (
          <div className="border rounded-md overflow-hidden shadow-sm p-4">
            <h3 className="font-medium mb-2">Pontuação da Prova Discursiva / Estudo de Caso</h3>
            <div className="flex items-center gap-4">
              <div className="w-full max-w-xs">
                <Label htmlFor="discursive-score" className="text-sm text-gray-600 mb-1 block">
                  Insira sua pontuação na prova discursiva (opcional)
                </Label>
                <Input 
                  id="discursive-score"
                  type="number" 
                  min="0"
                  step="0.1"
                  value={discursiveScore === null ? '' : discursiveScore} 
                  onChange={handleDiscursiveScoreChange}
                  placeholder="Ex: 8.5"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 border-t">
        <Button onClick={handleSaveAnswers} className="flex items-center w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSaving} size="lg">
          {isSaving ? <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Salvando respostas...
            </> : <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Cartão de Respostas
            </>}
        </Button>
      </CardFooter>
    </Card>;
};
