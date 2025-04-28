
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchUserConcursoRankings } from '@/services/concursoService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trophy, Award, BookOpen, User, GraduationCap, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserConcursos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch user rankings from the database
  const { data: userRankings, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['user-concurso-rankings', user?.id],
    queryFn: () => user ? fetchUserConcursoRankings(user.id) : Promise.resolve([]),
    enabled: !!user
  });
  
  // In a real implementation, we would fetch the approved concursos from the database
  // For now, we'll use mock data
  const { data: approvedConcursos, isLoading: isLoadingApproved } = useQuery({
    queryKey: ['user-approved-concursos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Here we would fetch from the database
      // For now, returning mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return [
        {
          id: '1',
          titulo: 'Analista Judiciário - TRT 4ª Região',
          orgao: 'TRT 4ª Região',
          banca: 'FCC',
          data: '2022-03-15',
          classificacao: 23,
          aprovado: true,
          nomeado: true
        },
        {
          id: '2',
          titulo: 'Técnico Administrativo - INSS',
          orgao: 'INSS',
          banca: 'Cebraspe',
          data: '2021-11-10',
          classificacao: 156,
          aprovado: true,
          nomeado: false
        },
        {
          id: '3',
          titulo: 'Analista de Planejamento - MPU',
          orgao: 'MPU',
          banca: 'FCC',
          data: '2023-05-22',
          classificacao: 89,
          aprovado: true,
          nomeado: false
        }
      ];
    },
    enabled: !!user
  });
  
  // Mock data for upcoming concursos
  const { data: upcomingConcursos, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['user-upcoming-concursos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      return [
        {
          id: '4',
          titulo: 'Auditor Fiscal - Receita Federal',
          orgao: 'Receita Federal',
          banca: 'FGV',
          data: '2025-09-20',
          vagas: 300,
          inscricaoAte: '2025-07-15'
        },
        {
          id: '5',
          titulo: 'Procurador da República - MPF',
          orgao: 'MPF',
          banca: 'Cebraspe',
          data: '2025-08-05',
          vagas: 50,
          inscricaoAte: '2025-06-30'
        }
      ];
    },
    enabled: !!user
  });
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Faça login para ver seus concursos</h2>
        <p className="text-muted-foreground mb-6">
          Você precisa estar conectado para acessar esta página
        </p>
        <Button onClick={() => navigate('/auth')}>
          Fazer login
        </Button>
      </div>
    );
  }
  
  const renderLoading = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>
  );
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meus Concursos</h1>
      
      <Tabs defaultValue="rankings">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-6">
          <TabsTrigger value="rankings">
            <Trophy className="h-4 w-4 mr-2" />
            Rankings
          </TabsTrigger>
          <TabsTrigger value="approved">
            <Award className="h-4 w-4 mr-2" />
            Aprovados
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <BookOpen className="h-4 w-4 mr-2" />
            Próximos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Meus Rankings</CardTitle>
              <CardDescription>
                Concursos em que você participou e sua posição no ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRankings ? (
                renderLoading()
              ) : !userRankings || userRankings.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não participou de nenhum concurso com ranking.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/concursos')}
                  >
                    Ver concursos disponíveis
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRankings.map((ranking: any) => (
                    <Card key={ranking.id} className="overflow-hidden border-0 shadow-md">
                      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4">
                        <h3 className="font-medium">{ranking.concursos.titulo}</h3>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">{ranking.concursos.orgao}</span>
                            <span className="text-sm text-muted-foreground">{ranking.concursos.banca}</span>
                          </div>
                          <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
                            <span className="text-lg font-bold">{ranking.score}</span>
                            <span className="text-xs ml-1">pts</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/concurso/${ranking.concurso_id}/resultados`)}
                          className="w-full"
                        >
                          Ver ranking completo
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Concursos Aprovados</CardTitle>
              <CardDescription>
                Concursos em que você foi aprovado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApproved ? (
                renderLoading()
              ) : !approvedConcursos || approvedConcursos.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não marcou nenhum concurso como aprovado.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/perfil')}
                  >
                    Atualizar meu perfil
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedConcursos.map(concurso => (
                    <Card key={concurso.id} className="overflow-hidden">
                      <div className="p-4 border-l-4 border-green-500">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{concurso.titulo}</h3>
                            <div className="flex items-center mt-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">{concurso.orgao} • {concurso.banca}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-sm">
                                {concurso.classificacao}º colocado
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-muted-foreground">{formatDate(concurso.data)}</span>
                            {concurso.nomeado ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                                Nomeado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                                Aprovado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Concursos</CardTitle>
              <CardDescription>
                Concursos em que você pretende participar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUpcoming ? (
                renderLoading()
              ) : !upcomingConcursos || upcomingConcursos.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não adicionou nenhum próximo concurso.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate('/perfil')}
                  >
                    Atualizar meu perfil
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingConcursos.map(concurso => (
                    <Card key={concurso.id} className="overflow-hidden">
                      <div className="p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{concurso.titulo}</h3>
                            <div className="flex items-center mt-1">
                              <GraduationCap className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">{concurso.orgao} • {concurso.banca}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Award className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-sm">
                                {concurso.vagas} vagas
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                              <span className="text-sm text-muted-foreground">Prova: {formatDate(concurso.data)}</span>
                            </div>
                            <span className="text-sm text-muted-foreground mt-1">
                              Inscrições até: {formatDate(concurso.inscricaoAte)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <Button onClick={() => navigate('/perfil')}>
          Voltar ao perfil
        </Button>
      </div>
    </div>
  );
};

export default UserConcursos;
