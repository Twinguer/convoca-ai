
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [recalculationSuccess, setRecalculationSuccess] = useState(false);
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

  // This is a simplified version without admin functionality
>>>>>>> e46a6541ffca239642566e38b8186904f0a899a2
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - {concurso?.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-center text-gray-600">
          O gabarito oficial deste concurso está disponível para visualização. 
          Apenas usuários autorizados podem modificar estas informações.
        </p>
        
        {nullifiedQuestions.size > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Questões Anuladas</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Este concurso possui {nullifiedQuestions.size} {nullifiedQuestions.size === 1 ? 'questão anulada' : 'questões anuladas'}.
                  {nullifiedQuestions.size > 0 && (
                    <span className="block mt-1">
                      Questões anuladas: {Array.from(nullifiedQuestions).sort((a, b) => a - b).join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
<<<<<<< HEAD
        </div>
        
        {objectiveSections.length > 0 && (
          <div className="bg-white border rounded-lg shadow-sm p-0">
            <Tabs value={selectedSection} onValueChange={(v) => setSelectedSection(v as any)}>
              <TabsList className="bg-gray-100 border-b p-0 rounded-t-lg">
                {objectiveSections.map(section => (
                  <TabsTrigger 
                    key={section.key} 
                    value={section.key}
                    className="rounded-none border-r last:border-r-0 py-2 px-4 data-[state=active]:bg-white"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {createAnswerMatrix().map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          {row.map((questionNumber, colIndex) => (
                            questionNumber !== null && (
                              <div key={`${rowIndex}-${colIndex}`} className="border rounded-md p-3 bg-white">
                                <div className="mb-2 font-medium text-gray-700">Questão {questionNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                  {getOptionsForQuestion().map((option) => (
                                    <button
                                      key={option}
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors
                                        ${answers[questionNumber] === option 
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                      onClick={() => handleAnswerChange(questionNumber, option)}
                                      disabled={nullifiedQuestions.has(questionNumber)}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                <NullifyQuestionButton
                                  questionNumber={questionNumber}
                                  isNullified={nullifiedQuestions.has(questionNumber)}
                                  onNullify={handleNullifyQuestion}
                                />
                              </div>
                            )
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
=======
>>>>>>> e46a6541ffca239642566e38b8186904f0a899a2
        )}
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Para participar deste ranking, entre com suas respostas na página de participação do concurso.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};