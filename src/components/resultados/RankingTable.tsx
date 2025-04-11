
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Ranking } from '@/services/rankingService';

interface RankingTableProps {
  rankings?: Ranking[];
  currentUserId?: string | null;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  currentUserId,
}) => {
  // Add debugging log to verify rankings data
  console.log('RankingTable received rankings:', rankings);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classificação Pós-prova</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-16">
                # <span className="inline-block">↕️</span>
              </TableHead>
              <TableHead>Candidato</TableHead>
              <TableHead className="text-right">
                Total <span className="inline-block">↕️</span>
              </TableHead>
              <TableHead className="text-right">
                C.B. <span className="inline-block">↕️</span>
              </TableHead>
              <TableHead className="text-right">
                C.E. <span className="inline-block">↕️</span>
              </TableHead>
              <TableHead className="text-right">
                Dis. <span className="inline-block">↕️</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings && rankings.length > 0 ? (
              rankings.map((ranking) => (
                <TableRow key={ranking.userId} className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}>
                  <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
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
