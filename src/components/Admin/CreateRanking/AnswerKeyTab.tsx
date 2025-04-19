import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnswerMatrix } from '@/components/resultados/AnswerMatrix';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnswerKeyTabProps {
  concursoId: string;
  hasBasicKnowledge: boolean;
  hasSpecificKnowledge1: boolean;
  hasSpecificKnowledge2: boolean;
  hasSpecificKnowledge3: boolean;
  basicKnowledgeQuestions: number;
  specificKnowledge1Questions: number;
  specificKnowledge2Questions: number;
  specificKnowledge3Questions: number;
  examType: string;
  alternativesCount: number;
}

export const AnswerKeyTab: React.FC<AnswerKeyTabProps> = ({
  concursoId,
  hasBasicKnowledge,
  hasSpecificKnowledge1,
  hasSpecificKnowledge2,
  hasSpecificKnowledge3,
  basicKnowledgeQuestions,
  specificKnowledge1Questions,
  specificKnowledge2Questions,
  specificKnowledge3Questions,
  examType,
  alternativesCount
}) => {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [selectedSection, setSelectedSection] = useState<string>("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnswerKey = async () => {
      if (!concursoId) return;
      
      const { data, error } = await supabase
        .from('answer_keys')
        .select('question_number, answer')
        .eq('concurso_id', concursoId);
        
      if (error) {
        console.error('Error fetching answer key:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const answersObj: {[key: number]: string} = {};
        data.forEach(item => {
          answersObj[item.question_number] = item.answer;
        });
        setAnswers(answersObj);
      }
    };
    
    fetchAnswerKey();
  }, [concursoId]);
  
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
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
  
  const getOptionsForQuestion = (questionNumber: number): string[] => {
    if (examType === 'Alternativas') {
      const options: string[] = [];
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      
      for (let i = 0; i < alternativesCount; i++) {
        if (i < letters.length) {
          options.push(letters[i]);
        }
      }
      
      return options;
    } else if (examType === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    return [];
  };
  
  const createAnswerMatrix = () => {
    const matrix: (number | null)[][] = [];
    let totalQuestions = 0;
    
    if (selectedSection === "basic" && hasBasicKnowledge) {
      totalQuestions = basicKnowledgeQuestions;
    } else if (selectedSection === "specific1" && hasSpecificKnowledge1) {
      totalQuestions = specificKnowledge1Questions;
    } else if (selectedSection === "specific2" && hasSpecificKnowledge2) {
      totalQuestions = specificKnowledge2Questions;
    } else if (selectedSection === "specific3" && hasSpecificKnowledge3) {
      totalQuestions = specificKnowledge3Questions;
    }
    
    if (totalQuestions <= 0) {
      return [[]];
    }
    
    let startingQuestion = 1;
    
    if (selectedSection === "specific1" && hasBasicKnowledge) {
      startingQuestion = basicKnowledgeQuestions + 1;
    } else if (selectedSection === "specific2") {
      startingQuestion = basicKnowledgeQuestions + specificKnowledge1Questions + 1;
    } else if (selectedSection === "specific3") {
      startingQuestion = basicKnowledgeQuestions + specificKnowledge1Questions + specificKnowledge2Questions + 1;
    }
    
    const numRows = Math.ceil(totalQuestions / 5);
    
    for (let i = 0; i < numRows; i++) {
      const row: (number | null)[] = [];
      
      for (let j = 0; j < 5; j++) {
        const questionNumber = startingQuestion + (i * 5) + j;
        
        if (questionNumber <= startingQuestion + totalQuestions - 1) {
          row.push(questionNumber);
        } else {
          row.push(null);
        }
      }
      
      matrix.push(row);
    }
    
    return matrix;
  };
  
  const getSectionOptions = () => {
    const options = [];
    
    if (hasBasicKnowledge) options.push({ id: "basic", label: "Conhecimentos Básicos" });
    if (hasSpecificKnowledge1) options.push({ id: "specific1", label: "C. Específicos 1" });
    if (hasSpecificKnowledge2) options.push({ id: "specific2", label: "C. Específicos 2" });
    if (hasSpecificKnowledge3) options.push({ id: "specific3", label: "C. Específicos 3" });
    
    return options;
  };
  
  const getTotalQuestions = (): number => {
    let total = 0;
    if (hasBasicKnowledge) total += basicKnowledgeQuestions || 0;
    if (hasSpecificKnowledge1) total += specificKnowledge1Questions || 0;
    if (hasSpecificKnowledge2) total += specificKnowledge2Questions || 0;
    if (hasSpecificKnowledge3) total += specificKnowledge3Questions || 0;
    return total;
  };
  
  // Modificar handleSaveAnswerKey para incluir is_nullified
  const handleSaveAnswerKey = async () => {
    if (!concursoId) {
      setError("ID do concurso não encontrado");
      return;
    }
    
    // Verificar se todas as questões foram respondidas
    const totalQuestions = getTotalQuestions();
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < totalQuestions) {
      toast({
        title: "Preenchimento incompleto",
        description: `Todas as questões do gabarito devem ser respondidas antes de salvar. Faltam ${totalQuestions - answeredQuestions} questões.`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      await supabase
        .from('answer_keys')
        .delete()
        .eq('concurso_id', concursoId);
      
      const answerRows = Object.keys(answers).map(questionNumber => ({
        concurso_id: concursoId,
        question_number: parseInt(questionNumber),
        answer: answers[parseInt(questionNumber)],
        is_nullified: false  // Por padrão, não anulada
      }));
      
      if (answerRows.length === 0) {
        toast({
          title: "Nenhuma resposta para salvar",
          description: "Por favor, informe pelo menos uma resposta no gabarito.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      const { error } = await supabase
        .from('answer_keys')
        .insert(answerRows);
      
      if (error) throw error;
      
      const { recalculateAllUserScores } = await import('@/integrations/supabase/rankings/userAnswers');
      
      const recalculationResult = await recalculateAllUserScores(concursoId);
      console.log('Recalculation result:', recalculationResult);
      
      if (recalculationResult.success) {
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
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      setError(error.message || "Erro ao salvar gabarito");
      
      toast({
        title: "Erro ao salvar gabarito",
        description: error.message || "Ocorreu um erro ao salvar o gabarito oficial.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Adicionar novo método para marcar questão como anulada
  const handleToggleNullification = (questionNumber: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      // Lógica de anulação (pode ser expandida conforme necessário)
      return newAnswers;
    });
  };
  
  const sectionOptions = getSectionOptions();
  
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
        
        <div className="mb-4">
          <Label htmlFor="section">Seção</Label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger id="section">
              <SelectValue placeholder="Selecione uma seção" />
            </SelectTrigger>
            <SelectContent>
              {sectionOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
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
          examType={examType as 'Alternativas' | 'Certo ou Errado'}
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
