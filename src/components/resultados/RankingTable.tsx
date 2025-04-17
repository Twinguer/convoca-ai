
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Award, User } from 'lucide-react';
import { Ranking } from '@/services/rankingService';

interface RankingTableProps {
  rankings: Ranking[];
  currentUserId?: string;
  isAuthenticated?: boolean;
  showReservationType?: boolean;
}

const RankingTable: React.FC<RankingTableProps> = ({ 
  rankings,
  currentUserId,
  isAuthenticated = false,
  showReservationType = false
}) => {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  // Function to get reservation type badge variant
  const getReservationBadgeVariant = (type: string) => {
    switch (type) {
      case 'PPP':
        return 'outline';
      case 'PCD':
        return 'secondary';
      case 'Hipossuficientes':
        return 'destructive';
      case 'Indígenas':
        return 'default';
      case 'Transsexuais':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Participante</TableHead>
            {showReservationType && (
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
            )}
            <TableHead className="text-right">Pontuação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showReservationType ? 4 : 3} className="h-24 text-center">
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          ) : (
            rankings.map((ranking) => (
              <TableRow key={ranking.userId} className={user && ranking.userId === user.id ? 'bg-muted' : ''}>
                <TableCell className="text-center font-medium">
                  {ranking.position <= 3 ? (
                    <div className="flex justify-center">
                      <Award className={`w-5 h-5 ${
                        ranking.position === 1 ? 'text-yellow-500' : 
                        ranking.position === 2 ? 'text-gray-400' : 
                        'text-amber-700'
                      }`} />
                    </div>
                  ) : (
                    ranking.position
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-7 w-7 mr-2">
                      {ranking.avatarUrl ? (
                        <AvatarImage src={ranking.avatarUrl} alt={ranking.name} />
                      ) : (
                        <AvatarFallback>
                          {getInitials(ranking.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium truncate max-w-[140px] sm:max-w-full">
                      {ranking.name}
                      {user && ranking.userId === user.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                {showReservationType && (
                  <TableCell className="hidden md:table-cell">
                    {ranking.reservationType && ranking.reservationType !== 'Ampla Concorrência' ? (
                      <Badge variant={getReservationBadgeVariant(ranking.reservationType)}>
                        {ranking.reservationType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Ampla Concorrência</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">
                  {ranking.score.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RankingTable;
