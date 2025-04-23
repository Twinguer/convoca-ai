
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

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
    getAnsweredQuestionsCount,
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score
  } = useAnswerSheet(concurso, rankingId);
  
  const {
    data: userRankingData,
    isLoading: isLoadingRanking
  } = useQuery({
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
  
  // Fetch user answers
  const {
    isLoading: isLoadingAnswers
  } = useQuery({
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
  
  useEffect(() => {
    if (userRankingData?.discursive_score !== undefined && userRankingData?.discursive_score !== null) {
      setDiscursiveScore(userRankingData.discursive_score);
    }
    if (userRankingData?.case_study_1_score !== undefined && userRankingData?.case_study_1_score !== null) {
      setCaseStudy1Score(userRankingData.case_study_1_score);
    }
    if (userRankingData?.case_study_2_score !== undefined && userRankingData?.case_study_2_score !== null) {
      setCaseStudy2Score(userRankingData.case_study_2_score);
    }
    if (userRankingData?.case_study_3_score !== undefined && userRankingData?.case_study_3_score !== null) {
      setCaseStudy3Score(userRankingData.case_study_3_score);
    }
  }, [userRankingData]);

  const {
    handleSaveAnswers
  } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    questionType: concurso.exam_type as 'Alternativas' | 'Certo ou Errado',
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore,
    caseStudy1Score,
    caseStudy2Score,
    caseStudy3Score,
    editCount: userRankingData?.edit_count || 0
  });
  
  const handleScoreChange = (
    value: string, 
    setter: React.Dispatch<React.SetStateAction<number | null>>,
    scoreName: string
  ) => {
    if (value === '') {
      setter(null);
      return;
    }
    
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return;
    
    if (numberValue < 0 || numberValue > 100) {
      toast({
        title: "Valor inválido",
        description: `A nota da ${scoreName} deve estar entre 0 e 100.`,
        variant: "destructive"
      });
      return;
    }
    
    setter(numberValue);
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

  // Get only the objective sections for tabs (basic and specific knowledge)
  const getObjectiveSectionList = () => {
    const sections = [];
    if (concurso.has_basic_knowledge) sections.push({ key: 'basic', label: 'Conhecimentos Básicos' });
    if (concurso.has_specific_knowledge_1) sections.push({ key: 'specific1', label: 'C. Específicos 1' });
    if (concurso.has_specific_knowledge_2) sections.push({ key: 'specific2', label: 'C. Específicos 2' });
    if (concurso.has_specific_knowledge_3) sections.push({ key: 'specific3', label: 'C. Específicos 3' });
    return sections;
  };
  
  // Render discursive/case study score inputs
  const renderDiscursiveScores = () => {
    return (
      <div className="space-y-4 p-6 bg-gray-50 border rounded-md mt-6">
        <h3 className="text-lg font-medium mb-4">Notas Subjetivas</h3>
        
        {concurso.has_discursive && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="discursive-score" className="font-medium">
              Nota da Prova Discursiva:
            </Label>
            <div className="flex items-center">
              <Input
                id="discursive-score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Informe sua nota (0-100)"
                value={discursiveScore === null ? '' : discursiveScore}
                onChange={(e) => handleScoreChange(e.target.value, setDiscursiveScore, 'discursiva')}
                className="w-32"
                disabled={!canEdit}
              />
              <span className="ml-2 text-gray-500">/ 100</span>
            </div>
          </div>
        )}
        
        {concurso.has_case_study_1 && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-study-1-score" className="font-medium">
              Nota do Estudo de Caso 1:
            </Label>
            <div className="flex items-center">
              <Input
                id="case-study-1-score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Informe sua nota (0-100)"
                value={caseStudy1Score === null ? '' : caseStudy1Score}
                onChange={(e) => handleScoreChange(e.target.value, setCaseStudy1Score, 'estudo de caso 1')}
                className="w-32"
                disabled={!canEdit}
              />
              <span className="ml-2 text-gray-500">/ 100</span>
            </div>
          </div>
        )}
        
        {concurso.has_case_study_2 && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-study-2-score" className="font-medium">
              Nota do Estudo de Caso 2:
            </Label>
            <div className="flex items-center">
              <Input
                id="case-study-2-score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Informe sua nota (0-100)"
                value={caseStudy2Score === null ? '' : caseStudy2Score}
                onChange={(e) => handleScoreChange(e.target.value, setCaseStudy2Score, 'estudo de caso 2')}
                className="w-32"
                disabled={!canEdit}
              />
              <span className="ml-2 text-gray-500">/ 100</span>
            </div>
          </div>
        )}
        
        {concurso.has_case_study_3 && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="case-study-3-score" className="font-medium">
              Nota do Estudo de Caso 3:
            </Label>
            <div className="flex items-center">
              <Input
                id="case-study-3-score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Informe sua nota (0-100)"
                value={caseStudy3Score === null ? '' : caseStudy3Score}
                onChange={(e) => handleScoreChange(e.target.value, setCaseStudy3Score, 'estudo de caso 3')}
                className="w-32"
                disabled={!canEdit}
              />
              <span className="ml-2 text-gray-500">/ 100</span>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const objectiveSections = getObjectiveSectionList();
  
  return (
    <Card className="shadow-lg">
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
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {savedSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Respostas salvas com sucesso! Calculando pontuação...</p>
          </div>
        )}
        
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
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Atenção:</strong> Em provas Certo ou Errado, questões em branco não recebem pontuação nem penalidade.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="font-medium">Progresso: {answeredQuestions} de {totalQuestions} questões</div>
          <div className="text-sm text-gray-500">{Math.round(progressPercentage)}% completo</div>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200" />
        
        {/* Objective questions tabs (only for basic and specific knowledge) */}
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSection} 
              onValueChange={(value) => setSelectedSection(value as 'basic' | 'specific1' | 'specific2' | 'specific3')}
              className="w-full"
            >
              <TabsList className={`grid w-full grid-cols-${objectiveSections.length}`}>
                {objectiveSections.map(section => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <AnswerMatrix
                    matrix={createAnswerMatrix()}
                    answers={answers}
                    onAnswerChange={handleAnswerChange}
                    onClearAnswer={handleClearAnswer}
                    getOptionsForQuestion={getOptionsForQuestion}
                    disabled={!canEdit}
                    examType={concurso.exam_type as 'Alternativas' | 'Certo ou Errado'}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
        
        {/* Discursive and case study scores stacked at the bottom */}
        {(concurso.has_discursive || concurso.has_case_study_1 || concurso.has_case_study_2 || concurso.has_case_study_3) && (
          renderDiscursiveScores()
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
    </Card>
  );
};
