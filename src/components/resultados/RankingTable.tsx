import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ranking, RankingTableColumn } from '@/types/concursos';

interface RankingTableProps {
  columns: RankingTableColumn[];
  rankings: Ranking[];
}

const RankingTable: React.FC<RankingTableProps> = ({ columns, rankings }) => {
  const columnsDef: ColumnDef<Ranking>[] = columns.map((column) => ({
    id: column.id,
    header: column.label,
    accessorKey: column.id,
    cell: ({ row }) => {
      const ranking = row.original;
      
      const renderScoreCell = (value: any, isFailed: boolean) => {
        return (
          <TableCell className={`px-4 py-2 text-right ${isFailed ? 'text-red-500 font-bold' : ''}`}>
            {isFailed ? `${value}*` : value}
          </TableCell>
        );
      };

      switch (column.id) {
        case 'position':
          return (
            <TableCell className="px-4 py-2 text-center">
              {ranking.isDisqualified ? (
                <span className="text-red-500 font-bold">NC</span>
              ) : (
                ranking.position
              )}
            </TableCell>
          );
        case 'name':
          return (
            <TableCell className="px-4 py-2 font-medium flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={ranking.avatarUrl} />
                <AvatarFallback>{ranking.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {ranking.name}
              {ranking.displayReservation && (
                <span className="ml-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold uppercase">
                  {ranking.displayReservation}
                </span>
              )}
            </TableCell>
          );
        case 'score':
          return renderScoreCell(ranking.score, ranking.isDisqualified);
        case 'basicScore':
          return renderScoreCell(ranking.basicKnowledgeScore, ranking.basicScoreFailed === true);
        case 'specific1Score':
          return renderScoreCell(ranking.specificKnowledge1Score, ranking.specific1ScoreFailed === true);
        case 'specific2Score':
          return renderScoreCell(ranking.specificKnowledge2Score, ranking.specific2ScoreFailed === true);
        case 'specific3Score':
          return renderScoreCell(ranking.specificKnowledge3Score, ranking.specific3ScoreFailed === true);
        case 'discursiveScore':
          return renderScoreCell(ranking.discursiveScore, ranking.discursiveScoreFailed === true);
        case 'case1Score':
          return renderScoreCell(ranking.caseStudy1Score, ranking.caseStudy1Failed === true);
        case 'case2Score':
          return renderScoreCell(ranking.caseStudy2Score, ranking.caseStudy2Failed === true);
        case 'case3Score':
          return renderScoreCell(ranking.caseStudy3Score, ranking.caseStudy3Failed === true);
        default:
          return <TableCell className="px-4 py-2">{flexRender(column.cell, row)}</TableCell>;
      }
    },
  }));

  const table = useReactTable({
    data: rankings,
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                Nenhum resultado encontrado.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <React.Fragment key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </React.Fragment>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {rankings.some(r => r.isDisqualified) && (
        <div className="mt-4 text-sm text-red-500 p-4">
          * NC = Não Classificado (não atingiu a nota mínima em uma ou mais áreas)
        </div>
      )}
    </div>
  );
};

export default RankingTable;
