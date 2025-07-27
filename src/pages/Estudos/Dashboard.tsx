import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, BookOpen, TrendingUp, Plus, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
interface StudyCycle {
  id: string;
  name: string;
  organ: string;
  position: string;
  exam_date: string;
  is_active: boolean;
  blocks: any[];
  created_at: string;
  updated_at: string;
}

interface StudyCycleProgress {
  cycle: StudyCycle;
  totalDisciplines: number;
  completedDisciplines: number;
  totalStudyTime: number;
  daysUntilExam: number;
  progressPercentage: number;
}
const EstudosDashboard = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [studyCycles, setStudyCycles] = useState<StudyCycleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchStudyCycles();
    }
  }, [user]);
  const fetchStudyCycles = async () => {
    try {
      const { data: cycles, error } = await supabase
        .from('study_cycles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('exam_date', { ascending: true });

      if (error) throw error;

      if (!cycles || cycles.length === 0) {
        setStudyCycles([]);
        setLoading(false);
        return;
      }

      const cycleProgressData: StudyCycleProgress[] = cycles.map(cycle => {
        const today = new Date();
        const examDate = new Date(cycle.exam_date);
        const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate progress from blocks and disciplines
        let totalDisciplines = 0;
        let completedDisciplines = 0;
        let totalStudyTime = 0;

        cycle.blocks?.forEach((block: any) => {
          block.disciplines?.forEach((discipline: any) => {
            totalDisciplines++;
            totalStudyTime += discipline.studyTime || 0;
            if (discipline.isCompleted) {
              completedDisciplines++;
            }
          });
        });

        const progressPercentage = totalDisciplines > 0 ? (completedDisciplines / totalDisciplines) * 100 : 0;

        return {
          cycle,
          totalDisciplines,
          completedDisciplines,
          totalStudyTime,
          daysUntilExam,
          progressPercentage
        };
      });

      setStudyCycles(cycleProgressData);
    } catch (error) {
      console.error('Error fetching study cycles:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!user) {
    return <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Área de Estudos</h1>
        <p className="text-muted-foreground mb-6">
          Faça login para acessar suas ferramentas de estudo
        </p>
        <Link to="/auth">
          <Button>Fazer Login</Button>
        </Link>
      </div>;
  }
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>;
  }
  const calculateOverallProgress = () => {
    if (studyCycles.length === 0) return {
      disciplinesProgress: 0,
      timeProgress: 0
    };
    
    const totalDisciplines = studyCycles.reduce((sum, data) => sum + data.totalDisciplines, 0);
    const totalCompletedDisciplines = studyCycles.reduce((sum, data) => sum + data.completedDisciplines, 0);
    
    return {
      disciplinesProgress: totalDisciplines > 0 ? (totalCompletedDisciplines / totalDisciplines) * 100 : 0,
      timeProgress: studyCycles.reduce((sum, data) => sum + data.totalStudyTime, 0)
    };
  };
  
  const { disciplinesProgress, timeProgress } = calculateOverallProgress();
  return <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ciclos de Estudos</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e organize seus estudos</p>
        </div>
        <div className="flex gap-2">
          <Link to="/estudos/cronograma">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Cronograma
            </Button>
          </Link>
          <Link to="/estudos/timer">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Timer
            </Button>
          </Link>
          <Link to="/estudos/criar-ciclo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Ciclo de Estudos
            </Button>
          </Link>
        </div>
      </div>

      {studyCycles.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ciclo de estudo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro ciclo de estudos para começar a organizar seus estudos
            </p>
            <Link to="/estudos/criar-ciclo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Ciclo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Progress Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disciplinas Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{disciplinesProgress.toFixed(1)}%</div>
                <Progress value={disciplinesProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Total Estudado</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timeProgress.toFixed(0)}h</div>
                <p className="text-xs text-muted-foreground mt-2">
                  horas registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ciclos Ativos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studyCycles.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  ciclos em andamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próxima Prova</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studyCycles.length > 0 ? Math.min(...studyCycles.map(d => d.daysUntilExam).filter(d => d >= 0)) : 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  dias restantes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Study Cycles */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Seus Ciclos de Estudos</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {studyCycles.map(data => (
                <StudyCycleCard 
                  key={data.cycle.id} 
                  cycleProgress={data} 
                  onStartSession={() => navigate(`/estudos/timer?cycle=${data.cycle.id}`)} 
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/estudos/cronograma">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Cronograma</h3>
                <p className="text-sm text-muted-foreground">
                  Organize sua rotina de estudos
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/estudos/timer">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Clock className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Timer de Estudo</h3>
                <p className="text-sm text-muted-foreground">
                  Cronometr e registre suas sessões
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/estudos/estatisticas">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Estatísticas</h3>
                <p className="text-sm text-muted-foreground">
                  Analise seu desempenho
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>;
};
interface StudyCycleCardProps {
  cycleProgress: StudyCycleProgress;
  onStartSession: () => void;
}

const StudyCycleCard: React.FC<StudyCycleCardProps> = ({
  cycleProgress,
  onStartSession
}) => {
  const {
    cycle,
    totalDisciplines,
    completedDisciplines,
    totalStudyTime,
    daysUntilExam,
    progressPercentage
  } = cycleProgress;

  const getDateStatus = () => {
    if (daysUntilExam < 0) return {
      color: 'destructive',
      text: 'Prova passou'
    };
    if (daysUntilExam === 0) return {
      color: 'default',
      text: 'Prova hoje!'
    };
    if (daysUntilExam <= 7) return {
      color: 'destructive',
      text: `${daysUntilExam} dias`
    };
    if (daysUntilExam <= 30) return {
      color: 'secondary',
      text: `${daysUntilExam} dias`
    };
    return {
      color: 'default',
      text: `${daysUntilExam} dias`
    };
  };

  const dateStatus = getDateStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{cycle.name}</CardTitle>
            <CardDescription className="mt-1">
              {cycle.organ} - {cycle.position}
            </CardDescription>
          </div>
          <Badge variant={dateStatus.color as any}>
            {dateStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso Geral</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalStudyTime}h estudadas</span>
            <span>{completedDisciplines} / {totalDisciplines} disciplinas</span>
          </div>
        </div>

        {/* Blocks Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Blocos de Estudo</h4>
          <div className="space-y-1">
            {cycle.blocks?.map((block: any, index: number) => {
              const completedInBlock = block.disciplines?.filter((d: any) => d.isCompleted).length || 0;
              const totalInBlock = block.disciplines?.length || 0;
              return (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{block.name}</span>
                  <span>{completedInBlock}/{totalInBlock}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onStartSession} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Sessão
          </Button>
          <Link to={`/estudos/ciclo/${cycle.id}`}>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
export default EstudosDashboard;