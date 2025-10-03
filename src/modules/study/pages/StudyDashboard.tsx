import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, BookOpen, Calendar, Clock, Target, TrendingUp, Users, Plus, PlayCircle, Timer, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';

interface StudyCycle {
  id: string;
  name: string;
  exam_date: string;
  is_active: boolean;
  organ: string;
  position: string;
  blocks: any[];
}

const StudyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { statistics, isLoading } = useStudyStatistics();
  const [cycles, setCycles] = useState<StudyCycle[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<any[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);

  useEffect(() => {
    if (user) {
      loadStudyCycles();
      loadUpcomingSchedule();
    }
  }, [user]);

  const loadStudyCycles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('study_cycles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading study cycles:', error);
        return;
      }

      setCycles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadUpcomingSchedule = async () => {
    if (!user) return;

    try {
      const today = new Date().getDay();
      const { data, error } = await supabase
        .from('study_schedule')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('day_of_week', today)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error loading schedule:', error);
        return;
      }

      setUpcomingSchedule(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1) + 'h';
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayNumber];
  };

  const getNextExamDate = () => {
    if (cycles.length === 0) return null;
    const upcomingExams = cycles
      .filter(cycle => new Date(cycle.exam_date) > new Date())
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    return upcomingExams[0];
  };

  const nextExam = getNextExamDate();
  const daysUntilExam = nextExam ? Math.ceil((new Date(nextExam.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Estudos</h1>
          <p className="text-muted-foreground">
            Gerencie seus estudos, acompanhe seu progresso e mantenha-se organizado
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/estudos/criar-ciclo')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Ciclo
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Estudadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(statistics.totalHours)}</div>
            <p className="text-xs text-muted-foreground">
              Total acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Sessões realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Prova</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daysUntilExam ? `${daysUntilExam}d` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextExam ? nextExam.position : 'Nenhuma prova cadastrada'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-px mb-8">
        {/* Active Cycles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Ciclos Ativos
            </CardTitle>
            <CardDescription>
              Seus ciclos de estudo em andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCycles ? (
              <div className="text-center p-8">
                <div className="text-muted-foreground">Carregando ciclos...</div>
              </div>
            ) : cycles.length > 0 ? (
              <div className="space-y-4">
                {cycles.slice(0, 3).map((cycle) => (
                <div key={cycle.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{cycle.name}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">{cycle.organ}</span>
                      <Badge variant="outline" className="w-fit">{cycle.position}</Badge>
                      <span className="text-sm text-muted-foreground">
                        Prova: {new Date(cycle.exam_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/estudos/ciclo/${cycle.id}`)} className="w-full sm:w-auto">
                      Disciplinas
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      onClick={() => navigate('/estudos/cronograma')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Iniciar Sessão
                    </Button>
                  </div>
                </div>
                ))}
                {cycles.length === 0 && (
                  <div className="text-center p-8">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum ciclo ativo</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie seu primeiro ciclo de estudos para começar a se organizar
                    </p>
                    <Button onClick={() => navigate('/estudos/criar-ciclo')}>
                      Criar Primeiro Ciclo
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum ciclo ativo</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro ciclo de estudos para começar a se organizar
                </p>
                <Button onClick={() => navigate('/estudos/criar-ciclo')}>
                  Criar Primeiro Ciclo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Schedule */}
      {upcomingSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Sessões
            </CardTitle>
            <CardDescription>
              Suas próximas sessões de estudo programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedule.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-foreground">
                      {session.discipline_name || session.block_name || 'Sessão de Estudo'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getDayName(session.day_of_week)} • {session.start_time} - {session.end_time}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {getDayName(session.day_of_week)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Footer />
    </div>
  );
};

export default StudyDashboard;