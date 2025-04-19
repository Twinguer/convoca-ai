
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnswerMatrix } from '@/components/resultados/AnswerMatrix';
import { Concurso } from '@/types/concursos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso-details', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (error) throw error;
      return data as Concurso;
    },
  });

  const { data: existingAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['answer-keys', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concursoId);
        
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0) {
      const answersMap: { [key: number]: string } = {};
      const nullifiedSet = new Set<number>();
      
      existingAnswers.forEach((item: any) => {
        answersMap[item.question_number] = item.answer;
        if (item.is_nullified) {
          nullifiedSet.add(item.question_number);
        }
      });
      
      setAnswers(answersMap);
      setNullifiedQuestions(nullifiedSet);
    }
  }, [existingAnswers]);

  if (isLoadingConcurso || isLoadingAnswers) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-center text-gray-600">Carregando informações do gabarito...</p>
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-destructive space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Não foi possível carregar as informações do concurso.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getQuestionsCount = (section: 'basic' | 'specific1' | 'specific2' | 'specific3') => {
    if (section === 'basic' && concurso.has_basic_knowledge) {
      return concurso.basic_knowledge_questions || 0;
    } else if (section === 'specific1' && concurso.has_specific_knowledge_1) {
      return concurso.specific_knowledge_1_questions || 0;
    } else if (section === 'specific2' && concurso.has_specific_knowledge_2) {
      return concurso.specific_knowledge_2_questions || 0;
    } else if (section === 'specific3' && concurso.has_specific_knowledge_3) {
      return concurso.specific_knowledge_3_questions || 0;
    }
    return 0;
  };

  const getQuestionsRange = () => {
    if (selectedSection === 'basic') {
      return Array.from({ length: getQuestionsCount('basic') }, (_, i) => i + 1);
    } else {
      let startNumber = 1;
      
      if (concurso.has_basic_knowledge) {
        startNumber += (concurso.basic_knowledge_questions || 0);
      }
      
      if (selectedSection === 'specific1') {
        return Array.from({ length: getQuestionsCount('specific1') }, (_, i) => startNumber + i);
      } else if (selectedSection === 'specific2') {
        startNumber += (concurso.specific_knowledge_1_questions || 0);
        return Array.from({ length: getQuestionsCount('specific2') }, (_, i) => startNumber + i);
      } else if (selectedSection === 'specific3') {
        startNumber += (concurso.specific_knowledge_1_questions || 0) + (concurso.specific_knowledge_2_questions || 0);
        return Array.from({ length: getQuestionsCount('specific3') }, (_, i) => startNumber + i);
      }
    }
    return [];
  };

  const getOptionsForQuestion = (questionNumber: number) => {
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleClearAnswer = (questionNumber: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
  };

  const handleNullifyQuestion = (questionNumber: number) => {
    setNullifiedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
      } else {
        newSet.add(questionNumber);
        
        // If no answer is set for this question, set a default answer
        if (!answers[questionNumber]) {
          handleAnswerChange(questionNumber, concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A');
        }
      }
      return newSet;
    });
  };

  const createAnswerMatrix = () => {
    const questions = getQuestionsRange();
    if (questions.length === 0) return [[]];
    
    const QUESTIONS_PER_ROW = 5;
    const rows = Math.ceil(questions.length / QUESTIONS_PER_ROW);
    
    const matrix = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
        const index = row * QUESTIONS_PER_ROW + col;
        if (index < questions.length) {
          rowData.push(questions[index]);
        } else {
          rowData.push(null);
        }
      }
      matrix.push(rowData);
    }
    
    return matrix;
  };

  const validateAllSections = () => {
    // Get all questions from all sections
    const allQuestions = [
      ...getQuestionsRange('basic'),
      ...getQuestionsRange('specific1'),
      ...getQuestionsRange('specific2'),
      ...getQuestionsRange('specific3')
    ].filter(q => q !== undefined);

    // Check if all questions have answers or are nullified
    const unansweredQuestions = allQuestions.filter(q => !answers[q] && !nullifiedQuestions.has(q));
    
    if (unansweredQuestions.length > 0) {
      setError(`Todas as questões devem ter uma resposta ou serem anuladas. Faltam ${unansweredQuestions.length} questões.`);
      return false;
    }
    
    return true;
  };

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      
      // Validate that all questions across all sections are answered or nullified
      if (!validateAllSections()) {
        setIsSaving(false);
        return;
      }
      
      await supabase
        .from('answer_keys')
        .delete()
        .eq('concurso_id', concursoId);
      
      const entries = Object.entries(answers).map(([questionNumber, answer]) => ({
        concurso_id: concursoId,
        question_number: parseInt(questionNumber),
        answer: answer.toUpperCase(),
        is_nullified: nullifiedQuestions.has(parseInt(questionNumber))
      }));

      // Add entries for nullified questions that don't have an answer
      nullifiedQuestions.forEach(qNum => {
        if (!answers[qNum]) {
          entries.push({
            concurso_id: concursoId,
            question_number: qNum,
            answer: concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A', // Default answer for nullified questions
            is_nullified: true
          });
        }
      });
      
      const { error } = await supabase
        .from('answer_keys')
        .insert(entries);
      
      if (error) throw error;
      
      const { recalculateAllUserScores } = await import('@/integrations/supabase/rankings/userAnswers');
      
      const recalculationResult = await recalculateAllUserScores(concursoId);
      console.log('Recalculation result:', recalculationResult);
      
      if (recalculationResult.success) {
        setSavedSuccess(true);
        toast({
          title: "Gabarito salvo com sucesso",
          description: `O gabarito oficial foi atualizado. ${recalculationResult.updatedCount > 0 ? 
            `As notas de ${recalculationResult.updatedCount} usuários foram recalculadas.` : 
            'Não há usuários com respostas cadastradas para recalcular.'}`
        });
      } else {
        toast({
          title: "Gabarito salvo",
          description: "As respostas oficiais foram salvas com sucesso."
        });
      }
      
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      setError(error.message || "Ocorreu um erro ao salvar o gabarito oficial.");
      
      toast({
        title: "Erro ao salvar gabarito",
        description: error.message || "Ocorreu um erro ao salvar o gabarito oficial. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getObjectiveSectionList = () => {
    const sections = [];
    if (concurso.has_basic_knowledge) sections.push({ key: 'basic', label: 'Conhecimentos Básicos' });
    if (concurso.has_specific_knowledge_1) sections.push({ key: 'specific1', label: 'C. Específicos 1' });
    if (concurso.has_specific_knowledge_2) sections.push({ key: 'specific2', label: 'C. Específicos 2' });
    if (concurso.has_specific_knowledge_3) sections.push({ key: 'specific3', label: 'C. Específicos 3' });
    return sections;
  };

  const objectiveSections = getObjectiveSectionList();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Gabarito Oficial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {savedSuccess && (
          <Alert variant="success" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Gabarito salvo com sucesso!</AlertDescription>
          </Alert>
        )}
        
        <div className="mb-4">
          <Label htmlFor="section">Seção</Label>
          <Select value={selectedSection} onValueChange={(val) => setSelectedSection(val as any)}>
            <SelectTrigger id="section">
              <SelectValue placeholder="Selecione uma seção" />
            </SelectTrigger>
            <SelectContent>
              {objectiveSections.map(option => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <AnswerMatrix
          matrix={createAnswerMatrix()}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onClearAnswer={handleClearAnswer}
          getOptionsForQuestion={getOptionsForQuestion}
          examType={concurso.exam_type as 'Alternativas' | 'Certo ou Errado'}
          nullifiedQuestions={nullifiedQuestions}
          onNullifyQuestion={handleNullifyQuestion}
          isAdminView={true}
        />
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            type="button" 
            onClick={handleSaveAnswerKey} 
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Gabarito'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
