import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, TrendingUp, Search, Filter, Calendar, Plus, Medal, Star, Target } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { showProRequiredToast } from '@/utils/planRestrictions';
interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  vagas: number;
  inscritos: number;
  created_at: string;
  status: string;
  participant_count?: number;
  watermark_image_url?: string;
}
const RankingsPage = () => {
  const {
    user
  } = useAuth();
  const { isPro } = useSubscription();
  const { currentRankingCount } = usePlanLimits();
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('participants');

  const handleRankingClick = async (e: React.MouseEvent, concursoId: string) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth', { state: { from: `/concurso/${concursoId}/resultados` } });
      return;
    }

    // Se for Pro, sempre permite ver o ranking
    if (isPro) {
      navigate(`/ranking/${concursoId}`);
      return;
    }

    // Para usuários Free, verificar se participa do ranking
    try {
      const { data: userRankingData, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar participação:', error);
        navigate(`/ranking/${concursoId}`);
        return;
      }

      // Verificar se participa deste ranking específico
      let isParticipating = false;
      if (userRankingData?.consolidated_data?.rankings) {
        Object.values(userRankingData.consolidated_data.rankings).forEach((rankingData: any) => {
          if (rankingData.concurso_id === concursoId) {
            isParticipating = true;
          }
        });
      }

      if (isParticipating) {
        // Participa, pode ver o ranking
        navigate(`/ranking/${concursoId}`);
      } else {
        // Não participa, verificar se tem algum ranking
        const hasAnyRanking = userRankingData?.consolidated_data?.rankings && 
          Object.keys(userRankingData.consolidated_data.rankings).length > 0;

        if (!hasAnyRanking) {
          // Não tem nenhum ranking, redireciona para participar
          navigate(`/ranking/${concursoId}/participate`);
        } else {
          // Já tem 1 ranking, mostrar aviso e redirecionar para planos
          showProRequiredToast(navigate, 'Visualizar Rankings que Você Não Participa');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar participação:', error);
      // Em caso de erro, permite acesso (não bloqueia)
      navigate(`/ranking/${concursoId}`);
    }
  };
  useEffect(() => {
    loadConcursos();
  }, []);
  const loadConcursos = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('concursos').select(`
          id,
          titulo,
          orgao,
          banca,
          vagas,
          inscritos,
          created_at,
          status,
          watermark_image_url
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error loading concursos:', error);
        return;
      }

      // Load participant count for each concurso
      const concursosWithParticipants = await Promise.all((data || []).map(async concurso => {
        // Count users who have this concurso in their consolidated_data
        const { data: userRankings } = await supabase
          .from('user_rankings')
          .select('consolidated_data');
        
        let participantCount = 0;
        if (userRankings) {
          userRankings.forEach(userRanking => {
            if (userRanking.consolidated_data?.rankings) {
              Object.values(userRanking.consolidated_data.rankings).forEach((ranking: any) => {
                if (ranking.concurso_id === concurso.id) {
                  participantCount++;
                }
              });
            }
          });
        }
        
        return {
          ...concurso,
          participant_count: participantCount
        };
      }));
      setConcursos(concursosWithParticipants);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredConcursos = concursos.filter(concurso => {
    const matchesSearch = concurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || concurso.orgao.toLowerCase().includes(searchTerm.toLowerCase()) || concurso.banca.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || concurso.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'participants':
        return (b.participant_count || 0) - (a.participant_count || 0);
      case 'vagas':
        return (b.vagas || 0) - (a.vagas || 0);
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });
  const topConcursos = filteredConcursos.slice(0, 3);
  const totalParticipants = concursos.reduce((sum, c) => sum + (c.participant_count || 0), 0);
  const activeConcursos = concursos.filter(c => c.status === 'Em andamento').length;
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando rankings...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rankings</h1>
          
        </div>
        <Button onClick={() => user ? navigate('/criar-ranking') : navigate('/auth', { state: { from: '/criar-ranking' } })} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Ranking
        </Button>
      </div>

      {/* Stats Cards */}
      

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar concursos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Em andamento">Em Andamento</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
            <SelectItem value="Suspenso">Suspenso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="participants">Mais Participantes</SelectItem>
            <SelectItem value="vagas">Mais Vagas</SelectItem>
            <SelectItem value="recent">Mais Recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Concursos</TabsTrigger>
          <TabsTrigger value="popular">Populares</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredConcursos.map(concurso => <Link to={`/concurso/${concurso.id}/resultados`} key={concurso.id} className="block group" onClick={(e) => handleRankingClick(e, concurso.id)}>
                <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group-hover:-translate-y-0.5 relative">
                  {/* Marca d'água */}
                  {concurso.watermark_image_url && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-10 z-0"
                      style={{
                        backgroundImage: `url(${concurso.watermark_image_url})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover'
                      }}
                    />
                  )}
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 mb-2">
                          {concurso.titulo}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{concurso.orgao}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vagas:</span>
                        <span className="font-medium bg-transparent">{concurso.vagas || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Participantes:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {concurso.participant_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Trophy className="h-4 w-4" />
                          Ver Ranking
                        </div>
                        <span className="font-mono text-base font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                          {concurso.banca}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>)}
          </div>
          
          {filteredConcursos.length === 0 && <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum concurso encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou criar um novo ranking
              </p>
              <Button onClick={() => user ? navigate('/criar-ranking') : navigate('/auth', { state: { from: '/criar-ranking' } })}>
                Criar Novo Ranking
              </Button>
            </div>}
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {topConcursos.map((concurso, index) => <div key={concurso.id} className="block group cursor-pointer" onClick={(e) => handleRankingClick(e, concurso.id)}>
                <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group-hover:-translate-y-0.5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
                        {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                        {index === 2 && <Medal className="h-5 w-5 text-orange-500" />}
                        <span className="font-semibold">#{index + 1}</span>
                      </div>
                      <Badge variant="default">{concurso.participant_count} participantes</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{concurso.titulo}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{concurso.orgao}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Trophy className="h-4 w-4" />
                        Ver Ranking
                      </div>
                      <span className="font-mono text-sm font-semibold text-primary">
                        {concurso.banca}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>)}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {concursos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6).map(concurso => <div key={concurso.id} className="block group cursor-pointer" onClick={(e) => handleRankingClick(e, concurso.id)}>
                  <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group-hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg line-clamp-2 flex-1">{concurso.titulo}</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          <Calendar className="h-3 w-3 mr-1" />
                          Novo
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{concurso.orgao}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Publicado em {concurso.created_at ? new Date(concurso.created_at).toLocaleDateString('pt-BR') : 'Data não informada'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Trophy className="h-4 w-4" />
                          Ver Ranking
                        </div>
                        <span className="font-mono text-base font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                          {concurso.banca}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>)}
          </div>
        </TabsContent>
      </Tabs>
    </div>;
};
export default RankingsPage;