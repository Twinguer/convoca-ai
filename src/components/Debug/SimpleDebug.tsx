import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatScore } from '@/lib/utils';

export const SimpleDebug: React.FC = () => {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<any>(null);
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

      // Simular cálculo de pontuações
      const calculatedScores: any = {};
      
      for (const userAnswer of userAnswers) {
        const questionNumberStr = userAnswer.question_number.toString();
        const officialAnswer = officialAnswers[questionNumberStr];
        
        if (officialAnswer) {
          const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
          const questionWeight = officialAnswer.weight ?? 1;
          const disciplineType = userAnswer.discipline_type;
          
          if (!calculatedScores[disciplineType]) {
            calculatedScores[disciplineType] = 0;
          }
          
          if (isCorrect) {
            calculatedScores[disciplineType] += questionWeight;
          }
        }
      }

      setDebugData({
        concurso,
        userRanking: firstRanking,
        officialAnswers,
        userAnswers,
        calculatedScores,
        finalStructure: firstRanking.user_data
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando dados de debug...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Erro: {error}</p>
          <Button onClick={fetchDebugData} className="mt-4">
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
          <p className="text-gray-600">Nenhum dado encontrado</p>
          <Button onClick={fetchDebugData} className="mt-4">
            Carregar Dados
          </Button>
        </div>
      </div>
    );
  }

  const { concurso, userRanking, officialAnswers, userAnswers, calculatedScores, finalStructure } = debugData;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debug - Pontuações Objetivas</h1>
        <Button onClick={fetchDebugData}>
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Concurso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{concurso.titulo}</p>
            <p className="text-sm text-gray-600">ID: {concurso.id}</p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Disciplinas:</h3>
              <div className="space-y-2">
                {concurso.disciplines?.map((block: any, blockIndex: number) => (
                  <div key={blockIndex} className="border rounded p-2">
                    <p className="font-medium">{block.name}</p>
                    {block.disciplines?.map((discipline: any, discIndex: number) => (
                      <div key={discIndex} className="ml-4 text-sm">
                        <p>• {discipline.name} ({discipline.type}) - Peso: {discipline.weight}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Respostas do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Total: {userAnswers.length} respostas</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {userAnswers.map((answer, index) => {
                const officialAnswer = officialAnswers[answer.question_number.toString()];
                const isCorrect = officialAnswer ? 
                  (officialAnswer.is_nullified === true || answer.answer === officialAnswer.correct_answer) : 
                  false;
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <span>Q{answer.question_number}: {answer.answer} ({answer.discipline_type})</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pontuações Calculadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(calculatedScores).map(([disciplineType, score]) => (
                <div key={disciplineType} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium">{disciplineType}</span>
                  <span className="px-2 py-1 rounded text-xs border border-gray-300">
                    {formatScore(score as number)} pontos
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estrutura Final no Banco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Pontuações Objetivas:</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(finalStructure.objective_scores || {}, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-medium mb-2">Pontuação Total:</h3>
                <p className="text-lg font-bold">{formatScore(finalStructure.score || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
