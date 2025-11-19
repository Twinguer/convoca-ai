import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, BookOpen, TrendingUp, Plus, Play, CheckCircle, AlertCircle, Trash2, Edit, FileText, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserStudyService } from '@/services/userStudyService';
import { useSecureStudyCycleUrls } from '@/services/studyCycleUrlObfuscation';
import { StudyCycleV2 } from '@/types/userStudy';
import { logger } from '@/utils/logger';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
interface StudyCycleProgress {
  cycle: StudyCycleV2;
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
  const {
    toast
  } = useToast();
  const { generateSecureUrl } = useSecureStudyCycleUrls();
  const [studyCycles, setStudyCycles] = useState<StudyCycleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchStudyCycles();
    }
  }, [user]);
  const fetchStudyCycles = async () => {
    try {
      const startTime = performance.now();
      logger.debug('Buscando ciclos ativos', 'Dashboard', { userId: user?.id });
      
      const userStudyData = await UserStudyService.getUserStudyData(user?.id);
      
      const cycles = userStudyData?.study_cycles.filter(cycle => cycle.is_active) || [];
      logger.debug('Ciclos ativos encontrados', 'Dashboard', { 
        count: cycles.length,
        cycles: cycles.map(c => ({ id: c.id, name: c.cycle_name }))
      });
      
      if (!cycles || cycles.length === 0) {
        logger.warn('Nenhum ciclo ativo encontrado');
        setStudyCycles([]);
        setLoading(false);
        return;
      }
      const cycleProgressData: StudyCycleProgress[] = cycles.map(cycle => {
        const today = new Date();
        const examDate = new Date(cycle.exam_date);
        const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate progress from schedule_data sessions
        let totalDisciplines = 0;
        let completedDisciplines = 0;
        let totalStudyTime = 0;
        
        // Extrair disciplinas únicas das sessões
        const disciplines = new Set<string>();
        cycle.schedule_data.weekly_schedule.forEach(daySchedule => {
          daySchedule.sessions.forEach(session => {
            if (session.discipline_name) {
              disciplines.add(session.discipline_name);
              totalStudyTime += session.total_stats?.total_duration_minutes || 0;
              if (session.total_stats?.total_duration_minutes > 0) {
                completedDisciplines++;
              }
            }
          });
        });
        
        totalDisciplines = disciplines.size;
        const progressPercentage = totalDisciplines > 0 ? (completedDisciplines / totalDisciplines) * 100 : 0;
        
        return {
          cycle,
          totalDisciplines,
          completedDisciplines,
          totalStudyTime: totalStudyTime / 60, // Converter minutos para horas
          daysUntilExam,
          progressPercentage
        };
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      logger.info('Ciclos ativos carregados', 'Dashboard', { 
        count: cycleProgressData.length,
        loadTime: `${loadTime.toFixed(2)}ms`,
        fromCache: loadTime < 50 // Se carregou em menos de 50ms, provavelmente veio do cache
      });
      
      setStudyCycles(cycleProgressData);
    } catch (error) {
      logger.error('Erro ao buscar ciclos ativos', error);
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
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
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
      disciplinesProgress: totalDisciplines > 0 ? totalCompletedDisciplines / totalDisciplines * 100 : 0,
      timeProgress: studyCycles.reduce((sum, data) => sum + data.totalStudyTime, 0)
    };
  };
  const {
    disciplinesProgress,
    timeProgress
  } = calculateOverallProgress();
  return <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ciclos de Estudos</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e organize seus estudos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/estudos/cronograma">
            <Button variant="outline" className="w-full sm:w-auto">
              <Calendar className="h-4 w-4 mr-2" />
              Cronograma
            </Button>
          </Link>
          <Link to="/estudos/timer">
            <Button variant="outline" className="w-full sm:w-auto">
              <Clock className="h-4 w-4 mr-2" />
              Timer
            </Button>
          </Link>
          <Link to="/estudos/criar-ciclo">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Criar Ciclo de Estudos
            </Button>
          </Link>
        </div>
      </div>

      {studyCycles.length === 0 ? <Card>
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
        </Card> : <>
          {/* Overall Progress Cards */}
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-[5px]">
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
                <CardTitle className="text-sm font-medium">Status dos Concursos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inscrição Paga</span>
                    <Checkbox />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Passagens Pagas</span>
                    <Checkbox />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hospedagem Paga</span>
                    <Checkbox />
                  </div>
                </div>
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
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Seus Ciclos de Estudos</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {studyCycles.map(data => <StudyCycleCard key={data.cycle.id} cycleProgress={data} onStartSession={() => navigate(`/estudos/cronograma`)} onViewEdital={async () => {
                try {
                  const secureUrl = await generateSecureUrl(data.cycle.id, user?.id || '', 'session');
                  navigate(secureUrl);
                } catch (error) {
                  devLog.error('Erro ao gerar URL segura:', error);
                  navigate('/estudos');
                }
              }} onDelete={async () => {
                try {
                  await UserStudyService.updateCycle(user?.id, data.cycle.id, { is_active: false });
                  toast({ title: 'Ciclo excluído com sucesso!' });
                  fetchStudyCycles();
                } catch (error) {
                  devLog.error('Erro ao excluir ciclo:', error);
                  toast({ title: 'Erro ao excluir ciclo', variant: 'destructive' });
                }
              }} />)}
            </div>
          </div>
        </>}

      {/* Study Status Sections */}
      <div className="mt-4 space-y-3">
        

        <div>
          
          
        </div>
      </div>


    </div>;
};
interface StudyCycleCardProps {
  cycleProgress: StudyCycleProgress;
  onStartSession: () => void;
  onViewEdital: () => void;
  onDelete: () => void;
}
const StudyCycleCard: React.FC<StudyCycleCardProps> = ({
  cycleProgress,
  onStartSession,
  onViewEdital,
  onDelete
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
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{cycle.cycle_name}</CardTitle>
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

        {/* Sessions Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Tarefas de Estudo</h4>
          <div className="space-y-1">
            {(() => {
              // Agrupar sessões por bloco
              const blockStats = new Map<string, { total: number, completed: number }>();
              
              cycle.schedule_data.weekly_schedule.forEach(daySchedule => {
                daySchedule.sessions.forEach(session => {
                  if (session.block_name) {
                    const current = blockStats.get(session.block_name) || { total: 0, completed: 0 };
                    current.total++;
                    if (session.total_stats?.total_duration_minutes > 0) {
                      current.completed++;
                    }
                    blockStats.set(session.block_name, current);
                  }
                });
              });
              
              return Array.from(blockStats.entries()).map(([blockName, stats], index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{blockName}</span>
                  <span>{stats.completed}/{stats.total}</span>
                </div>
              ));
            })()}
          </div>
        </div>


        {/* Actions */}
        <div className="space-y-2">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onStartSession} size="sm" className="w-full sm:w-auto">
              <Play className="h-4 w-4 mr-2" />
              Iniciar Sessão
            </Button>
            <Button 
              onClick={onDelete} 
              variant="destructive" 
              size="sm" 
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button onClick={onViewEdital} variant="default" className="bg-success hover:bg-success/90 text-success-foreground flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Edital
            </Button>
            <Button 
              variant="outline" 
              className="w-full flex-1"
              onClick={async () => {
                if (!user?.id) return;
                try {
                  const secureUrl = await generateSecureUrl(cycle.id, user.id, 'edit');
                  navigate(secureUrl);
                } catch (error) {
                  devLog.error('Erro ao gerar URL segura:', error);
                  // Fallback apenas em caso de erro crítico
                  navigate(`/estudos/editar-ciclo/${cycle.id}`);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default EstudosDashboard;