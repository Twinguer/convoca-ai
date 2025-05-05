
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Concurso, getRankingTableColumns } from '@/types/concursos';
import { UserActions } from '../Admin/UserActions';
export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Raw scores
  basicKnowledgeScore?: number | null;
  specificKnowledgeScore?: number | null;
  specificKnowledge1Score?: number | null;
  specificKnowledge2Score?: number | null;
  specificKnowledge3Score?: number | null;
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  // Weighted scores (optional)
  weightedBasicScore?: number | null;
  weightedSpecific1Score?: number | null;
  weightedSpecific2Score?: number | null;
  weightedSpecific3Score?: number | null;
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  // Additional fields
  reservationType: string;
  displayReservation: string;
  id: string;
  quotaPosition?: number; // Position within quota
  isClassified?: boolean; // New field to indicate if the candidate is classified
}
interface RankingTableProps {
  rankings?: Ranking[];
  concurso?: Concurso;
  currentUserId?: string | null;
  isAuthenticated: boolean;
  isRefetching?: boolean;
}
export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  concurso,
  currentUserId,
  isAuthenticated,
  isRefetching = false
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Ampla Concorrência");
  
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

      // Log minimum score requirements
      if (concurso.has_minimum_score) {
        console.log('Minimum score requirements:', {
          type: concurso.minimum_score_type,
          unitType: concurso.minimum_score_unit_type,
          total: concurso.total_minimum_score,
          basic: concurso.basic_knowledge_minimum_score,
          specific1: concurso.specific_knowledge_1_minimum_score,
          specific2: concurso.specific_knowledge_2_minimum_score,
          specific3: concurso.specific_knowledge_3_minimum_score,
        });
      }
    }
    
    if (rankings && rankings.length > 0) {
      console.log('First ranking scores:', {
        total: rankings[0].score,
        basic: rankings[0].basicKnowledgeScore,
        specific1: rankings[0].specificKnowledge1Score,
        specific2: rankings[0].specificKnowledge2Score,
        specific3: rankings[0].specificKnowledge3Score,
        weightedBasic: rankings[0].weightedBasicScore,
        weightedSpecific1: rankings[0].weightedSpecific1Score
      });
      
      console.log('Classification status in rankings:', 
        [...new Set(rankings.map(r => r.isClassified ? 'Classified' : 'Not Classified'))]);
      
      console.log('Reservation types in rankings:', 
        [...new Set(rankings.map(r => r.reservationType))]);
    }
  }, [concurso, rankings]);

  // Calculate quota positions for each ranking
  const rankingsWithQuotaPositions = React.useMemo(() => {
    if (!rankings) return [];

    // Group rankings by reservation type
    const groupedByQuota: Record<string, Ranking[]> = {};
    rankings.forEach(ranking => {
      if (!groupedByQuota[ranking.reservationType]) {
        groupedByQuota[ranking.reservationType] = [];
      }
      groupedByQuota[ranking.reservationType].push(ranking);
    });

    // Calculate position within each quota group
    return rankings.map(ranking => {
      const sameQuotaRankings = groupedByQuota[ranking.reservationType] || [];
      const quotaPosition = sameQuotaRankings.findIndex(r => r.id === ranking.id) + 1;
      return {
        ...ranking,
        quotaPosition
      };
    });
  }, [rankings]);
  
  const getAvailableQuotas = () => {
    if (!concurso) return ["Ampla Concorrência"];
    const quotas = ["Ampla Concorrência"];
    if (concurso.has_ppp === true) {
      quotas.push("PPP");
    }
    if (concurso.has_pcd === true) {
      quotas.push("PCD");
    }
    if (concurso.has_hipossuficientes === true) {
      quotas.push("Hipossuficientes");
    }
    if (concurso.has_indigenas === true) {
      quotas.push("Indígenas");
    }
    if (concurso.has_transsexuais === true) {
      quotas.push("Pessoas Trans");
    }
    console.log('Available quotas for display:', quotas);
    return quotas;
  };
  
  const availableQuotas = getAvailableQuotas();
  const filterRankingsByQuota = (quota: string) => {
    if (!rankingsWithQuotaPositions) return [];
    if (quota === "Ampla Concorrência") {
      return rankingsWithQuotaPositions;
    }
    return rankingsWithQuotaPositions.filter(ranking => ranking.reservationType === quota);
  };
  
  const handleUserClick = (userId: string) => {
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/usuario/${userId}`);
    } else {
      navigate(`/usuario/${userId}`);
    }
  };

  // Check if concurso has minimum score requirements
  const hasMinimumScoreRequirements = concurso?.has_minimum_score === true;
  
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Classificação Pós-prova</CardTitle>
        {isRefetching && <div className="flex items-center text-xs text-amber-600 gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Atualizando dados...</span>
          </div>}
        {!isAuthenticated && <div className="text-sm text-muted-foreground mt-1">
            <Link to="/auth" className="text-primary hover:underline">
              Faça login
            </Link> para participar deste ranking ou para acessar perfis completos.
          </div>}
      </CardHeader>
      <CardContent>
        {hasMinimumScoreRequirements && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700 font-medium">
              Este concurso possui nota de corte. Candidatos que não atingiram a pontuação mínima exigida 
              estão marcados em cinza.
            </p>
          </div>
        )}
        
        {availableQuotas.length > 1 ? <Tabs defaultValue="Ampla Concorrência" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {availableQuotas.map(quota => <TabsTrigger key={quota} value={quota} className="text-sm">{quota}</TabsTrigger>)}
            </TabsList>
            
            {availableQuotas.map(quota => <TabsContent key={quota} value={quota}>
                <RankingTableContent rankings={filterRankingsByQuota(quota)} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={quota === "Ampla Concorrência"} availableQuotas={availableQuotas} sectionWeights={getSectionWeights(concurso)} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab={quota} hasMinimumScoreRequirements={hasMinimumScoreRequirements} />
              </TabsContent>)}
          </Tabs> : <RankingTableContent rankings={rankingsWithQuotaPositions || []} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={true} availableQuotas={availableQuotas} sectionWeights={getSectionWeights(concurso)} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab="Ampla Concorrência" hasMinimumScoreRequirements={hasMinimumScoreRequirements} />}
      </CardContent>
    </Card>;
};

const getQuotaAbbreviation = (quota: string): string => {
  if (quota === "Ampla Concorrência") return "AC";
  const abbreviations: Record<string, string> = {
    "PPP": "PPP",
    "PCD": "PCD",
    "Hipossuficientes": "Hip",
    "Indígenas": "Ind",
    "Pessoas Trans": "Tra"
  };
  return abbreviations[quota] || quota.substring(0, 3);
};

const getSectionWeights = (concurso?: Concurso) => {
  return {
    basic: concurso?.basic_knowledge_weight ?? 1,
    specific1: concurso?.specific_knowledge_1_weight ?? concurso?.specific_knowledge_weight ?? 1,
    specific2: concurso?.specific_knowledge_2_weight ?? 1,
    specific3: concurso?.specific_knowledge_3_weight ?? 1,
    discursive: concurso?.discursive_weight ?? 1,
    caseStudy1: concurso?.case_study_1_weight ?? 1,
    caseStudy2: concurso?.case_study_2_weight ?? 1,
    caseStudy3: concurso?.case_study_3_weight ?? 1
  };
};

const RankingTableContent: React.FC<{
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  concurso?: Concurso;
  isAmpla: boolean;
  availableQuotas: string[];
  sectionWeights: {
    basic: number;
    specific1: number;
    specific2: number;
    specific3: number;
    discursive: number;
    caseStudy1: number;
    caseStudy2: number;
    caseStudy3: number;
  };
  isAuthenticated: boolean;
  isRefetching?: boolean;
  activeTab: string;
  hasMinimumScoreRequirements: boolean;
}> = ({
  rankings,
  currentUserId,
  handleUserClick,
  concurso,
  isAmpla,
  availableQuotas,
  sectionWeights,
  isAuthenticated,
  isRefetching = false,
  activeTab,
  hasMinimumScoreRequirements
}) => {
  const isAdminMode = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('admin') === 'true';
  }, []);

  // Estado para armazenar as pontuações ao carregar a tabela
  const [initialScores, setInitialScores] = useState<{
    [key: string]: number;
  }>({});

  // Inicializar as pontuações iniciais na primeira renderização
  useEffect(() => {
    const scores: {
      [key: string]: number;
    } = {};
    rankings.forEach(ranking => {
      scores[ranking.id] = ranking.score;
    });
    setInitialScores(scores);
  }, []);

  // Função para verificar se uma pontuação foi atualizada
  const hasScoreChanged = (rankingId: string, currentScore: number): boolean => {
    return initialScores[rankingId] !== undefined && initialScores[rankingId] !== currentScore && !isRefetching;
  };
  
  if (!concurso) {
    return <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center w-16">AC</TableHead>
            {isAmpla && <TableHead className="text-center w-16">AP</TableHead>}
            <TableHead>Candidato</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {isAdminMode && isAuthenticated && <TableHead className="w-24">Ações</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.length > 0 ? rankings.map(ranking => <TableRow key={ranking.userId} className={currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}>
              <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
              {isAmpla && <TableCell className="text-center font-bold">
                {ranking.reservationType === "Ampla Concorrência" ? ranking.position + "º" : ""}
              </TableCell>}
              <TableCell>
                <div className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => handleUserClick(ranking.userId)}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
                    <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{ranking.name}</span>
                  {isAmpla && ranking.reservationType !== "Ampla Concorrência" && <span className="ml-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {getQuotaAbbreviation(ranking.reservationType)}
                    </span>}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{ranking.score.toFixed(2)}</TableCell>
              {isAdminMode && isAuthenticated && <TableCell>
                  <UserActions userId={ranking.userId} userName={ranking.name} rankingId={ranking.id} onSuccess={() => window.location.reload()} showOnlyRankingActions={true} />
                </TableCell>}
            </TableRow>) : <TableRow>
              <TableCell colSpan={isAdminMode && isAuthenticated ? isAmpla ? 5 : 4 : isAmpla ? 4 : 3} className="text-center py-4">
                Nenhum participante registrado nesta lista ainda
              </TableCell>
            </TableRow>}
        </TableBody>
      </Table>;
  }
  
  const columns = getRankingTableColumns(concurso);
  
  return <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-16">AC</TableHead>
          {!isAmpla && <TableHead className="text-center w-16">
            {getQuotaAbbreviation(activeTab)}
          </TableHead>}
          {isAmpla}
          <TableHead>Candidato</TableHead>
          <TableHead className="text-right">Total</TableHead>
          
          {concurso.has_basic_knowledge === true && <TableHead className="text-right">
              Básica
            </TableHead>}
          
          {concurso.has_specific_knowledge_1 === true && <TableHead className="text-right">
              Específica 1
            </TableHead>}
          
          {concurso.has_specific_knowledge_2 === true && <TableHead className="text-right">
              Específica 2
            </TableHead>}
          
          {concurso.has_specific_knowledge_3 === true && <TableHead className="text-right">
              Específica 3
            </TableHead>}
          
          {concurso.has_discursive === true && <TableHead className="text-right">
              Discursiva
            </TableHead>}
          
          {concurso.has_case_study_1 === true && <TableHead className="text-right">
              Estudo 1
            </TableHead>}
          
          {concurso.has_case_study_2 === true && <TableHead className="text-right">
              Estudo 2
            </TableHead>}
          
          {concurso.has_case_study_3 === true && <TableHead className="text-right">
              Estudo 3
            </TableHead>}
            
          {hasMinimumScoreRequirements && (
            <TableHead className="text-center w-24">Status</TableHead>
          )}
            
          {isAdminMode && isAuthenticated && <TableHead className="w-24">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody className="space-y-0.5">
        {rankings.length > 0 ? rankings.map(ranking => {
        const scoreChanged = hasScoreChanged(ranking.id, ranking.score);
        const isNotClassified = hasMinimumScoreRequirements && ranking.isClassified === false;
        
        return <TableRow 
              key={ranking.userId} 
              className={`
                ${currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''}
                ${isNotClassified ? 'bg-gray-50 text-gray-500' : (scoreChanged ? 'bg-green-50' : '')}
              `}
            >
              <TableCell className="text-center font-bold">{ranking.position}º</TableCell>
              {!isAmpla && <TableCell className="text-center font-bold">
                {ranking.quotaPosition}º
              </TableCell>}
              {isAmpla}
              <TableCell>
                <div className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => handleUserClick(ranking.userId)}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={ranking.avatarUrl || undefined} alt={ranking.name} />
                    <AvatarFallback>{ranking.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>
                    {ranking.name}
                    {isAmpla && ranking.reservationType !== "Ampla Concorrência" && <span className="ml-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        ({getQuotaAbbreviation(ranking.reservationType)})
                      </span>}
                  </span>
                </div>
              </TableCell>
              <TableCell className={`text-right font-medium ${scoreChanged ? 'text-emerald-600' : ''}`}>
                {ranking.score.toFixed(2)}
                {scoreChanged}
              </TableCell>
              
              {concurso.has_basic_knowledge === true && <TableCell className="text-right">
                  {Number(ranking.weightedBasicScore || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_specific_knowledge_1 === true && <TableCell className="text-right">
                  {Number(ranking.weightedSpecific1Score || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_specific_knowledge_2 === true && <TableCell className="text-right">
                  {Number(ranking.weightedSpecific2Score || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_specific_knowledge_3 === true && <TableCell className="text-right">
                  {Number(ranking.weightedSpecific3Score || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_discursive === true && <TableCell className="text-right">
                  {Number(ranking.weightedDiscursiveScore || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_case_study_1 === true && <TableCell className="text-right">
                  {Number(ranking.weightedCaseStudy1Score || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_case_study_2 === true && <TableCell className="text-right">
                  {Number(ranking.weightedCaseStudy2Score || 0).toFixed(2)}
                </TableCell>}
              
              {concurso.has_case_study_3 === true && <TableCell className="text-right">
                  {Number(ranking.weightedCaseStudy3Score || 0).toFixed(2)}
                </TableCell>}
                
              {hasMinimumScoreRequirements && (
                <TableCell className="text-center">
                  {ranking.isClassified ? (
                    <div className="flex items-center justify-center text-emerald-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Classificado</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-400">
                      <XCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Não classificado</span>
                    </div>
                  )}
                </TableCell>
              )}
              
              {isAdminMode && isAuthenticated && <TableCell>
                  <UserActions userId={ranking.userId} userName={ranking.name} rankingId={ranking.id} onSuccess={() => window.location.reload()} showOnlyRankingActions={true} />
                </TableCell>}
            </TableRow>;
      }) : <TableRow>
            <TableCell colSpan={(columns.length + (hasMinimumScoreRequirements ? 1 : 0) + (isAdminMode && isAuthenticated ? 1 : 0)) + (isAmpla ? 1 : 1)} className="text-center py-4">
              Nenhum participante registrado nesta lista ainda
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};
