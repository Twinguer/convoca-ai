import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NotificationManager } from '@/components/Admin/NotificationManager';
import MonitoringMetrics from '@/components/Admin/MonitoringMetrics';
import { SubjectiveCleanup } from '@/components/Admin/SubjectiveCleanup';
import { ScoreFix } from '@/components/Admin/ScoreFix';

const AdminDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [activeConcursos, setActiveConcursos] = useState(0);

  const {
    data: activeConcursosData,
    isLoading
  } = useQuery({
    queryKey: ['admin-active-concursos'],
    queryFn: async () => {
      const {
        count: activeCount
      } = await supabase.from('concursos').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'Em andamento');
      
      return {
        activeConcursos: activeCount || 0
      };
    }
  });

  useEffect(() => {
    const fetchUserCount = async () => {
      const {
        count
      } = await supabase.from('users_profiles').select('*', {
        count: 'exact',
        head: true
      });
      setUserCount(count || 0);
    };
    fetchUserCount();

    const channel = supabase.channel('users_profiles_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users_profiles'
    }, () => fetchUserCount()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeConcursosData) {
      setActiveConcursos(activeConcursosData.activeConcursos);
    }
  }, [activeConcursosData]);
  
  const dashboardCards = [{
    title: 'Rankings Ativos',
    value: isLoading ? '...' : activeConcursos.toString(),
    description: 'Em andamento',
    icon: <Building className="h-6 w-6 text-amber-500" />
  }, {
    title: 'Total de Participantes',
    value: isLoading ? '...' : userCount.toString(),
    description: 'Usuários registrados',
    icon: <User className="h-6 w-6 text-purple-500" />
  }];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
        {dashboardCards.map((card, index) => <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-md font-medium">{card.title}</CardTitle>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <CardDescription>{card.description}</CardDescription>
            </CardContent>
          </Card>)}
      </div>

      {/* Métricas de Monitoramento */}
      <div className="mb-8">
        <MonitoringMetrics />
      </div>

      {/* Gerenciador de Notificações */}
      <div className="mb-8">
        <NotificationManager />
      </div>

      {/* Limpeza de Subjetivas Removidas */}
      <div className="mb-8">
        <SubjectiveCleanup />
      </div>

      {/* Correção de Pontuações */}
      <div className="mb-8">
        <ScoreFix />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/criar-ranking" className="block p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">Cadastrar Novo Ranking</a>
            <a href="/project/admin/man/concursos" className="block p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">Gerenciar Rankings</a>
            <a href="/project/admin/man/usuarios" className="block p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">Gerenciar Usuários</a>
            <a href="/project/admin/man/vouchers" className="block p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">Gerenciar Vouchers</a>
            <a href="/?admin=true" target="_blank" className="block p-3 bg-muted hover:bg-muted/80 rounded-md transition-colors">Visualizar Site (Admin)</a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Última atualização</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-500 dark:text-green-400 font-medium">Operacional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;