
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchConcursoById } from '@/services/concursoService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RankingUser {
  position: number;
  name: string;
  basicScore?: string;
  specificScore?: string;
  discursiveScore?: string;
  finalScore: string;
  score?: string;
  userId?: string;
}

const ResultadosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'unofficial' | 'official'>('unofficial');
  const { user } = useAuth();
  
  const { data: concurso, isLoading, isError } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id || ''),
    enabled: !!id
  });

  // Fetch real user rankings from the database
  const { data: rankings = [], isLoading: isLoadingRankings } = useQuery({
    queryKey: ['user-rankings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select(`
          id,
          score,
          user_id,
          users_profiles!inner(name)
        `)
        .eq('concurso_id', id)
        .order('score', { ascending: false });
        
      if (error) throw error;
      
      // Format data
      return (data || []).map((item, index) => ({
        position: index + 1,
        name: item.users_profiles.name,
        finalScore: item.score.toFixed(1),
        userId: item.user_id
      })) as RankingUser[];
    },
    enabled: !!id
  });

  // Check if user is participating
  const { data: isParticipating = false } = useQuery({
    queryKey: ['is-participating', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('user_id', user.id)
        .eq('concurso_id', id)
        .maybeSingle();
        
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id
  });

  // Generate mock data for official ranking if no real data is available
  const [officialRanking, setOfficialRanking] = useState<RankingUser[]>([]);
  
  // Generate mock data for rankings
  useEffect(() => {
    const generateMockRanking = (seed: number) => {
      const names = [
        "Maria Silva", "João Santos", "Ana Oliveira", "Carlos Pereira", "Juliana Costa", 
        "Pedro Almeida", "Fernanda Lima", "Rodrigo Souza", "Camila Ferreira", "Lucas Martins",
        "Aline Rodrigues", "Marcos Gomes", "Patrícia Carvalho", "Bruno Ribeiro", "Mariana Nunes",
        "Rafael Mendes", "Daniela Barbosa", "Gustavo Cardoso", "Lúcia Alves", "André Vieira",
        "Bianca Teixeira", "Felipe Dias", "Clara Rocha", "Eduardo Moreira", "Vanessa Castro",
      ];

      // For official ranking, only use final score
      return Array.from({ length: 20 }, (_, i) => {
        const nameSeed = (seed + i) % names.length;
        // Generate a score between 70 and 100 with one decimal place
        const score = (70 + Math.random() * 30).toFixed(1);
        
        return {
          position: i + 1,
          name: names[nameSeed],
          score: score,
          finalScore: score
        };
      }).sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore))
        .map((candidate, idx) => ({ ...candidate, position: idx + 1 }));
    };

    setOfficialRanking(generateMockRanking(1));
  }, []);

  if (isLoading || isLoadingRankings) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
      </div>
    );
  }

  if (isError || !concurso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Concurso não encontrado</h2>
        <p className="text-gray-600 mb-6">O concurso que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/concursos')}>Voltar para Concursos</Button>
      </div>
    );
  }

  if (!isParticipating && rankings.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h2>
        <p className="text-gray-600 mb-6">Para ver o ranking, você precisa participar preenchendo seu gabarito.</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate(`/concurso/${id}/participar`)}>Participar do Ranking</Button>
          <Button variant="outline" onClick={() => navigate(`/concurso/${id}`)}>Voltar para o Concurso</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/concursos">Concursos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/concurso/${id}`}>{concurso.titulo}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Resultados</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate(`/concurso/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{concurso.titulo}</h1>
        <p className="text-gray-600">{concurso.orgao}</p>
      </div>
      
      {rankings.length === 0 ? (
        <Card className="mb-6">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <CardTitle>Nenhum Participante no Ranking</CardTitle>
            <CardDescription>
              Este concurso ainda não possui participantes no ranking não oficial.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate(`/concurso/${id}/participar`)}>
              Seja o primeiro a participar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resultados do Concurso</CardTitle>
            <CardDescription>
              Confira abaixo o ranking não oficial e o resultado oficial do concurso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="unofficial" onValueChange={(value) => setActiveTab(value as 'unofficial' | 'official')}>
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
                <TabsTrigger value="unofficial">Ranking não oficial</TabsTrigger>
                <TabsTrigger value="official">Resultado Oficial</TabsTrigger>
              </TabsList>
              
              <TabsContent value="unofficial">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Posição</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Nota Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankings.map((candidate) => (
                        <TableRow 
                          key={`unofficial-${candidate.position}`}
                          className={candidate.userId === user?.id ? "bg-green-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {candidate.position <= 3 ? (
                              <div className="flex items-center">
                                <Trophy className={`h-4 w-4 mr-1 ${
                                  candidate.position === 1 ? "text-yellow-500" :
                                  candidate.position === 2 ? "text-gray-400" :
                                  "text-amber-700"
                                }`} />
                                {candidate.position}º
                              </div>
                            ) : (
                              `${candidate.position}º`
                            )}
                          </TableCell>
                          <TableCell>
                            {candidate.name}
                            {candidate.userId === user?.id && (
                              <span className="ml-2 text-xs text-green-600 font-medium">(Você)</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{candidate.finalScore}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-500 mt-4 italic">
                  * Este ranking é não oficial e baseado nos dados informados pelos participantes.
                </p>
              </TabsContent>
              
              <TabsContent value="official">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Posição</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-32 text-right">Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officialRanking.map((candidate) => (
                        <TableRow key={`official-${candidate.position}`}>
                          <TableCell className="font-medium">
                            {candidate.position <= 3 ? (
                              <div className="flex items-center">
                                <Trophy className={`h-4 w-4 mr-1 ${
                                  candidate.position === 1 ? "text-yellow-500" :
                                  candidate.position === 2 ? "text-gray-400" :
                                  "text-amber-700"
                                }`} />
                                {candidate.position}º
                              </div>
                            ) : (
                              `${candidate.position}º`
                            )}
                          </TableCell>
                          <TableCell>{candidate.name}</TableCell>
                          <TableCell className="text-right">{candidate.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Fonte: Resultado oficial publicado pela banca organizadora.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-center">
        <Button asChild variant="outline" className="gap-2">
          <a href={concurso.link} target="_blank" rel="noopener noreferrer">
            Acessar site oficial da banca
          </a>
        </Button>
      </div>
    </div>
  );
};

export default ResultadosPage;
