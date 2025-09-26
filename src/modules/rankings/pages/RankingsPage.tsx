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

interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  vagas: number;
  inscritos: number;
  data_publicacao: string;
  status: string;
  participant_count?: number;
}

const RankingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('participants');

  useEffect(() => {
    loadConcursos();
  }, []);

  const loadConcursos = async () => {
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select(`
          id,
          titulo,
          orgao,
          banca,
          vagas,
          inscritos,
          data_publicacao,
          status
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading concursos:', error);
        return;
      }

      // Load participant count for each concurso
      const concursosWithParticipants = await Promise.all(
        (data || []).map(async (concurso) => {
          const { count } = await supabase
            .from('user_rankings')
            .select('id', { count: 'exact' })
            .eq('concurso_id', concurso.id);
          
          return {
            ...concurso,
            participant_count: count || 0
          };
        })
      );

      setConcursos(concursosWithParticipants);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConcursos = concursos
    .filter(concurso => {
      const matchesSearch = concurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           concurso.orgao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           concurso.banca.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || concurso.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'participants':
          return (b.participant_count || 0) - (a.participant_count || 0);
        case 'vagas':
          return (b.vagas || 0) - (a.vagas || 0);
        case 'recent':
          return new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
        default:
          return 0;
      }
    });

  const topConcursos = filteredConcursos.slice(0, 3);
  const totalParticipants = concursos.reduce((sum, c) => sum + (c.participant_count || 0), 0);
  const activeConcursos = concursos.filter(c => c.status === 'Em andamento').length;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Carregando rankings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rankings e Classificações</h1>
          <p className="text-muted-foreground">
            Acompanhe seu desempenho nos concursos e compare com outros candidatos
          </p>
        </div>
        <Button onClick={() => navigate('/criar-ranking')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Ranking
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Concursos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{concursos.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeConcursos} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">
              Total de participações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topConcursos[0]?.participant_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {topConcursos[0]?.titulo?.slice(0, 20) || 'Nenhum concurso'}...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vagas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {concursos.reduce((sum, c) => sum + (c.vagas || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as oportunidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar concursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
          <TabsTrigger value="all">Todos os Concursos</TabsTrigger>
          <TabsTrigger value="popular">Populares</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConcursos.map((concurso) => (
              <Card key={concurso.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {concurso.titulo}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{concurso.orgao}</Badge>
                        <Badge variant="outline">{concurso.banca}</Badge>
                      </div>
                    </div>
                    <Badge variant={concurso.status === 'Em andamento' ? 'default' : 'secondary'}>
                      {concurso.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vagas:</span>
                      <span className="font-medium">{concurso.vagas || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Participantes:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {concurso.participant_count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Publicado:</span>
                      <span className="font-medium">
                        {concurso.data_publicacao ? 
                          new Date(concurso.data_publicacao).toLocaleDateString('pt-BR') : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1" 
                        asChild
                      >
                        <Link to={`/concurso/${concurso.id}/resultados`}>
                          <Trophy className="h-4 w-4 mr-1" />
                          Ver Ranking
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/concurso/${concurso.id}/participar`}>
                          Participar
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredConcursos.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum concurso encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou criar um novo ranking
              </p>
              <Button onClick={() => navigate('/criar-ranking')}>
                Criar Novo Ranking
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topConcursos.map((concurso, index) => (
              <Card key={concurso.id} className="hover:shadow-lg transition-shadow">
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
                    <Badge variant="outline">{concurso.banca}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/concurso/${concurso.id}/resultados`}>Ver Ranking</Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to={`/concurso/${concurso.id}/participar`}>Participar</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concursos
              .sort((a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime())
              .slice(0, 6)
              .map((concurso) => (
                <Card key={concurso.id} className="hover:shadow-lg transition-shadow">
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
                      <Badge variant="outline">{concurso.banca}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Publicado em {concurso.data_publicacao ? 
                        new Date(concurso.data_publicacao).toLocaleDateString('pt-BR') : 
                        'Data não informada'
                      }
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link to={`/concurso/${concurso.id}/resultados`}>Ver Ranking</Link>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <Link to={`/concurso/${concurso.id}/participar`}>Participar</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RankingsPage;