import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { runRankingPerformanceTest, RankingPerformanceTest } from '@/utils/performanceTest';
import { logger } from '@/utils/logger';

interface TestResult {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  dataCount?: number;
}

export const RankingPerformanceTestComponent: React.FC = () => {
  const [concursoId, setConcursoId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const handleRunTests = async () => {
    if (!concursoId.trim()) {
      alert('Por favor, insira um ID de concurso válido');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      logger.info('Iniciando testes de performance', 'RANKING_PERFORMANCE_TEST', { concursoId });
      
      const tester = new RankingPerformanceTest();
      const testResults = await tester.runAllTests(concursoId);
      const testSummary = tester.getSummary();
      
      setResults(testResults);
      setSummary(testSummary);
      
      logger.info('Testes de performance concluídos', 'RANKING_PERFORMANCE_TEST', testSummary);
    } catch (error) {
      logger.error('Erro ao executar testes de performance', 'RANKING_PERFORMANCE_TEST', error);
      alert('Erro ao executar testes: ' + String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const getPerformanceColor = (duration: number): string => {
    if (duration < 500) return 'bg-green-100 text-green-800';
    if (duration < 1000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceLabel = (duration: number): string => {
    if (duration < 500) return 'Excelente';
    if (duration < 1000) return 'Bom';
    if (duration < 2000) return 'Regular';
    return 'Lento';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Teste de Performance - Módulo de Ranking
          </CardTitle>
          <CardDescription>
            Valide as otimizações implementadas na Fase 1 do módulo de ranking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concursoId">ID do Concurso</Label>
            <Input
              id="concursoId"
              value={concursoId}
              onChange={(e) => setConcursoId(e.target.value)}
              placeholder="Digite o ID do concurso para testar"
              disabled={isRunning}
            />
          </div>
          
          <Button 
            onClick={handleRunTests} 
            disabled={isRunning || !concursoId.trim()}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando Testes...
              </>
            ) : (
              'Executar Testes de Performance'
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo dos Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.totalTests}</div>
                <div className="text-sm text-muted-foreground">Total de Testes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.successCount}</div>
                <div className="text-sm text-muted-foreground">Sucessos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failureCount}</div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.averageDuration.toFixed(0)}ms
                </div>
                <div className="text-sm text-muted-foreground">Duração Média</div>
              </div>
            </div>

            {summary.fastestTest && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Teste mais rápido:</strong> {summary.fastestTest.testName} 
                  ({summary.fastestTest.duration.toFixed(2)}ms)
                </AlertDescription>
              </Alert>
            )}

            {summary.slowestTest && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Teste mais lento:</strong> {summary.slowestTest.testName} 
                  ({summary.slowestTest.duration.toFixed(2)}ms)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      {result.error && (
                        <div className="text-sm text-red-600">{result.error}</div>
                      )}
                      {result.dataCount !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          {result.dataCount} registros carregados
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceColor(result.duration)}>
                      {getPerformanceLabel(result.duration)}
                    </Badge>
                    <span className="text-sm font-mono">
                      {result.duration.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
