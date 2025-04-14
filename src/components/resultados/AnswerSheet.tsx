import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    onSuccess
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
  if (isLoadingAnswers) {
    return <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-center text-gray-600">Carregando cartão de respostas...</p>
        </CardContent>
      </Card>;
  }
  const totalQuestions = getTotalQuestions();
  const answeredQuestions = getAnsweredQuestionsCount();
  const progressPercentage = totalQuestions ? answeredQuestions / totalQuestions * 100 : 0;
  return <Card className="shadow-lg">
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="text-xl md:text-2xl">Cartão de Respostas - {concurso.titulo}</CardTitle>
        
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
        
        <div className="border rounded-md overflow-hidden shadow-sm">
          
          
          <SectionToggle selectedSection={selectedSection} onSectionChange={setSelectedSection} concurso={concurso} />
          
          <AnswerMatrix matrix={createAnswerMatrix()} answers={answers} onAnswerChange={handleAnswerChange} getOptionsForQuestion={getOptionsForQuestion} />
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50 border-t">
        <Button onClick={handleSaveAnswers} className="flex items-center w-full bg-green-600 hover:bg-green-700 text-white" disabled={isSaving} size="lg">
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