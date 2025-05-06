
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';
import { Check, X, AlertTriangle, HelpCircle } from 'lucide-react';

interface SubjectAnswerComparisonProps {
  concurso: Concurso;
  userAnswers: { [key: number]: string };
  officialAnswers: { [key: number]: { answer: string; weight: number; isNullified: boolean; } };
  subjectScores?: { [key: string]: number };
  subjects?: Array<{code: string; name: string; questions: number;}>;
}

export const SubjectAnswerComparison: React.FC<SubjectAnswerComparisonProps> = ({
  concurso,
  userAnswers,
  officialAnswers,
  subjectScores,
  subjects = []
}) => {
  if (!subjects || subjects.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Respostas por Disciplina</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Não há dados de disciplinas disponíveis para este concurso.</p>
        </CardContent>
      </Card>
    );
  }

  // Group answers by subject
  const getSubjectRange = (subjectCode: string) => {
    let questionStart = 1;
    for (const subject of subjects) {
      const questionEnd = questionStart + subject.questions - 1;
      if (subject.code === subjectCode) {
        return { start: questionStart, end: questionEnd };
      }
      questionStart = questionEnd + 1;
    }
    return { start: 0, end: 0 };
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Respostas por Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={subjects[0]?.code}>
          <TabsList className="w-full flex flex-wrap">
            {subjects.map(subject => (
              <TabsTrigger key={subject.code} value={subject.code} className="flex-grow">
                {subject.name}
                {subjectScores && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {subjectScores[subject.code] || 0}/{subject.questions}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {subjects.map(subject => {
            const range = getSubjectRange(subject.code);
            const questions = Array.from(
              { length: range.end - range.start + 1 }, 
              (_, i) => range.start + i
            );
            
            return (
              <TabsContent key={subject.code} value={subject.code}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Questão</TableHead>
                        <TableHead>Sua Resposta</TableHead>
                        <TableHead>Gabarito Oficial</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map(questionNumber => {
                        const userAnswer = userAnswers[questionNumber];
                        const officialAnswer = officialAnswers[questionNumber];
                        const isNullified = officialAnswer?.isNullified;
                        const isCorrect = isNullified || 
                          (officialAnswer && userAnswer && 
                          userAnswer.toUpperCase() === officialAnswer.answer.toUpperCase());
                        
                        return (
                          <TableRow key={questionNumber}>
                            <TableCell className="font-medium">{questionNumber}</TableCell>
                            <TableCell>
                              {userAnswer ? (
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                                  ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {userAnswer}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {officialAnswer ? (
                                <div className="flex items-center">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full 
                                    ${isNullified ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {officialAnswer.answer}
                                  </span>
                                  {isNullified && (
                                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center">
                                      <HelpCircle size={12} className="mr-1" />
                                      Anulada
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {officialAnswer ? (
                                isNullified ? (
                                  <div className="flex items-center justify-end">
                                    <span className="text-amber-600 font-medium flex items-center">
                                      <AlertTriangle size={16} className="mr-1" />
                                      Anulada
                                    </span>
                                  </div>
                                ) : isCorrect ? (
                                  <div className="flex items-center justify-end">
                                    <span className="text-green-600 font-medium flex items-center">
                                      <Check size={16} className="mr-1" />
                                      Correta
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    <span className="text-red-600 font-medium flex items-center">
                                      <X size={16} className="mr-1" />
                                      Incorreta
                                    </span>
                                  </div>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};
