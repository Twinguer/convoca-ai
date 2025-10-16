import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DebugData {
  concurso: any;
  userRanking: any;
  officialAnswers: any;
  userAnswers: any[];
  disciplineMapping: any;
  calculatedScores: any;
  finalStructure: any;
}

export const ObjectiveScoresDebug: React.FC = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados do usuário
      const { data: userRanking, error: userError } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userRanking?.consolidated_data) {
        throw new Error('Nenhum dado de ranking encontrado');
      }

      // Buscar o primeiro concurso disponível
      const rankings = userRanking.consolidated_data.rankings || {};
      const firstRankingId = Object.keys(rankings)[0];
      const firstRanking = rankings[firstRankingId];
      
      if (!firstRanking) {
        throw new Error('Nenhum ranking encontrado');
      }

      const concursoId = firstRanking.concurso_id;

      // Buscar dados do concurso
      const { data: concurso, error: concursoError } = await supabase
        .from('concursos')
        .select('id, titulo, disciplines, official_answers')
        .eq('id', concursoId)
        .single();

      if (concursoError) throw concursoError;

      // Buscar gabarito
      const officialAnswers = concurso.official_answers?.booklets?.default?.answers || 
                             concurso.official_answers?.booklets?.[Object.keys(concurso.official_answers?.booklets || {})[0]]?.answers || {};

      // Extrair respostas do usuário
      const userAnswers: any[] = [];
      const answersData = firstRanking.user_data?.answers || {};
      
      if (answersData && typeof answersData === 'object') {
        for (const blockId in answersData) {
          const blockData = answersData[blockId];
          if (typeof blockData === 'object' && blockData !== null) {
            for (const disciplineType in blockData) {
              const disciplineData = blockData[disciplineType];
              if (typeof disciplineData === 'object' && disciplineData !== null) {
                for (const questionNumber in disciplineData) {
                  const questionNum = parseInt(questionNumber);
                  if (!isNaN(questionNum)) {
                    userAnswers.push({
                      question_number: questionNum,
                      answer: disciplineData[questionNumber],
                      discipline_type: disciplineType
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Criar mapeamento de disciplinas
      const disciplineMapping: any = {};
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        for (const block of concurso.disciplines) {
          if ('disciplines' in block && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                disciplineMapping[discipline.type] = {
                  name: discipline.name,
                  weight: discipline.weight || 1,
                  questionCount: discipline.questionCount || 0,
                  minimumScore: discipline.minimum_score || 0
                };
              }
            }
          }
        }
      }

      // Simular cálculo de pontuações
      const calculatedScores: any = {};
      const disciplineScores: any = {};
      
      for (const userAnswer of userAnswers) {
        const questionNumberStr = userAnswer.question_number.toString();
        const officialAnswer = officialAnswers[questionNumberStr];
        
        if (officialAnswer) {
          const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
          const questionWeight = officialAnswer.weight ?? 1;
          const disciplineType = userAnswer.discipline_type;
          
          if (!disciplineScores[disciplineType]) {
            disciplineScores[disciplineType] = 0;
          }
          
          if (isCorrect) {
            disciplineScores[disciplineType] += questionWeight;
          }
        }
      }

      // Criar estrutura final
      const finalStructure = {
        score: firstRanking.user_data?.score || 0,
        objective_scores_tot: firstRanking.user_data?.objective_scores_tot || 0,
        objective_scores: firstRanking.user_data?.objective_scores || {},
        subjective_scores: firstRanking.user_data?.subjective_scores || 0,
        subjectives: firstRanking.user_data?.subjectives || {}
      };

      setDebugData({
        concurso,
        userRanking: firstRanking,
        officialAnswers,
        userAnswers,
        disciplineMapping,
        calculatedScores: disciplineScores,
        finalStructure
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados de debug...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Erro: {error}</span>
          </div>
          <Button onClick={fetchDebugData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!debugData) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum dado encontrado</p>
          <Button onClick={fetchDebugData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Carregar Dados
          </Button>
        </div>
      </div>
    );
  }

  const { concurso, userRanking, officialAnswers, userAnswers, disciplineMapping, calculatedScores, finalStructure } = debugData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug - Pontuações Objetivas</h1>
        <Button onClick={fetchDebugData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="concurso">Concurso</TabsTrigger>
          <TabsTrigger value="answers">Respostas</TabsTrigger>
          <TabsTrigger value="calculation">Cálculo</TabsTrigger>
          <TabsTrigger value="final">Estrutura Final</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Concurso</h3>
                  <p className="text-sm text-gray-600">{concurso.titulo}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Total de Respostas</h3>
                  <p className="text-sm text-gray-600">{userAnswers.length}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Disciplinas Mapeadas</h3>
                  <p className="text-sm text-gray-600">{Object.keys(disciplineMapping).length}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Pontuação Total</h3>
                  <p className="text-sm text-gray-600">{finalStructure.score}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concurso" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disciplinas do Concurso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {concurso.disciplines?.map((block: any, blockIndex: number) => (
                  <div key={blockIndex} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Bloco: {block.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {block.disciplines?.map((discipline: any, discIndex: number) => (
                        <div key={discIndex} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{discipline.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              discipline.isEnabled 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {discipline.isEnabled ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>Tipo: {discipline.type}</p>
                            <p>Peso: {discipline.weight}</p>
                            <p>Questões: {discipline.questionCount}</p>
                            <p>Mínimo: {discipline.minimum_score}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Respostas do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAnswers.map((answer, index) => {
                  const officialAnswer = officialAnswers[answer.question_number.toString()];
                  const isCorrect = officialAnswer ? 
                    (officialAnswer.is_nullified === true || answer.answer === officialAnswer.correct_answer) : 
                    false;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">Q{answer.question_number}</span>
                        <span className="text-gray-600">Resposta: {answer.answer}</span>
                        <span className="text-gray-600">Disciplina: {answer.discipline_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {officialAnswer ? (
                          <>
                            <span className="text-gray-600">Correta: {officialAnswer.correct_answer}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              isCorrect 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {isCorrect ? "✓" : "✗"}
                            </span>
                          </>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                            Não encontrada
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo das Pontuações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold">Pontuações Calculadas por Disciplina</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(calculatedScores).map(([disciplineType, score]) => (
                    <div key={disciplineType} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{disciplineType}</span>
                        <span className="px-2 py-1 rounded text-xs border border-gray-300 text-gray-800">
                          {score as number} pontos
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Peso: {disciplineMapping[disciplineType]?.weight || 'N/A'}</p>
                        <p>Questões: {disciplineMapping[disciplineType]?.questionCount || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="final" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Final no Banco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Estrutura Atual</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(finalStructure, null, 2)}
                  </pre>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Pontuações Objetivas Esperadas</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(calculatedScores, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
