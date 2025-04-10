
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

interface RankingItem {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string;
}

interface RankingTableProps {
  rankings?: RankingItem[];
  currentUserId?: string | null;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  currentUserId,
}) => {
  return (
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
              rankings.map((ranking) => (
                <TableRow key={ranking.userId} className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}>
                  <TableCell className="font-medium">{ranking.position}º</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={ranking.avatarUrl} alt={ranking.name} />
                        <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{ranking.name}</span>
                    </div>
                  </TableCell>
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
  );
};
