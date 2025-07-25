import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Target, BookOpen, BarChart3, Timer, CheckCircle2, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const EstudosDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center p-8">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Faça login para acessar seus estudos</h2>
            <p className="text-muted-foreground mb-4">
              Organize seu cronograma, acompanhe seu progresso e alcance seus objetivos.
            </p>
            <Link to="/auth">
              <Button>Fazer Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mock data - será substituído por dados reais do Supabase
  const todayProgress = 65;
  const weeklyProgress = 42;
  const dailyGoal = 4;
  const studiedToday = 2.6;
  const activeSubjects = 5;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Painel de Estudos</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e organize seus estudos</p>
      </div>

      {/* Cards de Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studiedToday}h</div>
            <p className="text-xs text-muted-foreground">de {dailyGoal}h meta diária</p>
            <Progress value={todayProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyProgress}%</div>
            <p className="text-xs text-muted-foreground">12.6h de 30h semanais</p>
            <Progress value={weeklyProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matérias Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubjects}</div>
            <p className="text-xs text-muted-foreground">disciplinas em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">de 4 sessões planejadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/estudos/cronograma">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma
              </CardTitle>
              <CardDescription>
                Visualize e edite seu cronograma de estudos
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/estudos/timer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Timer de Estudo
              </CardTitle>
              <CardDescription>
                Inicie uma sessão de estudos cronometrada
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/estudos/estatisticas">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </CardTitle>
              <CardDescription>
                Veja relatórios detalhados do seu progresso
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Próximas Sessões */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Próximas Sessões</CardTitle>
          <CardDescription>Suas próximas atividades de estudo programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock de próximas sessões */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Português</p>
                  <p className="text-sm text-muted-foreground">14:00 - 16:00</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Timer className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Matemática</p>
                  <p className="text-sm text-muted-foreground">16:30 - 18:00</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <Timer className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Link to="/estudos/cronograma">
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Nova Sessão
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstudosDashboard;