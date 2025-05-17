
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '../profile/UserAvatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowUpDown, Medal } from 'lucide-react';
import { useResultadosData } from '@/hooks/useResultadosData';
import { getSectionDisplayName, getDisciplines, getNumericValue } from '@/integrations/supabase/rankings/examStructure';
import { Progress } from '@/components/ui/progress';
import { Concurso } from '@/types/concursos';

interface RankingTableProps {
  concurso: Concurso;
  rankings?: any[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  showSectionTotals?: boolean;
  onUserClick?: (userId: string) => void;
}

interface Column {
  title: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  concurso,
  rankings = [],
  isLoading = false,
  isError = false,
  errorMessage,
  showSectionTotals = true,
  onUserClick
}) => {
  const [sortColumn, setSortColumn] = useState<string>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const { data: rankingsData, isLoading: isLoadingInternal } = useResultadosData(
    concurso.id,
    selectedTab !== 'all' ? selectedTab : undefined
  );
  
  const actualRankings = rankingsData || rankings;
  const actualLoading = isLoading || isLoadingInternal;
  
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  const quotaTabs = [
    { value: 'all', label: 'Todos' },
    concurso.has_ampla_concorrencia && { value: 'Ampla Concorrência', label: 'Ampla' },
    concurso.has_ppp && { value: 'PPP', label: 'PPP' },
    concurso.has_pcd && { value: 'PCD', label: 'PCD' },
    concurso.has_indigenas && { value: 'Indígena', label: 'Indígenas' },
    concurso.has_hipossuficientes && { value: 'Hipossuficiente', label: 'Hipossuficientes' },
    concurso.has_transsexuais && { value: 'Transgênero', label: 'Transgêneros' },
  ].filter(Boolean);

  const sortedRankings = [...actualRankings].sort((a, b) => {
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];
    
    // Para classificação, considerar is_classified primeiro
    if (sortColumn === 'score') {
      // Primeiro ordenar por classificação (classificados primeiro)
      if (a.is_classified !== b.is_classified) {
        return a.is_classified ? -1 : 1;
      }
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    } else if (valueA === null || valueA === undefined) {
      valueA = sortDirection === 'asc' ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    } else if (valueB === null || valueB === undefined) {
      valueB = sortDirection === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Função para gerar colunas
  const getColumns = (): Column[] => {
    const baseColumns: Column[] = [
      {
        key: 'position',
        title: 'Pos',
        className: 'w-14',
        render: (_, __, index) => (
          <div className="font-medium text-center">
            {index + 1}
          </div>
        ),
      },
      {
        key: 'user_name',
        title: 'Candidato',
        className: 'min-w-[140px]',
        render: (name, row) => (
          <div className="flex items-center gap-2 overflow-hidden">
            <UserAvatar 
              avatarUrl={row.avatar_url}
              userName={name || 'Usuário'}
              size="sm"
            />
            <div 
              className={`truncate font-medium ${onUserClick ? 'cursor-pointer hover:underline' : ''}`}
              onClick={onUserClick ? () => onUserClick(row.user_id) : undefined}
            >
              {name || 'Anônimo'}
              {row.is_classified && (
                <Medal className="inline ml-1 h-3 w-3 text-yellow-500" />
              )}
            </div>
          </div>
        ),
        sortable: true
      },
      {
        key: 'reservation_type',
        title: 'Cota',
        className: 'w-28',
        render: (value) => (
          <Badge variant="outline" className="font-normal">
            {value === 'Ampla Concorrência' ? 'Ampla' : value}
          </Badge>
        ),
        sortable: true
      }
    ];
    
    // Adicionar pontuação total
    const columns = [
      ...baseColumns,
      {
        key: 'score',
        title: 'Total',
        className: 'w-24',
        render: (value) => (
          <div className="font-semibold text-right">
            {typeof value === 'number' ? value.toFixed(2) : '-'}
          </div>
        ),
        sortable: true
      }
    ];
    
    // Se mostrarmos pontuações por seção
    if (showSectionTotals) {
      // Verificar se é um concurso com conhecimentos customizados
      if (concurso.has_custom_knowledge && concurso.disciplines) {
        const disciplines = getDisciplines(concurso);
        
        // Para cada disciplina habilitada, adicionar uma coluna
        if (Array.isArray(disciplines)) {
          disciplines.forEach(discipline => {
            if (discipline.isEnabled) {
              const disciplineKey = discipline.type;
              const columnTitle = discipline.name || discipline.type;
              
              columns.push({
                key: `customScore_${disciplineKey}`,
                title: columnTitle,
                className: 'w-24',
                render: (_, row) => {
                  // Buscar a pontuação na estrutura customDisciplineScores do ranking
                  const score = row.customDisciplineScores?.[disciplineKey];
                  const weightedScore = row.weightedCustomDisciplineScores?.[disciplineKey];
                  
                  return (
                    <div className="text-right">
                      {score !== undefined ? score.toFixed(2) : '-'}
                      {weightedScore !== undefined && weightedScore !== score ? (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({weightedScore.toFixed(1)})
                        </span>
                      ) : null}
                    </div>
                  );
                },
                sortable: true
              });
            }
          });
        }
      } else {
        // Estrutura tradicional
        if (concurso.has_basic_knowledge) {
          columns.push({
            key: 'basic_knowledge_score',
            title: 'Básico',
            className: 'w-24',
            render: (value, row) => (
              <div className="text-right">
                {typeof value === 'number' ? value.toFixed(2) : '-'}
                {row.weighted_basic_score !== value ? (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({row.weighted_basic_score?.toFixed(1)})
                  </span>
                ) : null}
              </div>
            ),
            sortable: true
          });
        }
        
        if (concurso.has_specific_knowledge_1) {
          columns.push({
            key: 'specific_knowledge_1_score',
            title: 'Esp. 1',
            className: 'w-24',
            render: (value, row) => (
              <div className="text-right">
                {typeof value === 'number' ? value.toFixed(2) : '-'}
                {row.weighted_specific_1_score !== value ? (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({row.weighted_specific_1_score?.toFixed(1)})
                  </span>
                ) : null}
              </div>
            ),
            sortable: true
          });
        }
        
        if (concurso.has_specific_knowledge_2) {
          columns.push({
            key: 'specific_knowledge_2_score',
            title: 'Esp. 2',
            className: 'w-24',
            render: (value, row) => (
              <div className="text-right">
                {typeof value === 'number' ? value.toFixed(2) : '-'}
                {row.weighted_specific_2_score !== value ? (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({row.weighted_specific_2_score?.toFixed(1)})
                  </span>
                ) : null}
              </div>
            ),
            sortable: true
          });
        }
        
        if (concurso.has_specific_knowledge_3) {
          columns.push({
            key: 'specific_knowledge_3_score',
            title: 'Esp. 3',
            className: 'w-24',
            render: (value, row) => (
              <div className="text-right">
                {typeof value === 'number' ? value.toFixed(2) : '-'}
                {row.weighted_specific_3_score !== value ? (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({row.weighted_specific_3_score?.toFixed(1)})
                  </span>
                ) : null}
              </div>
            ),
            sortable: true
          });
        }
      }
      
      // Provas subjetivas
      if (concurso.has_discursive) {
        columns.push({
          key: 'discursive_score',
          title: 'Disc.',
          className: 'w-20',
          render: (value, row) => (
            <div className="text-right">
              {typeof value === 'number' ? value.toFixed(2) : '-'}
              {row.weighted_discursive_score !== value ? (
                <span className="text-xs text-muted-foreground ml-1">
                  ({row.weighted_discursive_score?.toFixed(1)})
                </span>
              ) : null}
            </div>
          ),
          sortable: true
        });
      }
      
      if (concurso.has_case_study_1) {
        columns.push({
          key: 'case_study_1_score',
          title: 'Caso 1',
          className: 'w-20',
          render: (value, row) => (
            <div className="text-right">
              {typeof value === 'number' ? value.toFixed(2) : '-'}
              {row.weighted_case_study_1_score !== value ? (
                <span className="text-xs text-muted-foreground ml-1">
                  ({row.weighted_case_study_1_score?.toFixed(1)})
                </span>
              ) : null}
            </div>
          ),
          sortable: true
        });
      }
      
      if (concurso.has_case_study_2) {
        columns.push({
          key: 'case_study_2_score',
          title: 'Caso 2',
          className: 'w-20',
          render: (value, row) => (
            <div className="text-right">
              {typeof value === 'number' ? value.toFixed(2) : '-'}
              {row.weighted_case_study_2_score !== value ? (
                <span className="text-xs text-muted-foreground ml-1">
                  ({row.weighted_case_study_2_score?.toFixed(1)})
                </span>
              ) : null}
            </div>
          ),
          sortable: true
        });
      }
      
      if (concurso.has_case_study_3) {
        columns.push({
          key: 'case_study_3_score',
          title: 'Caso 3',
          className: 'w-20',
          render: (value, row) => (
            <div className="text-right">
              {typeof value === 'number' ? value.toFixed(2) : '-'}
              {row.weighted_case_study_3_score !== value ? (
                <span className="text-xs text-muted-foreground ml-1">
                  ({row.weighted_case_study_3_score?.toFixed(1)})
                </span>
              ) : null}
            </div>
          ),
          sortable: true
        });
      }
    }
    
    return columns;
  };
  
  const columns = getColumns();

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        {quotaTabs.length > 1 ? (
          <div className="p-2 border-b">
            <Tabs 
              value={selectedTab} 
              onValueChange={setSelectedTab}
              defaultValue="all"
            >
              <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${quotaTabs.length}, 1fr)` }}>
                {quotaTabs.map((tab: any) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : null}
        
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                {columns.map((column) => (
                  <TableHead 
                    key={column.key} 
                    className={column.className}
                  >
                    <div 
                      className={`flex items-center justify-end ${column.key === 'user_name' || column.key === 'position' ? 'justify-start' : ''} ${column.key === 'reservation_type' ? 'justify-center' : ''}`}
                    >
                      <span>{column.title}</span>
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() => handleSort(column.key)}
                        >
                          <ArrowUpDown size={14} className={`${
                            sortColumn === column.key 
                              ? 'text-foreground' 
                              : 'text-muted-foreground'
                          }`} />
                          <span className="sr-only">
                            Ordenar por {column.title}
                          </span>
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actualLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-muted-foreground">Carregando resultados...</div>
                      <Progress className="w-[60%]" value={50} />
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="text-destructive">{errorMessage || 'Erro ao carregar dados'}</div>
                  </TableCell>
                </TableRow>
              ) : sortedRankings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="text-muted-foreground">Nenhum resultado encontrado</div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedRankings.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    className={`${row.is_classified ? 'bg-emerald-50 hover:bg-emerald-100' : ''}`}
                  >
                    {columns.map(column => (
                      <TableCell 
                        key={`${row.id}-${column.key}`} 
                        className={column.className}
                      >
                        {column.render 
                          ? column.render(row[column.key], row, index)
                          : row[column.key]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
