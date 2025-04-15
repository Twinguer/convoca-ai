
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Ranking } from '@/services/rankingService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RankingTableProps {
  rankings?: Ranking[];
  currentUserId?: string | null;
  isAuthenticated: boolean;
  concurso?: any;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  currentUserId,
  isAuthenticated,
  concurso
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
  
  // Determine which columns to show based on the concurso configuration
  const showSpecific1 = concurso?.has_specific_knowledge_1;
  const showSpecific2 = concurso?.has_specific_knowledge_2;
  const showSpecific3 = concurso?.has_specific_knowledge_3;
  const showDiscursive = concurso?.has_discursive;
  const showCaseStudy1 = concurso?.has_case_study_1;
  const showCaseStudy2 = concurso?.has_case_study_2;
  const showCaseStudy3 = concurso?.has_case_study_3;
  
  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Classificação Pós-prova</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-16">#</TableHead>
                <TableHead>Candidato</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">C.B.</TableHead>
                {showSpecific1 && <TableHead className="text-right">C.E.1</TableHead>}
                {showSpecific2 && <TableHead className="text-right">C.E.2</TableHead>}
                {showSpecific3 && <TableHead className="text-right">C.E.3</TableHead>}
                {showDiscursive && <TableHead className="text-right">Dis.</TableHead>}
                {showCaseStudy1 && <TableHead className="text-right">E.C.1</TableHead>}
                {showCaseStudy2 && <TableHead className="text-right">E.C.2</TableHead>}
                {showCaseStudy3 && <TableHead className="text-right">E.C.3</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings && rankings.length > 0 ? (
                rankings.map(ranking => (
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
                    <TableCell className="text-right font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{ranking.score.toFixed(2)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Pontuação total</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{ranking.basicKnowledgeScore?.toFixed(2) || '0.00'}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Conhecimentos Básicos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {showSpecific1 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.specific1Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>C. Específicos 1</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showSpecific2 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.specific2Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>C. Específicos 2</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showSpecific3 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.specific3Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>C. Específicos 3</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showDiscursive && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.discursiveScore?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Discursiva</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showCaseStudy1 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.caseStudy1Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Estudo de Caso 1</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showCaseStudy2 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.caseStudy2Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Estudo de Caso 2</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {showCaseStudy3 && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{ranking.caseStudy3Score?.toFixed(2) || '0.00'}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Estudo de Caso 3</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    Nenhum participante registrado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
