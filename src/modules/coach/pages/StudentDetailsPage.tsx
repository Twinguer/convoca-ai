import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Clock, CheckCircle, BookOpen, TrendingUp, Plus, Calendar, Trash2, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { StudentRelationship } from '@/types/coach';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';
import { UserStudyService } from '@/services/userStudyService';
import type { StudyStatistics } from '@/types/userStudy';

const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado para estatísticas completas do aluno
  const [studentStatistics, setStudentStatistics] = useState<StudyStatistics | null>(null);
  
  // Estado para modal de mensagem
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  // Buscar dados do aluno específico
  const { data: student, isLoading } = useQuery({
    queryKey: ['coach-student', user?.id, studentId],
    queryFn: async () => {
      if (!user?.id || !studentId) return null;

      // Buscar perfil do coach
      const { data: coachProfile, error: profileError } = await supabase
        .from('coach_profiles')
        .select('student_relationships')
        .eq('coach_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Encontrar o aluno específico
      const students = coachProfile?.student_relationships || [];
      const studentData = students.find((s: any) => s.student_id === studentId);

      if (!studentData) return null;

      // Buscar dados de estudos do aluno
      const { data: studyData } = await supabase
        .from('user_study_v2')
        .select('*')
        .eq('user_id', studentId)
        .single();

      // Buscar nome do aluno do perfil
      const { data: profileData } = await supabase
        .from('users_profiles')
        .select('name, email')
        .eq('id', studentId)
        .single();

      return {
        ...studentData,
        student_name: profileData?.name || profileData?.email || studentData.student_email || 'Aluno',
        student_email: profileData?.email || studentData.student_email,
        studyData
      };
    },
    enabled: !!user && !!studentId,
  });

  // Buscar estatísticas completas do aluno
  const { data: fullStatistics, isLoading: loadingStats } = useQuery({
    queryKey: ['coach-student-statistics', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const userStudyData = await UserStudyService.getUserStudyData(studentId);
      if (!userStudyData) return null;
      
      // Calcular estatísticas como faz o useStudyStatistics
      if (userStudyData.study_sessions && userStudyData.study_sessions.length > 0) {
        return calculateStudyStatistics(userStudyData.study_sessions);
      } else if (userStudyData.study_schedule && userStudyData.study_schedule.length > 0) {
        const scheduleSessions = userStudyData.study_schedule;
        let totalHours = 0;
        let totalSessions = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        // Calcular subjectStats
        const subjectStats: Record<string, any> = {};
        const sessionHistory: any[] = [];
        
        scheduleSessions.forEach((session: any) => {
          const stats = session.total_stats || {};
          if (stats.session_count > 0) {
            totalHours += (stats.total_duration_minutes || 0) / 60;
            totalSessions += stats.session_count || 0;
            totalQuestions += stats.total_questions || 0;
            totalCorrect += stats.total_correct || 0;
            
            // Adicionar a disciplinas
            const discipline = session.discipline_name || 'Sem Disciplina';
            if (!subjectStats[discipline]) {
              subjectStats[discipline] = {
                totalHours: 0,
                totalSessions: 0,
                questionsAnswered: 0,
                correctAnswers: 0,
                wrongAnswers: 0
              };
            }
            
            const disciplineHours = (stats.total_duration_minutes || 0) / 60;
            subjectStats[discipline].totalHours += disciplineHours;
            subjectStats[discipline].totalSessions += stats.session_count || 0;
            subjectStats[discipline].questionsAnswered += stats.total_questions || 0;
            subjectStats[discipline].correctAnswers += stats.total_correct || 0;
            subjectStats[discipline].wrongAnswers += (stats.total_questions || 0) - (stats.total_correct || 0);
            
            // Adicionar ao histórico de sessões
            sessionHistory.push({
              date: stats.last_session_date || new Date().toISOString().split('T')[0],
              duration: stats.total_duration_minutes || 0,
              type: 'manual' as const,
              subject: discipline,
              questions: stats.total_questions || 0,
              correctAnswers: stats.total_correct || 0
            });
          }
        });
        
        // Ordenar sessionHistory por data
        sessionHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return {
          totalHours: totalHours,
          totalSessions: totalSessions,
          questionsAnswered: totalQuestions,
          correctAnswers: totalCorrect,
          wrongAnswers: totalQuestions - totalCorrect,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: scheduleSessions[0]?.total_stats?.last_session_date || null,
          dailyStats: {},
          weeklyStats: {},
          monthlyStats: {},
          averages: {
            dailyHours: totalHours / 7,
            weeklyHours: totalHours,
            monthlyHours: totalHours * 4
          },
          sessionHistory: sessionHistory,
          subjectStats: subjectStats,
          lastUpdated: new Date().toISOString()
        } as StudyStatistics;
      }
      
      return null;
    },
    enabled: !!studentId,
  });

  // Verificar se tem acesso
  useEffect(() => {
    if (student === null && !isLoading) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem acesso a este aluno ou o aluno não faz parte da sua equipe',
        variant: 'destructive'
      });
      navigate('/coach/dashboard');
    }
  }, [student, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Carregando dados do aluno...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p>Aluno não encontrado ou você não tem acesso</p>
        </Alert>
      </div>
    );
  }

  // Calcular estatísticas reais a partir dos dados de estudo do aluno
  const calculatePerformance = () => {
    if (!student.studyData) {
      return {
        hours_this_week: 0,
        hours_last_week: 0,
        sessions_this_week: 0,
        tasks_completed: 0,
        tasks_pending: 0,
        completion_rate: 0,
        engagement_score: 0
      };
    }

    // Tentar usar study_statistics primeiro
    const statistics = student.studyData.study_statistics;
    if (statistics && typeof statistics === 'object' && Object.keys(statistics).length > 0) {
      // Extrair dados das statistics
      const totalHours = (statistics as any).totalHours || 0;
      const totalSessions = (statistics as any).totalSessions || 0;
      
      return {
        hours_this_week: totalHours,
        hours_last_week: totalHours * 0.8, // Aproximação
        sessions_this_week: totalSessions,
        sessions_last_week: Math.floor(totalSessions * 0.8),
        tasks_completed: 0,
        tasks_pending: 0,
        completion_rate: totalSessions > 0 ? 80 : 0,
        engagement_score: Math.min(10, (totalHours / 2))
      };
    }

    // NOVO: Buscar estatísticas de study_schedule
    const scheduleSessions = student.studyData.study_schedule || [];
    if (scheduleSessions.length > 0) {
      let totalHours = 0;
      let totalSessions = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;
      
      scheduleSessions.forEach((s: any) => {
        const stats = s.total_stats || {};
        if (stats.session_count > 0) {
          totalHours += (stats.total_duration_minutes || 0) / 60;
          totalSessions += stats.session_count || 0;
          totalQuestions += stats.total_questions || 0;
          totalCorrect += stats.total_correct || 0;
        }
      });
      
      if (totalSessions > 0) {
        return {
          hours_this_week: totalHours,
          hours_last_week: totalHours * 0.8,
          sessions_this_week: totalSessions,
          sessions_last_week: Math.floor(totalSessions * 0.8),
          tasks_completed: totalQuestions,
          tasks_pending: 0,
          completion_rate: 75,
          engagement_score: Math.min(10, totalHours / 2)
        };
      }
    }

    // Fallback: usar study_sessions
    const sessions = student.studyData.study_sessions || [];
    
    if (sessions.length === 0) {
      return {
        hours_this_week: 0,
        hours_last_week: 0,
        sessions_this_week: 0,
        tasks_completed: 0,
        tasks_pending: 0,
        completion_rate: 0,
        engagement_score: 0
      };
    }

    // Calcular estatísticas usando o helper
    const stats = calculateStudyStatistics(sessions);
    
    // Calcular período desta semana e semana passada
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay()); // Domingo desta semana
    startOfThisWeek.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(endOfLastWeek.getMilliseconds() - 1);
    
    // Normalizar campo de data da sessão
    const getSessionDate = (s: any) => {
      return s.sessionDate || s.session_date || s.date || new Date().toISOString().split('T')[0];
    };
    
    const thisWeekSessions = sessions.filter(s => {
      const sessionDate = new Date(getSessionDate(s));
      return sessionDate >= startOfThisWeek;
    });
    
    const lastWeekSessions = sessions.filter(s => {
      const sessionDate = new Date(getSessionDate(s));
      return sessionDate >= startOfLastWeek && sessionDate < startOfThisWeek;
    });
    
    // Normalizar duration - aceitar tanto duration quanto total_duration_minutes
    const getDuration = (s: any) => s.duration ?? s.total_duration_minutes ?? 0;
    
    const hoursThisWeek = thisWeekSessions.reduce((sum, s) => sum + (getDuration(s) / 60), 0);
    const hoursLastWeek = lastWeekSessions.reduce((sum, s) => sum + (getDuration(s) / 60), 0);
    
    return {
      hours_this_week: hoursThisWeek,
      hours_last_week: hoursLastWeek,
      sessions_this_week: thisWeekSessions.length,
      sessions_last_week: lastWeekSessions.length,
      tasks_completed: 0, // Não disponível em study_sessions
      tasks_pending: 0, // Não disponível em study_sessions
      completion_rate: sessions.length > 0 ? (thisWeekSessions.length / sessions.length) : 0,
      engagement_score: sessions.length > 0 ? Math.min(10, (hoursThisWeek / 20) * 10) : 0 // Baseado em 20h semanal = score 10
    };
  };

  const performance = calculatePerformance();

  // Mutation para enviar mensagem ao aluno
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!studentId || !user?.id) {
        throw new Error('Dados insuficientes para enviar mensagem');
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          type: 'coach_message',
          title: 'Mensagem do Coach',
          message: message.trim(),
          metadata: {
            coach_id: user.id,
            sent_at: new Date().toISOString()
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada',
        description: 'A mensagem foi enviada com sucesso para o aluno.',
      });
      setMessageModalOpen(false);
      setMessageText('');
      // Invalidar notificações do aluno para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['notifications', studentId] });
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSendMessage = () => {
    const trimmedMessage = messageText.trim();
    
    if (!trimmedMessage) {
      toast({
        title: 'Mensagem vazia',
        description: 'Por favor, digite uma mensagem antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedMessage.length > 600) {
      toast({
        title: 'Mensagem muito longa',
        description: 'A mensagem deve ter no máximo 600 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate(trimmedMessage);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coach/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Detalhes do Aluno</h1>
          <p className="text-muted-foreground">
            {student.student_name}
          </p>
        </div>
        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
          {student.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Tabs: Estudos e Estatísticas */}
      <Tabs defaultValue="study" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="study">
              <BookOpen className="mr-2 h-4 w-4" />
              Módulo de Estudos
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>
          <Button 
            onClick={() => navigate(`/coach/student/${studentId}/create-cycle`)}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Ciclo para Aluno
          </Button>
        </div>

        {/* Aba: Módulo de Estudos (Read-Only) */}
        <TabsContent value="study">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Atividade de Estudos</CardTitle>
                  <CardDescription>Acesso read-only ao módulo de estudos</CardDescription>
                </div>
                <Button
                  onClick={() => setMessageModalOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Deixar mensagem
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ciclos Ativos */}
              <div>
                <h3 className="font-semibold mb-2">Ciclos Ativos</h3>
                {student.studyData?.study_cycles?.filter((c: any) => c.is_active).length > 0 ? (
                  <div className="space-y-2">
                    {student.studyData.study_cycles
                      .filter((cycle: any) => cycle.is_active)
                      .map((cycle: any) => (
                        <Card key={cycle.id} className="p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{cycle.cycle_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Prova: {new Date(cycle.exam_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/coach/student/${studentId}/cycle/${cycle.id}/schedule`)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Cronograma
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (confirm('Deseja realmente remover este ciclo?')) {
                                    // TODO: Implementar remoção do ciclo
                                    toast({
                                      title: 'Funcionalidade em desenvolvimento',
                                      description: 'A remoção de ciclos será implementada em breve.',
                                      variant: 'default'
                                    });
                                  }
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum ciclo de estudo ativo
                  </p>
                )}
              </div>

              {/* Última atividade */}
              {student.last_activity && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Última atividade: {new Date(student.last_activity).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Estatísticas (Read-Only) */}
        <TabsContent value="statistics">
          {loadingStats ? (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
                <CardDescription>Carregando estatísticas...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              </CardContent>
            </Card>
          ) : !fullStatistics || fullStatistics.totalHours === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
                <CardDescription>Nenhuma estatística disponível</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">O aluno ainda não tem estatísticas registradas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Card com estatísticas gerais */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Gerais</CardTitle>
                  <CardDescription>Visão completa do desempenho do aluno</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Grid de Cards de Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                      <p className="text-3xl font-bold">{fullStatistics.totalHours.toFixed(1)}h</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total de Sessões</p>
                      <p className="text-3xl font-bold">{fullStatistics.totalSessions}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Questões Respondidas</p>
                      <p className="text-3xl font-bold">{fullStatistics.questionsAnswered}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Taxa de Acertos</p>
                      <p className="text-3xl font-bold">
                        {fullStatistics.questionsAnswered > 0 
                          ? ((fullStatistics.correctAnswers / fullStatistics.questionsAnswered) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Detalhes de Questões */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Detalhes de Questões</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Acertos</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{fullStatistics.correctAnswers}</p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Erros</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{fullStatistics.wrongAnswers}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{fullStatistics.questionsAnswered}</p>
                      </div>
                    </div>
                  </div>

                  {/* Streaks */}
                  {fullStatistics.currentStreak > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sequências</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Sequência Atual</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fullStatistics.currentStreak} dias</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <p className="text-sm text-muted-foreground">Maior Sequência</p>
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{fullStatistics.longestStreak} dias</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribuição do Tempo por Disciplina */}
              {fullStatistics.subjectStats && Object.keys(fullStatistics.subjectStats).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição do Tempo por Disciplina</CardTitle>
                    <CardDescription>Horas estudadas por matéria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(fullStatistics.subjectStats).map(([subject, stats]: [string, any]) => {
                        const totalHours = stats.totalHours || 0;
                        const totalQuestions = stats.questionsAnswered || 0;
                        const correctAnswers = stats.correctAnswers || 0;
                        const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
                        
                        return (
                          <div key={subject} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="font-medium">{subject}</p>
                              <p className="text-sm text-muted-foreground">{totalHours.toFixed(1)}h</p>
                            </div>
                            <Progress value={(totalHours / fullStatistics.totalHours) * 100} className="h-2" />
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{stats.totalSessions || 0} sessões</span>
                              <span>{totalQuestions} questões</span>
                              {accuracyRate > 0 && <span>{accuracyRate.toFixed(1)}% acertos</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evolução da Taxa de Acerto */}
              {fullStatistics.sessionHistory && fullStatistics.sessionHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução da Taxa de Acerto</CardTitle>
                    <CardDescription>Histórico de performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex gap-4 items-center text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-muted-foreground">Acertos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-muted-foreground">Erros</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {fullStatistics.sessionHistory.slice(-10).reverse().map((session: any, index: number) => {
                          const sessionQuestions = session.questions || 0;
                          const sessionCorrect = session.correctAnswers || 0;
                          const accuracy = sessionQuestions > 0 ? (sessionCorrect / sessionQuestions) * 100 : 0;
                          
                          return (
                            <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-sm font-medium">{session.subject || 'Sessão'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(session.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span>{session.duration}min</span>
                                  {sessionQuestions > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-600">{sessionCorrect} certas</span>
                                      <span>•</span>
                                      <span className="text-red-600">{sessionQuestions - sessionCorrect} erradas</span>
                                      <span>•</span>
                                      <span className="font-medium">{accuracy.toFixed(0)}% acertos</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {sessionQuestions > 0 && (
                                <div className="w-16">
                                  <Progress 
                                    value={accuracy} 
                                    className="h-2"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notas do Coach */}
      {student.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{student.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Mensagem */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deixar Mensagem para o Aluno</DialogTitle>
            <DialogDescription>
              Envie uma mensagem de até 600 caracteres que aparecerá como notificação para o aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Digite sua mensagem aqui..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                maxLength={600}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Máximo de 600 caracteres</span>
                <span>{messageText.length}/600</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMessageModalOpen(false);
                setMessageText('');
              }}
              disabled={sendMessageMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || !messageText.trim()}
            >
              {sendMessageMutation.isPending ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDetailsPage;

