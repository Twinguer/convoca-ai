import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calendar, User, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const AdminDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [recentConcursos, setRecentConcursos] = useState(0);
  const [activeConcursos, setActiveConcursos] = useState(0);

  // Fetch concursos count and other stats
  const {
    data: statsData,
    isLoading
  } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // Get concursos count
      const {
        count: concursosCount
      } = await supabase.from('concursos').select('*', {
        count: 'exact',
        head: true
      });

      // Get concursos added in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const {
        count: recentCount
      } = await supabase.from('concursos').select('*', {
        count: 'exact',
        head: true
      }).gte('created_at', thirtyDaysAgo.toISOString());

      // Get active concursos
      const {
        count: activeCount
      } = await supabase.from('concursos').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'Em andamento');
      return {
        concursosCount: concursosCount || 0,
        recentConcursos: recentCount || 0,
        activeConcursos: activeCount || 0
      };
    }
  });

  // Set up real-time subscription for user count updates
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

    // Subscribe to changes in the users_profiles table
    const channel = supabase.channel('users_profiles_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users_profiles'
    }, () => fetchUserCount()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update state from query results
  useEffect(() => {
    if (statsData) {
      setRecentConcursos(statsData.recentConcursos);
      setActiveConcursos(statsData.activeConcursos);
    }
  }, [statsData]);
  const dashboardCards = [{
    title: 'Total de Concursos',
    value: isLoading ? '...' : statsData?.concursosCount.toString(),
    description: 'Concursos cadastrados',
    icon: <FileText className="h-6 w-6 text-blue-500" />
  }, {
    title: 'Concursos Recentes',
    value: isLoading ? '...' : recentConcursos.toString(),
    description: 'Adicionados nos últimos 30 dias',
    icon: <Calendar className="h-6 w-6 text-green-500" />
  }, {
    title: 'Concursos Ativos',
    value: isLoading ? '...' : activeConcursos.toString(),
    description: 'Em andamento',
    icon: <Building className="h-6 w-6 text-amber-500" />
  }, {
    title: 'Total de Participantes',
    value: isLoading ? '...' : userCount.toString(),
    description: 'Usuários registrados',
    icon: <User className="h-6 w-6 text-purple-500" />
  }];
  return <div>
      <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/project/admin/man/concursos/novo" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md">Cadastrar Novo Ranking</a>
            <a href="/project/admin/man/concursos" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md">Gerenciar Rankings</a>
            <a href="/" target="_blank" className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md">Visualizar Site</a>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Detalhes do sistema ConvocAI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Última atualização</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Status</span>
                <span className="text-green-500 font-medium">Operacional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminDashboard;