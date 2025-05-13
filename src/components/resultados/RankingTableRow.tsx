
import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserActions } from '../Admin/UserActions';
import { Ranking } from '@/services/rankingService';

interface RankingTableRowProps {
  ranking: Ranking;
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  isAmpla: boolean;
  isAuthenticated: boolean;
  isAdminMode: boolean;
  hasScoreChanged: boolean;
  customDisciplines: Array<{ type: string, name: string }>;
  concursoHasDiscursive?: boolean;
  concursoHasCaseStudy1?: boolean;
  concursoHasCaseStudy2?: boolean;
  concursoHasCaseStudy3?: boolean;
}

export const RankingTableRow: React.FC<RankingTableRowProps> = ({
  ranking,
  currentUserId,
  handleUserClick,
  isAmpla,
  isAuthenticated,
  isAdminMode,
  hasScoreChanged,
  customDisciplines,
  concursoHasDiscursive,
  concursoHasCaseStudy1,
  concursoHasCaseStudy2,
  concursoHasCaseStudy3
}) => {
  // Determinar se o candidato foi classificado (atingiu os mínimos exigidos)
  const isClassified = ranking.is_classified !== false; // Se for undefined ou true, consideramos como classificado
  
  // Classes para candidatos não classificados
  const notClassifiedStyle = isClassified ? '' : 'text-red-500';

  return (
    <TableRow 
      key={ranking.userId} 
      className={`${currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''} 
                 ${hasScoreChanged ? 'bg-green-50' : ''}
                 ${!isClassified ? 'bg-red-50' : ''}`}
    >
      <TableCell className={`text-center font-bold ${notClassifiedStyle}`}>{ranking.position}º</TableCell>
      
      {!isAmpla && (
        <TableCell className={`text-center font-bold ${notClassifiedStyle}`}>
          {ranking.quotaPosition}º
        </TableCell>
      )}
      
      <TableCell>
        <div 
          className={`flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors ${notClassifiedStyle}`} 
          onClick={() => handleUserClick(ranking.userId)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
            <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span>
            {ranking.name}
            {isAmpla && ranking.reservationType !== "Ampla Concorrência" && (
              <span className="ml-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ({ranking.displayReservation})
              </span>
            )}
          </span>
          {!isClassified && (
            <span className="ml-1 text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
              NÃO CLASSIFICADO
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell className={`text-right font-medium ${hasScoreChanged ? 'text-emerald-600' : ''} ${notClassifiedStyle}`}>
        {ranking.score.toFixed(2)}
      </TableCell>
      
      {/* Pontuações de disciplinas customizadas */}
      {customDisciplines.map((discipline, idx) => {
        // Access the score using the discipline type as the key
        const scoreValue = ranking.weightedCustomDisciplineScores?.[discipline.type] || 0;
        return (
          <TableCell key={`custom-score-${idx}`} className={`text-right ${notClassifiedStyle}`}>
            {Number(scoreValue).toFixed(2)}
          </TableCell>
        );
      })}
      
      {/* Pontuações de partes subjetivas */}
      {concursoHasDiscursive && (
        <TableCell className={`text-right ${notClassifiedStyle}`}>
          {Number(ranking.weightedDiscursiveScore || 0).toFixed(2)}
        </TableCell>
      )}
      
      {concursoHasCaseStudy1 && (
        <TableCell className={`text-right ${notClassifiedStyle}`}>
          {Number(ranking.weightedCaseStudy1Score || 0).toFixed(2)}
        </TableCell>
      )}
      
      {concursoHasCaseStudy2 && (
        <TableCell className={`text-right ${notClassifiedStyle}`}>
          {Number(ranking.weightedCaseStudy2Score || 0).toFixed(2)}
        </TableCell>
      )}
      
      {concursoHasCaseStudy3 && (
        <TableCell className={`text-right ${notClassifiedStyle}`}>
          {Number(ranking.weightedCaseStudy3Score || 0).toFixed(2)}
        </TableCell>
      )}
      
      {isAdminMode && isAuthenticated && (
        <TableCell>
          <UserActions 
            userId={ranking.userId} 
            userName={ranking.name} 
            rankingId={ranking.id} 
            onSuccess={() => window.location.reload()} 
            showOnlyRankingActions={true} 
          />
        </TableCell>
      )}
    </TableRow>
  );
};
