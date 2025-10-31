import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import { formatScore } from '@/lib/utils';

interface MonitoringData {
  totalUsers: number;
  onlineUsers: number;
  totalRankings: number;
  activeRankings: number;
  totalParticipations: number;
  averageScore: number;
  highestScore: number;
  recentActivity: number;
  userEngagement: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

const MonitoringMetrics: React.FC = () => {
  const { data: monitoringData, isLoading, error } = useQuery({
    queryKey: ['admin-monitoring-metrics'],
    queryFn: async (): Promise<MonitoringData> => {
      // Buscar dados de usuários
      const { count: totalUsers } = await supabase
        .from('users_profiles')
        .select('*', { count: 'exact', head: true });

      // Buscar dados de rankings
      const { count: totalRankings } = await supabase
        .from('concursos')
        .select('*', { count: 'exact', head: true });

      const { count: activeRankings } = await supabase
        .from('concursos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Em andamento');

      // Buscar dados de participações
      const { count: totalParticipations } = await supabase
        .from('user_rankings')
        .select('*', { count: 'exact', head: true });

      // Buscar usuários online (campo is_online = true)
      const { count: onlineUsers } = await supabase
        .from('users_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      // Buscar estatísticas de pontuação
      const { data: scoreData } = await supabase
        .from('user_rankings')
        .select('id')
        .not('id', 'is', null);

      const scores = scoreData || [];
      const averageScore = 0;
      const highestScore = 0;

      // Buscar atividade recente (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentActivity } = await supabase
        .from('user_rankings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());


      // Calcular engajamento do usuário (baseado em atividade recente)
      const userEngagement = totalUsers > 0 
        ? Math.round((recentActivity / totalUsers) * 100)
        : 0;

      // Determinar saúde do sistema
      let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (userEngagement < 10) systemHealth = 'critical';
      else if (userEngagement < 30) systemHealth = 'warning';

      return {
        totalUsers: totalUsers || 0,
        onlineUsers: onlineUsers || 0,
        totalRankings: totalRankings || 0,
        activeRankings: activeRankings || 0,
        totalParticipations: totalParticipations || 0,
        averageScore,
        highestScore,
        recentActivity: recentActivity || 0,
        userEngagement,
        systemHealth
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000, // Considerar dados obsoletos após 10 segundos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Monitoramento
          </CardTitle>
          <CardDescription>Carregando dados do sistema...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas de Monitoramento
          </CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar métricas do sistema
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Usuários Online',
      value: monitoringData?.onlineUsers || 0,
      description: 'Usuários conectados no momento',
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-500'
    },
    {
      title: 'Engajamento',
      value: `${monitoringData?.userEngagement || 0}%`,
      description: 'Usuários ativos nas últimas 24h',
      icon: <Activity className="h-5 w-5" />,
      color: monitoringData?.userEngagement > 30 ? 'text-green-500' : 
             monitoringData?.userEngagement > 10 ? 'text-yellow-500' : 'text-red-500'
    }
  ];

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSystemHealthText = (health: string) => {
    switch (health) {
      case 'healthy': return 'Saudável';
      case 'warning': return 'Atenção';
      case 'critical': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saúde do Sistema</p>
              <p className={`text-2xl font-bold ${getSystemHealthColor(monitoringData?.systemHealth || 'unknown')}`}>
                {getSystemHealthText(monitoringData?.systemHealth || 'unknown')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={metric.color}>
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <CardDescription className="text-xs">{metric.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Usuários Online</span>
              <span className="font-medium text-green-600">{monitoringData?.onlineUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pontuação Média</span>
              <span className="font-medium">{formatScore(monitoringData?.averageScore || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Maior Pontuação</span>
              <span className="font-medium text-blue-600">{formatScore(monitoringData?.highestScore || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de Participações</span>
              <span className="font-medium text-purple-600">{monitoringData?.totalParticipations || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Participações (24h)</span>
              <span className="font-medium">{monitoringData?.recentActivity || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total de Rankings</span>
              <span className="font-medium">{monitoringData?.totalRankings || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Taxa de Engajamento</span>
              <span className={`font-medium ${
                (monitoringData?.userEngagement || 0) > 30 ? 'text-green-600' : 
                (monitoringData?.userEngagement || 0) > 10 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {monitoringData?.userEngagement || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status do Sistema</span>
              <span className={`font-medium ${getSystemHealthColor(monitoringData?.systemHealth || 'unknown')}`}>
                {getSystemHealthText(monitoringData?.systemHealth || 'unknown')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringMetrics;
