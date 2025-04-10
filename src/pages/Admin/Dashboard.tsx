
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calendar, User, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard: React.FC = () => {
  // Fetch concursos count
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const { count: concursosCount } = await supabase
        .from('concursos')
        .select('*', { count: 'exact', head: true });
      
      return {
        concursosCount: concursosCount || 0,
        recentConcursos: 0, // In a real app, this would be calculated
        activeConcursos: 0, // In a real app, this would be calculated
        totalParticipants: 0 // In a real app, this would be calculated
      };
    }
  });

  const dashboardCards = [
    {
      title: 'Total de Concursos',
      value: isLoading ? '...' : statsData?.concursosCount.toString(),
      description: 'Concursos cadastrados',
      icon: <FileText className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Concursos Recentes',
      value: isLoading ? '...' : '0',
      description: 'Adicionados nos últimos 30 dias',
      icon: <Calendar className="h-6 w-6 text-green-500" />
    },
    {
      title: 'Concursos Ativos',
      value: isLoading ? '...' : '0',
      description: 'Em andamento',
      icon: <Building className="h-6 w-6 text-amber-500" />
    },
    {
      title: 'Total de Participantes',
      value: isLoading ? '...' : '0',
      description: 'Usuários registrados',
      icon: <User className="h-6 w-6 text-purple-500" />
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <Card key={index}>
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
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/project/admin/man/concursos/novo" 
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              Cadastrar novo concurso
            </a>
            <a 
              href="/project/admin/man/concursos" 
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              Gerenciar concursos
            </a>
            <a 
              href="/" 
              target="_blank"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md"
            >
              Visualizar site público
            </a>
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
    </div>
  );
};

export default AdminDashboard;
