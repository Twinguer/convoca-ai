import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, FileX, AlertTriangle, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GabaritoEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'basic' | 'specific1' | 'specific2'>('basic');
  const [answerKey, setAnswerKey] = useState<Record<number, string>>({});
  
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Concurso;
    }
  });
  
  const { data: existingAnswerKey, isLoading: isLoadingAnswerKey } = useQuery({
    queryKey: ['answer-key', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', id);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  useEffect(() => {
    if (existingAnswerKey?.length) {
      const keyMap: Record<number, string> = {};
      existingAnswerKey.forEach((item: any) => {
        keyMap[item.question_number] = item.answer;
      });
      setAnswerKey(keyMap);
    }
  }, [existingAnswerKey]);
  
  const getQuestionsBySection = (section: 'basic' | 'specific1' | 'specific2') => {
    if (!concurso) return [];
    
    let start = 1;
    let end = 0;
    
    if (section === 'basic' && concurso.has_basic_knowledge) {
      end = concurso.basic_knowledge_questions || 0;
    } else if (section === 'specific1' && concurso.has_specific_knowledge_1) {
      start = (concurso.basic_knowledge_questions || 0) + 1;
      end = start + (concurso.specific_knowledge_1_questions || 0) - 1;
    } else if (section === 'specific2' && concurso.has_specific_knowledge_2) {
      start = (concurso.basic_knowledge_questions || 0) + 
              (concurso.specific_knowledge_1_questions || 0) + 1;
      end = start + (concurso.specific_knowledge_2_questions || 0) - 1;
    }
    
    const questions = [];
    for (let i = start; i <= end; i++) {
      questions.push(i);
    }
    
    return questions;
  };
  
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };
  
  const getQuestionType = (questionNumber: number): 'basic' | 'specific1' | 'specific2' => {
    if (!concurso) return 'basic';
    
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    
    if (questionNumber <= basicEnd) {
      return 'basic';
    } else if (questionNumber <= specific1End) {
      return 'specific1';
    } else {
      return 'specific2';
    }
  };
  
  const handleSaveAnswerKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSavedSuccess(false);
      
      const allQuestions = [
        ...getQuestionsBySection('basic'),
        ...getQuestionsBySection('specific1'),
        ...getQuestionsBySection('specific2')
      ];
      
      if (Object.keys(answerKey).length < allQuestions.length) {
        setError("Todas as questões devem ter uma resposta. Por favor, preencha todas as alternativas.");
        setIsLoading(false);
        return;
      }
      
      const { error: deleteError } = await supabase
        .from('answer_keys')
        .delete()
        .eq('concurso_id', id);
        
      if (deleteError) throw deleteError;
      
      const answersArray = Object.entries(answerKey).map(([questionNumber, answer]) => {
        const qNum = parseInt(questionNumber);
        const qType = getQuestionType(qNum);
        
        return {
          concurso_id: id,
          question_number: qNum,
          answer: answer.toUpperCase(),
          is_basic_knowledge: qType === 'basic',
          is_specific_1: qType === 'specific1',
          is_specific_2: qType === 'specific2',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      if (answersArray.length > 0) {
        const { error: insertError } = await supabase
          .from('answer_keys')
          .insert(answersArray);
          
        if (insertError) throw insertError;
      }

      const { error: recalculationError } = await supabase
        .rpc('recalculate_all_scores', { p_concurso_id: id });

      if (recalculationError) {
        throw new Error('Erro ao recalcular pontuações: ' + recalculationError.message);
      }
      
      setSuccess(true);
      toast({
        title: "Gabarito salvo com sucesso",
        description: "O gabarito oficial foi atualizado e as notas dos usuários foram recalculadas.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['answer-key', id] });
      queryClient.invalidateQueries({ queryKey: ['rankings', id] });
      
      setTimeout(() => {
        navigate(`/project/admin/man/concursos/editar/${id}`);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      setError(error.message || "Ocorreu um erro ao salvar o gabarito.");
      toast({
        title: "Erro ao salvar gabarito",
        description: error.message || "Ocorreu um erro ao salvar o gabarito.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAnswerOptions = () => {
    if (!concurso) return ['A', 'B', 'C', 'D', 'E'];
    
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };
  
  if (isLoadingConcurso || isLoadingAnswerKey) {
    return <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-center text-gray-600">Carregando dados...</p>
      </CardContent>
    </Card>;
  }
  
  if (!concurso) {
    return <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
        <FileX className="h-10 w-10 text-gray-400" />
        <p className="text-center text-lg font-medium">Concurso não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/project/admin/man/concursos')}>
          Voltar para a lista
        </Button>
      </CardContent>
    </Card>;
  }
  
  const basicQuestions = getQuestionsBySection('basic');
  const specific1Questions = getQuestionsBySection('specific1');
  const specific2Questions = getQuestionsBySection('specific2');
  const answerOptions = getAnswerOptions();
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-emerald-50 border-b">
        <CardTitle>Editor de Gabarito - {concurso.titulo}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <Check className="h-4 w-4" />
            <p>Gabarito salvo com sucesso!</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">{concurso.orgao}</h3>
            <p className="text-gray-500">
              {concurso.banca} • {concurso.exam_type === 'Certo ou Errado' 
                ? 'Certo ou Errado' 
                : `${concurso.alternatives_count || 5} Alternativas`}
            </p>
          </div>
          
          <div className="text-right">
            <p className="font-medium">Total de questões: {
              (concurso.basic_knowledge_questions || 0) +
              (concurso.specific_knowledge_1_questions || 0) +
              (concurso.specific_knowledge_2_questions || 0)
            }</p>
          </div>
        </div>
        
        <Tabs defaultValue="basic" onValueChange={(value) => setSelectedTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" disabled={!basicQuestions.length}>
              Conhecimentos Básicos ({basicQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="specific1" disabled={!specific1Questions.length}>
              Conhecimentos Específicos ({specific1Questions.length})
            </TabsTrigger>
            <TabsTrigger value="specific2" disabled={!specific2Questions.length}>
              Conhecimentos Específicos 2 ({specific2Questions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            {basicQuestions.length > 0 ? (
              <AnswerKeyTable 
                questions={basicQuestions} 
                answerKey={answerKey} 
                onChange={handleAnswerChange} 
                answerOptions={answerOptions}
              />
            ) : (
              <p className="text-center py-8 text-gray-500">
                Este concurso não possui questões de conhecimentos básicos.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="specific1">
            {specific1Questions.length > 0 ? (
              <AnswerKeyTable 
                questions={specific1Questions} 
                answerKey={answerKey} 
                onChange={handleAnswerChange} 
                answerOptions={answerOptions}
              />
            ) : (
              <p className="text-center py-8 text-gray-500">
                Este concurso não possui questões de conhecimentos específicos.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="specific2">
            {specific2Questions.length > 0 ? (
              <AnswerKeyTable 
                questions={specific2Questions} 
                answerKey={answerKey} 
                onChange={handleAnswerChange} 
                answerOptions={answerOptions}
              />
            ) : (
              <p className="text-center py-8 text-gray-500">
                Este concurso não possui questões de conhecimentos específicos 2.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between p-6 bg-gray-50 border-t">
        <Button 
          variant="outline" 
          onClick={() => navigate(`/project/admin/man/concursos/editar/${id}`)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        <Button 
          onClick={handleSaveAnswerKey} 
          disabled={isLoading} 
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Gabarito
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

interface AnswerKeyTableProps {
  questions: number[];
  answerKey: Record<number, string>;
  onChange: (questionNumber: number, answer: string) => void;
  answerOptions: string[];
}

const AnswerKeyTable: React.FC<AnswerKeyTableProps> = ({ 
  questions, 
  answerKey, 
  onChange,
  answerOptions
}) => {
  const maxQuestionsPerRow = 10;
  const numRows = Math.ceil(questions.length / maxQuestionsPerRow);
  
  return (
    <div className="border rounded-md overflow-hidden mt-4">
      <Table>
        {[...Array(numRows)].map((_, rowIndex) => {
          const rowQuestions = questions.slice(
            rowIndex * maxQuestionsPerRow, 
            (rowIndex + 1) * maxQuestionsPerRow
          );
          
          return (
            <React.Fragment key={rowIndex}>
              <TableHeader>
                <TableRow>
                  {rowQuestions.map(questionNumber => (
                    <TableHead key={questionNumber} className="text-center">
                      Questão {questionNumber}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {rowQuestions.map(questionNumber => (
                    <TableCell key={questionNumber} className="text-center p-2">
                      <Select 
                        value={answerKey[questionNumber] || undefined}
                        onValueChange={(value) => onChange(questionNumber, value)}
                      >
                        <SelectTrigger className="w-20 mx-auto">
                          <SelectValue placeholder="Resposta" />
                        </SelectTrigger>
                        <SelectContent>
                          {answerOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </React.Fragment>
          );
        })}
      </Table>
    </div>
  );
};

export default GabaritoEditor;
