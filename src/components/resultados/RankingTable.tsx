
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Ranking } from '@/services/rankingService';
import { Concurso, getRankingTableColumns } from '@/types/concursos';

interface RankingTableProps {
  rankings?: Ranking[];
  concurso?: Concurso;
  currentUserId?: string | null;
  isAuthenticated: boolean;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  concurso,
  currentUserId,
  isAuthenticated
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Ampla Concorrência");
  
  // Use effect to log available quotas for debugging
  useEffect(() => {
    if (concurso) {
      console.log('Available quotas in concurso:', {
        ampla: concurso.has_ampla_concorrencia,
        ppp: concurso.has_ppp,
        pcd: concurso.has_pcd,
        hipossuficientes: concurso.has_hipossuficientes,
        indigenas: concurso.has_indigenas,
        transsexuais: concurso.has_transsexuais
      });
      
      console.log('Exam structure in concurso:', {
        hasBasic: concurso.has_basic_knowledge,
        hasSpecific1: concurso.has_specific_knowledge_1,
        hasSpecific2: concurso.has_specific_knowledge_2,
        hasSpecific3: concurso.has_specific_knowledge_3,
        hasDiscursive: concurso.has_discursive,
        hasCaseStudy1: concurso.has_case_study_1,
        hasCaseStudy2: concurso.has_case_study_2,
        hasCaseStudy3: concurso.has_case_study_3
      });
    }
    
    if (rankings && rankings.length > 0) {
      console.log('Reservation types in rankings:', 
        [...new Set(rankings.map(r => r.reservationType))]);
    }
  }, [concurso, rankings]);
  
  // Get available quota types from concurso object
  const getAvailableQuotas = () => {
    if (!concurso) return ["Ampla Concorrência"];
    
    const quotas = ["Ampla Concorrência"]; // Ampla is always available
    
    if (concurso.has_ppp) {
      quotas.push("PPP");
    }
    
    if (concurso.has_pcd) {
      quotas.push("PCD");
    }
    
    if (concurso.has_hipossuficientes) {
      quotas.push("Hipossuficientes");
    }
    
    if (concurso.has_indigenas) {
      quotas.push("Indígenas");
    }
    
    if (concurso.has_transsexuais) {
      quotas.push("Pessoas Trans");
    }
    
    console.log('Available quotas for display:', quotas);
    return quotas;
  };
  
  const availableQuotas = getAvailableQuotas();
  
  // Filter rankings by selected reservation type
  const filterRankingsByQuota = (quota: string) => {
    if (!rankings) return [];
    
    if (quota === "Ampla Concorrência") {
      // Everyone participates in Ampla Concorrência
      return rankings;
    }
    
    // For other quotas, filter by reservation_type
    return rankings.filter(ranking => ranking.reservationType === quota);
  };
  
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
  
  // Display quota tabs only if there's more than one quota type available
  return <Card>
      <CardHeader>
        <CardTitle>Classificação Pós-prova</CardTitle>
      </CardHeader>
      <CardContent>
        {availableQuotas.length > 1 ? (
          <Tabs defaultValue="Ampla Concorrência" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {availableQuotas.map(quota => (
                <TabsTrigger key={quota} value={quota} className="text-sm">{quota}</TabsTrigger>
              ))}
            </TabsList>
            
            {availableQuotas.map(quota => (
              <TabsContent key={quota} value={quota}>
                <RankingTableContent 
                  rankings={filterRankingsByQuota(quota)} 
                  currentUserId={currentUserId} 
                  handleUserClick={handleUserClick}
                  concurso={concurso}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <RankingTableContent 
            rankings={rankings || []} 
            currentUserId={currentUserId} 
            handleUserClick={handleUserClick}
            concurso={concurso}
          />
        )}
      </CardContent>
    </Card>;
};

// Extracted table content to a separate component for reuse
const RankingTableContent: React.FC<{
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  concurso?: Concurso;
}> = ({
  rankings,
  currentUserId,
  handleUserClick,
  concurso
}) => {
  // If no concurso data, render a basic table with default columns
  if (!concurso) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-16">#</TableHead>
            <TableHead>Candidato</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.length > 0 ? rankings.map(ranking => (
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
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                Nenhum participante registrado nesta lista ainda
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }
  
  // Get dynamic columns configuration based on the concurso
  const columns = getRankingTableColumns(concurso);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead 
              key={column.id} 
              className={`${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} ${column.width ? `w-${column.width}` : ''}`}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.length > 0 ? rankings.map(ranking => (
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
            
            {concurso.has_basic_knowledge !== false && (
              <TableCell className="text-right">{ranking.basicKnowledgeScore?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_specific_knowledge_1 !== false && (
              <TableCell className="text-right">{(ranking.specificKnowledge1Score || ranking.specificKnowledgeScore)?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_specific_knowledge_2 === true && (
              <TableCell className="text-right">{ranking.specificKnowledge2Score?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_specific_knowledge_3 === true && (
              <TableCell className="text-right">{ranking.specificKnowledge3Score?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_discursive === true && (
              <TableCell className="text-right">{ranking.discursiveScore?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_case_study_1 === true && (
              <TableCell className="text-right">{ranking.caseStudy1Score?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_case_study_2 === true && (
              <TableCell className="text-right">{ranking.caseStudy2Score?.toFixed(2) || '0.00'}</TableCell>
            )}
            
            {concurso.has_case_study_3 === true && (
              <TableCell className="text-right">{ranking.caseStudy3Score?.toFixed(2) || '0.00'}</TableCell>
            )}
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center py-4">
              Nenhum participante registrado nesta lista ainda
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
