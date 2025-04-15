
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ranking } from '@/services/rankingService';
import { Concurso } from '@/types/concursos';
import { getConcursoSectionNames } from '@/services/rankingService';

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
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  
  // Fetch section names when concurso changes
  useEffect(() => {
    if (concurso?.id) {
      getConcursoSectionNames(concurso.id)
        .then(names => {
          // Limit to 5 columns max to avoid overflow
          setSectionNames(names.slice(0, 5));
        });
    }
  }, [concurso?.id]);
  
  const handleUserClick = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };

  // Helper function to display abbreviated section names
  const getShortName = (name: string) => {
    // If name is short already, return it
    if (name.length <= 5) return name;
    
    // Try to create an abbreviation from first letters of words
    const words = name.split(' ');
    if (words.length > 1) {
      return words.map(word => word[0]?.toUpperCase() || '').join('.');
    }
    
    // Just return first 3 chars with ellipsis
    return `${name.substring(0, 3)}...`;
  };

  if (!isAuthenticated) {
    return <Card>
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
              {/* Dynamic section columns */}
              {sectionNames.map(name => (
                <TableHead key={name} className="text-right" title={name}>
                  {getShortName(name)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings && rankings.length > 0 ? rankings.map(ranking => (
              <TableRow key={ranking.userId} className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}>
                <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
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
                <TableCell className="text-right font-medium">{ranking.score.toFixed(2)}</TableCell>
                
                {/* Dynamic section scores */}
                {sectionNames.map(name => (
                  <TableCell key={`${ranking.userId}-${name}`} className="text-right">
                    {(ranking.sectionScores?.[name] || 0).toFixed(2)}
                  </TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3 + sectionNames.length} className="text-center py-4">
                  Nenhum participante registrado ainda
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
};
