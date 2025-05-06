
import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { generateRankingColumns, getSubjectScores } from '@/integrations/supabase/rankings';
import { Concurso } from '@/types/concursos';

interface RankingTableProps {
  rankings: any[];
  concurso: Concurso | null;
  currentUserId?: string; // Added this prop to fix the type error
  isAuthenticated?: boolean;
  isRefetching?: boolean;
  isLoading?: boolean;
  showReservation?: boolean;
}

export const RankingTable: React.FC<RankingTableProps> = ({ 
  rankings, 
  concurso,
  currentUserId,
  isAuthenticated = false,
  isRefetching = false,
  isLoading = false,
  showReservation = false
}) => {
  const [columns, setColumns] = useState<any[]>([
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ]);
  
  const [subjectScores, setSubjectScores] = useState<Record<string, any[]>>({});
  
  useEffect(() => {
    if (concurso?.id) {
      // Load the appropriate columns based on the concurso structure
      generateRankingColumns(concurso.id)
        .then(cols => setColumns(cols))
        .catch(err => console.error('Error generating columns:', err));
      
      // If it's a subject-based concurso, we need to fetch subject scores for each ranking
      if (concurso.minimum_score_type === 'subject' && rankings.length > 0) {
        const fetchScores = async () => {
          const scores: Record<string, any[]> = {};
          
          for (const ranking of rankings) {
            try {
              const rankingScores = await getSubjectScores(ranking.id, concurso.id);
              scores[ranking.id] = rankingScores;
            } catch (error) {
              console.error(`Error fetching scores for ranking ${ranking.id}:`, error);
              scores[ranking.id] = [];
            }
          }
          
          setSubjectScores(scores);
        };
        
        fetchScores();
      }
    }
  }, [concurso?.id, rankings]);
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  const getReservationBadgeColor = (type: string) => {
    switch (type) {
      case 'PPP':
        return 'bg-amber-500';
      case 'PCD':
        return 'bg-blue-500';
      case 'Hipossuficiente':
        return 'bg-purple-500';
      case 'Indígena':
        return 'bg-green-500';
      case 'Trans':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const formatScore = (score: number) => {
    return typeof score === 'number' ? score.toFixed(2) : '-';
  };
  
  // Helper to get subject score for a specific ranking
  const getSubjectScore = (rankingId: string, subjectCode: string) => {
    if (!subjectScores[rankingId]) return '-';
    const subject = subjectScores[rankingId].find(s => s.code === subjectCode);
    return subject ? formatScore(subject.score) : '-';
  };
  
  // Determine if we should render subject-based columns
  const isSubjectBased = concurso?.minimum_score_type === 'subject';
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Carregando ranking...</p>
      </div>
    );
  }
  
  if (!rankings || rankings.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Nenhum participante encontrado.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.id} 
                className={`text-${column.align}`}
                style={{ width: column.width ? `${column.width}px` : 'auto' }}
              >
                {column.label}
              </TableHead>
            ))}
            {showReservation && (
              <TableHead className="text-right">Cota</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((ranking) => (
            <TableRow 
              key={ranking.id}
              className={`${ranking.is_classified === false ? 'bg-red-50' : ''} 
                         ${currentUserId && ranking.userId === currentUserId ? 'bg-blue-50' : ''}`}
            >
              <TableCell className="text-center font-medium">
                {ranking.position}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ranking.avatarUrl} />
                    <AvatarFallback>{getInitials(ranking.name)}</AvatarFallback>
                  </Avatar>
                  <span className={ranking.is_classified === false ? 'line-through text-red-500' : ''}>
                    {ranking.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatScore(ranking.score)}
              </TableCell>
              
              {/* Render knowledge area scores */}
              {!isSubjectBased && columns.map(column => {
                // Skip the standard columns already rendered
                if (['position', 'name', 'score'].includes(column.id)) return null;
                
                return (
                  <TableCell key={column.id} className="text-right">
                    {formatScore(ranking[column.id.replace('Score', '_score')])}
                  </TableCell>
                );
              })}
              
              {/* Render subject scores */}
              {isSubjectBased && columns.map(column => {
                // Skip the standard columns already rendered
                if (['position', 'name', 'score'].includes(column.id)) return null;
                
                // Extract subject code from column id
                const subjectCode = column.id.replace('subject_', '');
                
                return (
                  <TableCell key={column.id} className="text-right">
                    {getSubjectScore(ranking.id, subjectCode)}
                  </TableCell>
                );
              })}
              
              {showReservation && (
                <TableCell className="text-right">
                  {ranking.reservationType !== 'Ampla Concorrência' ? (
                    <Badge className={getReservationBadgeColor(ranking.reservationType)}>
                      {ranking.reservationType}
                    </Badge>
                  ) : (
                    <span className="text-gray-500 text-sm">Ampla</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
