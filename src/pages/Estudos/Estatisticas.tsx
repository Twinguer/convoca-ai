import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BarChart3, TrendingUp, Clock, Target, RotateCcw, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useToast } from '@/hooks/use-toast';
import PerformanceChart from '@/components/StudyStats/PerformanceChart';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Estatisticas = () => {
  const { statistics, isLoading, resetStatistics, getFilteredStats, refreshStatistics } = useStudyStatistics();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Recarregar estatísticas quando a página carregar para consolidar dados do cronograma
  useEffect(() => {
    refreshStatistics();
  }, []);

  // Função para obter estatísticas filtradas por disciplina
  const getFilteredSubjectStats = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) return {};
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      switch (timeFilter) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 6); // Incluir hoje
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 29); // Incluir hoje
          startDate.setHours(0, 0, 0, 0);
          break;
      }
    }

    // Filtrar sessões pelo período selecionado
    const filteredSessions = (statistics.sessionHistory || []).filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Recalcular estatísticas por disciplina para o período filtrado
    const filteredStats: Record<string, {
      totalHours: number;
      questionsAnswered: number;
      correctAnswers: number;
      wrongAnswers: number;
    }> = {};

    filteredSessions.forEach(session => {
      const subject = session.subject;
      if (subject) {
        if (!filteredStats[subject]) {
          filteredStats[subject] = {
            totalHours: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            wrongAnswers: 0
          };
        }
        
        filteredStats[subject].totalHours += session.duration / 60;
      }
    });

    // Adicionar dados de questões do statistics.subjectStats original para as disciplinas
    Object.entries(statistics.subjectStats || {}).forEach(([subject, stats]) => {
      if (filteredStats[subject]) {
        filteredStats[subject].questionsAnswered = stats.questionsAnswered;
        filteredStats[subject].correctAnswers = stats.correctAnswers;
        filteredStats[subject].wrongAnswers = stats.wrongAnswers;
      }
    });

    return filteredStats;
  };

  // Função para obter estatísticas gerais filtradas
  const getFilteredQuestionStats = () => {
    // Usar dados consolidados das disciplinas já filtradas
    const filteredSubjects = getFilteredSubjectStats();

    const totalQuestions = Object.values(filteredSubjects).reduce((sum, stats) => sum + stats.questionsAnswered, 0);
    const totalCorrect = Object.values(filteredSubjects).reduce((sum, stats) => sum + stats.correctAnswers, 0);
    const totalWrong = Object.values(filteredSubjects).reduce((sum, stats) => sum + stats.wrongAnswers, 0);

    return {
      questionsAnswered: totalQuestions,
      correctAnswers: totalCorrect,
      wrongAnswers: totalWrong
    };
  };

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

  const filteredStats = getFilteredStats(timeFilter === 'custom' ? 'week' : timeFilter);

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
        <div className="flex gap-3 items-center">
          <Select value={timeFilter} onValueChange={(value: 'day' | 'week' | 'month' | 'custom') => setTimeFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoje</SelectItem>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">30 dias</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          
          {timeFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">até</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0.5 mb-8">
        <PerformanceChart 
          statistics={statistics}
          timeFilter={timeFilter === 'custom' ? 'week' : timeFilter}
          onTimeFilterChange={setTimeFilter}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Desempenho em Questões
            </CardTitle>
            <CardDescription>
              Estatísticas de acertos e erros - {timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? 'Últimos 7 dias' : timeFilter === 'month' ? 'Últimos 30 dias' : customStartDate && customEndDate ? `${format(customStartDate, 'dd/MM/yyyy')} até ${format(customEndDate, 'dd/MM/yyyy')}` : 'Período personalizado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="disciplinas">Por Disciplina</TabsTrigger>
              </TabsList>
              
              <TabsContent value="geral" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Respondidas</span>
                    <Badge variant="secondary">{getFilteredQuestionStats().questionsAnswered}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-success">Acertos</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        {getFilteredQuestionStats().correctAnswers}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({formatPercentage(getFilteredQuestionStats().correctAnswers, getFilteredQuestionStats().questionsAnswered)})
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-destructive">Erros</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        {getFilteredQuestionStats().wrongAnswers}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({formatPercentage(getFilteredQuestionStats().wrongAnswers, getFilteredQuestionStats().questionsAnswered)})
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="disciplinas" className="mt-4">
                {Object.keys(getFilteredSubjectStats()).length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {Object.entries(getFilteredSubjectStats()).map(([subject, stats]) => (
                      <div key={subject} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm mb-2">{subject}</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-foreground">{stats.questionsAnswered}</div>
                            <div className="text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-success">{stats.correctAnswers}</div>
                            <div className="text-muted-foreground">Acertos</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-destructive">{stats.wrongAnswers}</div>
                            <div className="text-muted-foreground">Erros</div>
                          </div>
                        </div>
                        {stats.questionsAnswered > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-secondary rounded-full h-1.5">
                              <div 
                                className="bg-success h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${(stats.correctAnswers / stats.questionsAnswered) * 100}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 text-center">
                              {formatPercentage(stats.correctAnswers, stats.questionsAnswered)} de acerto
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma questão por disciplina registrada ainda
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use o rastreamento de questões para ver estatísticas por disciplina
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};

export default Estatisticas;