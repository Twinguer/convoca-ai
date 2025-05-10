
import React, { useMemo, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Medal } from 'lucide-react';
import { Concurso } from '@/types/concursos';
import { getRankingTableColumns } from '@/types/concursos';
import { UserAvatar } from '@/components/profile/UserAvatar';

interface RankingTableProps {
  rankings: any[];
  concurso: Concurso | null;
  currentUserId?: string;
  isAuthenticated: boolean;
  isRefetching?: boolean;
}

export const RankingTable = ({ 
  rankings, 
  concurso, 
  currentUserId,
  isAuthenticated,
  isRefetching 
}: RankingTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const columns = useMemo(() => {
    if (!concurso) return [];
    return getRankingTableColumns(concurso);
  }, [concurso]);
  
  const totalPages = Math.ceil(rankings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, rankings.length);
  const currentItems = rankings.slice(startIndex, endIndex);
  
  // Navegação de páginas
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Verifica se o usuário está na página atual
  const isUserInCurrentPage = useMemo(() => {
    if (!currentUserId) return false;
    
    return currentItems.some(item => item.user_id === currentUserId);
  }, [currentItems, currentUserId]);
  
  // Se o usuário tem ranking mas não está na página atual, encontra sua posição
  const userPosition = useMemo(() => {
    if (!currentUserId || isUserInCurrentPage) return null;
    
    const userRanking = rankings.find(r => r.user_id === currentUserId);
    if (!userRanking) return null;
    
    const position = rankings.findIndex(r => r.user_id === currentUserId) + 1;
    const userPage = Math.ceil(position / itemsPerPage);
    
    return { position, page: userPage };
  }, [rankings, currentUserId, isUserInCurrentPage, itemsPerPage]);
  
  // Ir para a página do usuário
  const goToUserPage = () => {
    if (userPosition) {
      setCurrentPage(userPosition.page);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={col.id} 
                  className={`text-xs sm:text-sm font-medium ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.width ? `w-[${col.width}px]` : ''}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item, index) => {
              const position = startIndex + index + 1;
              const isCurrentUser = item.user_id === currentUserId;
              
              return (
                <TableRow key={item.id} className={isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : ""}>
                  <TableCell className="py-2 text-center">
                    {isRefetching ? (
                      <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto"></div>
                    ) : (
                      <div className="flex justify-center items-center">
                        {position <= 3 && (
                          <Medal className={`h-4 w-4 ${position === 1 ? 'text-yellow-500' : position === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                        )}
                        <span className={position <= 3 ? 'ml-1' : ''}>{position}</span>
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell className="py-2 flex items-center gap-2 text-left">
                    {isRefetching ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <UserAvatar 
                          name={item.user_name || "Usuário"} 
                          avatarUrl={item.avatar_url} 
                          size="sm" 
                        />
                        <span className={`${isCurrentUser ? "font-semibold" : "font-normal"}`}>
                          {item.user_name || "Usuário anônimo"}
                        </span>
                      </>
                    )}
                  </TableCell>
                  
                  <TableCell className={`py-2 text-right font-medium ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}>
                    {isRefetching ? '' : item.score?.toFixed(2)}
                  </TableCell>
                  
                  {concurso?.has_basic_knowledge && (
                    <TableCell className={`py-2 text-right ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}>
                      {isRefetching ? '' : item.basic_knowledge_score?.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {concurso?.has_specific_knowledge_1 && (
                    <TableCell className={`py-2 text-right ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}>
                      {isRefetching ? '' : item.specific_knowledge_1_score?.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {concurso?.has_specific_knowledge_2 && (
                    <TableCell className={`py-2 text-right ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}>
                      {isRefetching ? '' : item.specific_knowledge_2_score?.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {concurso?.has_specific_knowledge_3 && (
                    <TableCell className={`py-2 text-right ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}>
                      {isRefetching ? '' : item.specific_knowledge_3_score?.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {/* Renderiza células para disciplinas customizadas */}
                  {concurso?.disciplines && Array.isArray(concurso.disciplines) && 
                    concurso.disciplines.map(discipline => (
                      discipline.isEnabled && (
                        <TableCell 
                          key={discipline.type} 
                          className={`py-2 text-right ${isRefetching ? 'animate-pulse bg-gray-200 dark:bg-gray-700 w-12' : ''}`}
                        >
                          {isRefetching ? '' : 
                            (item.customDisciplineScores && 
                            item.customDisciplineScores[discipline.type] !== undefined) ? 
                              item.customDisciplineScores[discipline.type]?.toFixed(2) : '0.00'
                          }
                        </TableCell>
                      )
                    ))
                  }
                </TableRow>
              );
            })}
            
            {rankings.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  {isRefetching ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400">
                      Nenhum participante encontrado neste ranking.
                      {!isAuthenticated && <div className="mt-1 text-sm">Faça login para participar.</div>}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {rankings.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Exibindo {startIndex + 1}-{endIndex} de {rankings.length} resultados
          </div>
          
          <div className="flex gap-1">
            {userPosition && !isUserInCurrentPage && (
              <Button variant="outline" size="sm" onClick={goToUserPage} className="text-xs">
                Ir para minha posição ({userPosition.position})
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center justify-center min-w-[3rem] text-sm">
              {currentPage} / {totalPages}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
