
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Ranking } from '@/services/rankingService';
import { Concurso } from '@/types/concursos';

interface RankingTableProps {
  rankings?: Ranking[];
  currentUserId?: string | null;
  isAuthenticated: boolean;
  concurso?: Concurso;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  currentUserId,
  isAuthenticated,
  concurso
}) => {
  const navigate = useNavigate();
  const [reservationFilter, setReservationFilter] = useState<string>("all");
  
  // Filtra o ranking com base no tipo de vaga selecionada
  const filteredRankings = rankings?.filter(ranking => 
    reservationFilter === "all" || 
    ranking.reservationType === reservationFilter
  );
  
  // Verifica se o concurso tem qualquer tipo de vaga reservada
  const hasAnyReservation = concurso && (
    concurso.has_ppp || 
    concurso.has_pcd || 
    concurso.has_indigenas || 
    concurso.has_hipossuficientes || 
    concurso.has_transsexuais
  );
  
  const handleUserClick = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classificação Pós-prova</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">Você precisa estar cadastrado para ver o Ranking.</p>
          <Button asChild>
            <Link to="/auth" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar-se
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Classificação Pós-prova</CardTitle>
          
          {hasAnyReservation && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={reservationFilter}
                onValueChange={setReservationFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por vaga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as vagas</SelectItem>
                  <SelectItem value="Ampla Concorrência">Ampla Concorrência</SelectItem>
                  {concurso?.has_ppp && (
                    <SelectItem value="PPP">PPP</SelectItem>
                  )}
                  {concurso?.has_pcd && (
                    <SelectItem value="PCD">PCD</SelectItem>
                  )}
                  {concurso?.has_indigenas && (
                    <SelectItem value="Indígenas">Indígenas</SelectItem>
                  )}
                  {concurso?.has_hipossuficientes && (
                    <SelectItem value="Hipossuficientes">Hipossuficientes</SelectItem>
                  )}
                  {concurso?.has_transsexuais && (
                    <SelectItem value="Transsexuais">Transsexuais</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-16"># </TableHead>
              <TableHead>Candidato</TableHead>
              {hasAnyReservation && <TableHead>Tipo de Vaga</TableHead>}
              <TableHead className="text-right">Total </TableHead>
              <TableHead className="text-right">C.B. </TableHead>
              <TableHead className="text-right">C.E. </TableHead>
              <TableHead className="text-right">Dis. </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRankings && filteredRankings.length > 0 ? (
              filteredRankings.map((ranking, index) => (
                <TableRow 
                  key={ranking.userId} 
                  className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}
                >
                  <TableCell className="text-center font-bold">{index + 1}º</TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" 
                      onClick={() => handleUserClick(ranking.userId)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
                        <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{ranking.name}</span>
                    </div>
                  </TableCell>
                  {hasAnyReservation && (
                    <TableCell>
                      {ranking.reservationType ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ranking.reservationType === 'Ampla Concorrência' 
                            ? 'bg-gray-100 text-gray-800' 
                            : ranking.reservationType === 'PPP'
                            ? 'bg-yellow-100 text-yellow-800'
                            : ranking.reservationType === 'PCD'
                            ? 'bg-blue-100 text-blue-800'
                            : ranking.reservationType === 'Indígenas'
                            ? 'bg-green-100 text-green-800'
                            : ranking.reservationType === 'Hipossuficientes'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {ranking.reservationType}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">{ranking.score.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{ranking.basicKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">{ranking.specificKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">{ranking.discursiveScore?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={hasAnyReservation ? 7 : 6} 
                  className="text-center py-4"
                >
                  Nenhum participante registrado ainda
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
