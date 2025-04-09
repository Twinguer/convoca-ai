
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, fetchUserRankings, getParticipantCount } from '@/services/concursoService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Users } from 'lucide-react';

interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
}

const ResultadosPage = () => {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
  });
  
  // Fetch rankings
  const { data: rankings, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => fetchUserRankings(id),
  });
  
  // Fetch participant count
  const { data: participantCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
  });
  
  // Find user's ranking
  const userRanking = rankings?.find((r: Ranking) => r.userId === user?.id);
  
  const isLoading = isLoadingConcurso || isLoadingRankings || isLoadingCount;
  
  if (isLoading) {
    return <div className="container mx-auto p-4">Carregando resultados...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{concurso?.titulo} - Resultados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Total de participantes: <Badge variant="outline">{participantCount || 0}</Badge>
            </p>
            {userRanking && (
              <p className="mt-2 text-lg">
                Sua posição: <Badge>{userRanking.position}º</Badge> com{' '}
                <Badge variant="secondary">{userRanking.score} pontos</Badge>
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Users className="mr-2 h-5 w-5 text-blue-500" />
              Informações do Concurso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Órgão: <Badge variant="outline">{concurso?.orgao}</Badge>
            </p>
            <p className="mt-2 text-lg">
              Vagas: <Badge variant="outline">{concurso?.vagas}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Classificação Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Posição</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Pontuação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings && rankings.length > 0 ? (
                rankings.map((ranking: Ranking) => (
                  <TableRow key={ranking.userId} className={user && ranking.userId === user.id ? 'bg-muted' : ''}>
                    <TableCell className="font-medium">{ranking.position}º</TableCell>
                    <TableCell>{ranking.name}</TableCell>
                    <TableCell className="text-right">{ranking.score}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Nenhum participante registrado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadosPage;
