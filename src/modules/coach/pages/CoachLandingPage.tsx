import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  Target, 
  BarChart3,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

// Dados fictícios dos alunos (mantidos para marketing)
const mockStudentData = [
  { name: 'Ana Silva', hours: 42, tasks: 156, accuracy: 87, status: 'Ativo' },
  { name: 'Carlos Oliveira', hours: 38, tasks: 142, accuracy: 82, status: 'Ativo' },
  { name: 'Maria Santos', hours: 45, tasks: 168, accuracy: 91, status: 'Ativo' },
  { name: 'João Pereira', hours: 35, tasks: 128, accuracy: 79, status: 'Ativo' },
  { name: 'Fernanda Costa', hours: 40, tasks: 152, accuracy: 85, status: 'Ativo' },
  { name: 'Ricardo Alves', hours: 33, tasks: 118, accuracy: 76, status: 'Ativo' },
  { name: 'Juliana Lima', hours: 48, tasks: 175, accuracy: 89, status: 'Ativo' },
  { name: 'Pedro Souza', hours: 36, tasks: 135, accuracy: 81, status: 'Ativo' },
  { name: 'Larissa Ferreira', hours: 44, tasks: 162, accuracy: 88, status: 'Ativo' },
  { name: 'Bruno Rodrigues', hours: 39, tasks: 148, accuracy: 84, status: 'Ativo' },
];

const CoachLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Verificar se o usuário já tem assinatura
  const { data: subscription } = useQuery({
    queryKey: ['coach-subscription-landing', user?.id],
    queryFn: () => coachSubscriptionService.getCoachSubscription(user!.id),
    enabled: !!user,
  });

  // Buscar fotos reais dos usuários cadastrados
  const { data: realUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['landing-page-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url')
        .not('avatar_url', 'is', null)
        .limit(20)
        .order('created_at', { ascending: false });

      if (error) {
        devLog.error('Erro ao buscar usuários:', error);
        return [];
      }

      return data || [];
    },
  });

  // Combinar dados fictícios com fotos reais
  const studentsWithRealPhotos = useMemo(() => {
    if (!realUsers || realUsers.length === 0) {
      // Fallback: usar dados fictícios com avatares gerados
      return mockStudentData.map((student, index) => ({
        ...student,
        id: index + 1,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
      }));
    }

    // Combinar dados fictícios com fotos reais
    return mockStudentData.map((student, index) => {
      const realUser = realUsers[index % realUsers.length];
      return {
        ...student,
        id: realUser?.id || `mock-${index + 1}`,
        avatar: realUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`,
      };
    });
  }, [realUsers]);

  // Estatísticas agregadas
  const totalHours = studentsWithRealPhotos.reduce((sum, s) => sum + s.hours, 0);
  const totalTasks = studentsWithRealPhotos.reduce((sum, s) => sum + s.tasks, 0);
  const avgAccuracy = Math.round(studentsWithRealPhotos.reduce((sum, s) => sum + s.accuracy, 0) / studentsWithRealPhotos.length);
  const activeStudents = studentsWithRealPhotos.filter(s => s.status === 'Ativo').length;

  // Redirecionar para dashboard se já tiver assinatura
  useEffect(() => {
    if (subscription && user) {
      navigate('/coach/dashboard', { replace: true });
    }
  }, [subscription, user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/coach/subscription');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-500/50 dark:shadow-purple-900/50 mb-6 border-2 border-purple-400/30 dark:border-purple-500/30">
            <GraduationCap className="h-6 w-6" />
            <span>Modo Coach</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-purple-600 dark:text-purple-400 drop-shadow-lg shadow-purple-500/50 dark:shadow-purple-400/50">
            Transforme o Sucesso dos Seus Alunos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Gerencie uma equipe de alunos, acompanhe o progresso em tempo real e alcance resultados extraordinários juntos.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Título Coach Dashboard */}
        <div className="text-left mb-8">
          <h2 className="text-4xl font-bold mb-2">Coach Dashboard</h2>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total de Alunos</CardDescription>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-4xl font-bold text-primary">{activeStudents}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Horas Estudadas</CardDescription>
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-4xl font-bold text-green-600">{totalHours}h</CardTitle>
              <CardDescription className="text-xs mt-2">Esta semana</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Tarefas Completadas</CardDescription>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-4xl font-bold text-blue-600">{totalTasks}</CardTitle>
              <CardDescription className="text-xs mt-2">Total registrado</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Taxa de Acerto</CardDescription>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-4xl font-bold text-purple-600">{avgAccuracy}%</CardTitle>
              <CardDescription className="text-xs mt-2">Média geral</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Seção de Alunos */}
        <Card className="mb-12">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold mb-2">Meus Alunos</CardTitle>
                <CardDescription className="text-lg">
                  10 alunos cadastrados
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {activeStudents} Alunos Ativos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {studentsWithRealPhotos.map((student) => (
                <Card 
                  key={student.id}
                  className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30"
                >
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-3 border-2 border-primary/20 shadow-lg">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold text-lg">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-base mb-2">{student.name}</h3>
                    <Badge variant={student.status === 'Ativo' ? 'default' : 'secondary'} className="mb-3">
                      {student.status}
                    </Badge>
                    <div className="space-y-2 w-full">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Horas
                        </span>
                        <span className="font-bold text-primary">{student.hours}h</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Tarefas
                        </span>
                        <span className="font-bold text-green-600">{student.tasks}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Acerto
                        </span>
                        <span className="font-bold text-purple-600">{student.accuracy}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Acompanhamento em Tempo Real</CardTitle>
              <CardDescription>
                Monitore horas estudadas, tarefas completadas e taxa de acerto de cada aluno em tempo real.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Comunicação Direta</CardTitle>
              <CardDescription>
                Envie mensagens personalizadas para alunos individuais ou para toda a equipe com um clique.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Gestão Completa</CardTitle>
              <CardDescription>
                Crie ciclos de estudos, gerencie cronogramas e acompanhe o progresso de todos os seus alunos em um só lugar.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoachLandingPage;
