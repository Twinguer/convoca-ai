import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, BookOpen, TrendingUp, Plus, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
interface StudyContest {
  id: string;
  title: string;
  description: string;
  exam_date: string;
  is_active: boolean;
  created_at: string;
}
interface StudySubject {
  id: string;
  name: string;
  block_name: string;
  estimated_hours: number;
  completed_hours: number;
  is_completed: boolean;
  study_contest_id: string;
}
interface StudyProgress {
  contest: StudyContest;
  subjects: StudySubject[];
  totalEstimatedHours: number;
  totalCompletedHours: number;
  completedSubjects: number;
  daysUntilExam: number;
}
const EstudosDashboard = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [studyData, setStudyData] = useState<StudyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchStudyData();
    }
  }, [user]);
  const fetchStudyData = async () => {
    try {
      // Fetch active study contests
      const {
        data: contests,
        error: contestsError
      } = await supabase.from('study_contests').select('*').eq('user_id', user?.id).eq('is_active', true).order('exam_date', {
        ascending: true
      });
      if (contestsError) throw contestsError;
      if (!contests || contests.length === 0) {
        setStudyData([]);
        setLoading(false);
        return;
      }

      // Fetch subjects for each contest
      const studyProgressData: StudyProgress[] = [];
      for (const contest of contests) {
        const {
          data: subjects,
          error: subjectsError
        } = await supabase.from('study_subjects').select('*').eq('study_contest_id', contest.id).eq('is_active', true);
        if (subjectsError) throw subjectsError;
        const totalEstimatedHours = subjects?.reduce((sum, subject) => sum + (subject.estimated_hours || 0), 0) || 0;
        const totalCompletedHours = subjects?.reduce((sum, subject) => sum + (subject.completed_hours || 0), 0) || 0;
        const completedSubjects = subjects?.filter(subject => subject.is_completed).length || 0;
        const today = new Date();
        const examDate = new Date(contest.exam_date);
        const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        studyProgressData.push({
          contest,
          subjects: subjects || [],
          totalEstimatedHours,
          totalCompletedHours,
          completedSubjects,
          daysUntilExam
        });
      }
      setStudyData(studyProgressData);
    } catch (error) {
      console.error('Error fetching study data:', error);
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
    if (studyData.length === 0) return {
      hoursProgress: 0,
      subjectsProgress: 0
    };
    const totalEstimated = studyData.reduce((sum, data) => sum + data.totalEstimatedHours, 0);
    const totalCompleted = studyData.reduce((sum, data) => sum + data.totalCompletedHours, 0);
    const totalSubjects = studyData.reduce((sum, data) => sum + data.subjects.length, 0);
    const totalCompletedSubjects = studyData.reduce((sum, data) => sum + data.completedSubjects, 0);
    return {
      hoursProgress: totalEstimated > 0 ? totalCompleted / totalEstimated * 100 : 0,
      subjectsProgress: totalSubjects > 0 ? totalCompletedSubjects / totalSubjects * 100 : 0
    };
  };
  const {
    hoursProgress,
    subjectsProgress
  } = calculateOverallProgress();
  return <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">CICLO DE ESTUDOS</h1>
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

      {studyData.length === 0 ? <Card>
          <CardContent className="text-center p-8">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum concurso de estudo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro concurso de estudo para começar a organizar seus estudos
            </p>
            <Link to="/estudos/criar-concurso">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Concurso
              </Button>
            </Link>
          </CardContent>
        </Card> : <>
          {/* Overall Progress Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso Geral (Horas)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hoursProgress.toFixed(1)}%</div>
                <Progress value={hoursProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disciplinas Concluídas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subjectsProgress.toFixed(1)}%</div>
                <Progress value={subjectsProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concursos Ativos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studyData.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  concursos em andamento
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
                  {Math.min(...studyData.map(d => d.daysUntilExam).filter(d => d >= 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  dias restantes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Study Contests */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Seus Concursos</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {studyData.map(data => <StudyContestCard key={data.contest.id} studyProgress={data} onStartSession={() => navigate(`/estudos/timer?contest=${data.contest.id}`)} />)}
            </div>
          </div>
        </>}

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
interface StudyContestCardProps {
  studyProgress: StudyProgress;
  onStartSession: () => void;
}
const StudyContestCard: React.FC<StudyContestCardProps> = ({
  studyProgress,
  onStartSession
}) => {
  const {
    contest,
    subjects,
    totalEstimatedHours,
    totalCompletedHours,
    completedSubjects,
    daysUntilExam
  } = studyProgress;
  const progressPercentage = totalEstimatedHours > 0 ? totalCompletedHours / totalEstimatedHours * 100 : 0;
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
  const blockGroups = subjects.reduce((groups, subject) => {
    const blockName = subject.block_name || 'Sem bloco';
    if (!groups[blockName]) {
      groups[blockName] = [];
    }
    groups[blockName].push(subject);
    return groups;
  }, {} as Record<string, StudySubject[]>);
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{contest.title}</CardTitle>
            <CardDescription className="mt-1">
              {contest.description}
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
            <span>{totalCompletedHours}h / {totalEstimatedHours}h</span>
            <span>{completedSubjects} / {subjects.length} disciplinas</span>
          </div>
        </div>

        {/* Blocks Overview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Blocos de Estudo</h4>
          <div className="space-y-1">
            {Object.entries(blockGroups).map(([blockName, blockSubjects]) => {
            const completedInBlock = blockSubjects.filter(s => s.is_completed).length;
            return <div key={blockName} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{blockName}</span>
                  <span>{completedInBlock}/{blockSubjects.length}</span>
                </div>;
          })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onStartSession} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Sessão
          </Button>
          <Link to={`/estudos/concurso/${contest.id}`}>
            <Button variant="outline">
              <BookOpen className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>;
};
export default EstudosDashboard;