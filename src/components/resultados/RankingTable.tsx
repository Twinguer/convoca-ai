
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ranking } from '@/services/rankingService';

interface RankingTableProps {
  rankings?: Ranking[];
  currentUserId?: string | null;
  isAuthenticated: boolean;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  currentUserId,
  isAuthenticated
}) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };

  if (!isAuthenticated) {
    return <Card>
        <CardHeader>
          <CardTitle>Classificação Pós-prova</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">Você precisa estar cadastrado para ver o Ranking completo.</p>
          <Button asChild>
            <Link to="/auth" className="flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar-se
            </Link>
          </Button>
        </CardContent>
      </Card>;
  }
  
  return <Card>
      <CardHeader>
        <CardTitle>Classificação Pós-prova</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-16">
                # 
              </TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead className="text-right">
                Total 
              </TableHead>
              <TableHead className="text-right">
                C.B. 
              </TableHead>
              <TableHead className="text-right">
                C.E. 
              </TableHead>
              <TableHead className="text-right">
                Dis. 
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings && rankings.length > 0 ? rankings.map(ranking => (
                <TableRow 
                  key={ranking.userId} 
                  className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}
                >
                  <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors" 
                      onClick={() => handleUserClick(ranking.userId)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
                        <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{ranking.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{ranking.score.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{ranking.basicKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">{ranking.specificKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">{ranking.discursiveScore?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhum participante registrado ainda
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
};
