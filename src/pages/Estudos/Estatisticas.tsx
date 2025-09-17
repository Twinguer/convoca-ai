import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BarChart3, TrendingUp, Clock, Target, RotateCcw, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useToast } from '@/hooks/use-toast';
import PerformanceChart from '@/components/StudyStats/PerformanceChart';

const Estatisticas = () => {
  const { statistics, isLoading, resetStatistics, getFilteredStats, refreshStatistics } = useStudyStatistics();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');

  // Recarregar estatísticas quando a página carregar para consolidar dados do cronograma
  useEffect(() => {
    refreshStatistics();
  }, []);

  const handleResetStats = async () => {
    await resetStatistics();
    toast({
      title: "Estatísticas zeradas",
      description: "Todas as suas estatísticas foram resetadas com sucesso.",
    });
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1) + 'h';
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const filteredStats = getFilteredStats(timeFilter);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Estatísticas de Estudo</h1>
          <p className="text-muted-foreground">Acompanhe seu desempenho e evolução nos estudos</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeFilter} onValueChange={(value: 'day' | 'week' | 'month') => setTimeFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Zerar Estatísticas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Zerar Estatísticas</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá deletar permanentemente todas as suas estatísticas de estudo. 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetStats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Zerar Estatísticas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(statistics.totalHours)}</div>
            <p className="text-xs text-muted-foreground">
              {formatHours(filteredStats.hours)} nos últimos {timeFilter === 'day' ? '1 dia' : timeFilter === 'week' ? '7 dias' : '30 dias'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média {timeFilter === 'day' ? 'Diária' : timeFilter === 'week' ? 'Semanal' : 'Mensal'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(filteredStats.average)}</div>
            <p className="text-xs text-muted-foreground">
              Baseado nos últimos {timeFilter === 'week' ? '7 dias' : timeFilter === 'month' ? '30 dias' : 'dia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              dias consecutivos (recorde: {statistics.longestStreak})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {filteredStats.sessions} nos últimos {timeFilter === 'week' ? '7 dias' : timeFilter === 'month' ? '30 dias' : 'dia'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <PerformanceChart 
          statistics={statistics}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Desempenho em Questões
            </CardTitle>
            <CardDescription>
              Estatísticas de acertos e erros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Respondidas</span>
                <Badge variant="secondary">{statistics.questionsAnswered}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">Acertos</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {statistics.correctAnswers}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({formatPercentage(statistics.correctAnswers, statistics.questionsAnswered)})
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-red-600">Erros</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {statistics.wrongAnswers}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({formatPercentage(statistics.wrongAnswers, statistics.questionsAnswered)})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico Recente
          </CardTitle>
          <CardDescription>
            Últimas sessões de estudo registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statistics.sessionHistory.length > 0 ? (
            <div className="space-y-3">
              {statistics.sessionHistory.slice(-10).reverse().map((session, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium">
                      {new Date(session.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {session.subject && (
                      <div className="text-xs text-muted-foreground mt-1">
                        📚 {session.subject}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {session.duration} min
                    </Badge>
                    <Badge variant={session.type === 'timer' ? 'default' : 'secondary'}>
                      {session.type === 'timer' ? 'Timer' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma sessão de estudo registrada ainda. 
                Comece usando o timer para registrar suas sessões!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Estatisticas;