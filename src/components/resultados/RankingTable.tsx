
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Concurso, getRankingTableColumns } from '@/types/concursos';
import { UserActions } from '../Admin/UserActions';
import { getEnabledKnowledgeAreas, getDisplayLabel } from '@/services/knowledgeAreaService';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Raw scores for all knowledge areas
  basicKnowledgeScore?: number | null;
  specificKnowledgeScore?: number | null;
  specificKnowledge1Score?: number | null;
  specificKnowledge2Score?: number | null;
  specificKnowledge3Score?: number | null;
  lptScore?: number | null;
  ingScore?: number | null;
  matScore?: number | null;
  rlmScore?: number | null;
  estScore?: number | null;
  cosScore?: number | null;
  admScore?: number | null;
  adoScore?: number | null;
  cotScore?: number | null;
  cocScore?: number | null;
  ecoScore?: number | null;
  triScore?: number | null;
  afoScore?: number | null;
  ltcScore?: number | null;
  ticScore?: number | null;
  ettScore?: number | null;
  audScore?: number | null;
  civScore?: number | null;
  penScore?: number | null;
  infScore?: number | null;
  empScore?: number | null;
  mtfScore?: number | null;
  outScore?: number | null;
  // Discursiva scores
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  // Weighted scores for all knowledge areas
  weightedBasicScore?: number | null;
  weightedSpecific1Score?: number | null;
  weightedSpecific2Score?: number | null;
  weightedSpecific3Score?: number | null;
  weightedLptScore?: number | null;
  weightedIngScore?: number | null;
  weightedMatScore?: number | null;
  weightedRlmScore?: number | null;
  weightedEstScore?: number | null;
  weightedCosScore?: number | null;
  weightedAdmScore?: number | null;
  weightedAdoScore?: number | null;
  weightedCotScore?: number | null;
  weightedCocScore?: number | null;
  weightedEcoScore?: number | null;
  weightedTriScore?: number | null;
  weightedAfoScore?: number | null;
  weightedLtcScore?: number | null;
  weightedTicScore?: number | null;
  weightedEttScore?: number | null;
  weightedAudScore?: number | null;
  weightedCivScore?: number | null;
  weightedPenScore?: number | null;
  weightedInfScore?: number | null;
  weightedEmpScore?: number | null;
  weightedMtfScore?: number | null;
  weightedOutScore?: number | null;
  // Weighted discursive scores
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  // Reservation type
  reservationType: string;
  displayReservation: string;
  id: string;
  quotaPosition?: number; // Position within quota
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
      
      // Log enabled knowledge areas
      const enabledAreas = getEnabledKnowledgeAreas(concurso);
      console.log('Enabled knowledge areas:', enabledAreas.map(area => area.key));
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
      console.log('Reservation types in rankings:', [...new Set(rankings.map(r => r.reservationType))]);
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
        {availableQuotas.length > 1 ? <Tabs defaultValue="Ampla Concorrência" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {availableQuotas.map(quota => <TabsTrigger key={quota} value={quota} className="text-sm">{quota}</TabsTrigger>)}
            </TabsList>
            
            {availableQuotas.map(quota => <TabsContent key={quota} value={quota}>
                <RankingTableContent rankings={filterRankingsByQuota(quota)} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={quota === "Ampla Concorrência"} availableQuotas={availableQuotas} sectionWeights={getSectionWeights(concurso)} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab={quota} />
              </TabsContent>)}
          </Tabs> : <RankingTableContent rankings={rankingsWithQuotaPositions || []} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={true} availableQuotas={availableQuotas} sectionWeights={getSectionWeights(concurso)} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab="Ampla Concorrência" />}
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
  if (!concurso) return {};
  
  // Obter todas as áreas de conhecimento
  const allAreas = getEnabledKnowledgeAreas(concurso);
  
  // Construir um objeto com os pesos de cada área
  const weights: Record<string, number> = {};
  
  // Adicionar os pesos das áreas tradicionais
  weights.basic = concurso.basic_knowledge_weight ?? 1;
  weights.specific1 = concurso.specific_knowledge_1_weight ?? concurso.specific_knowledge_weight ?? 1;
  weights.specific2 = concurso.specific_knowledge_2_weight ?? 1;
  weights.specific3 = concurso.specific_knowledge_3_weight ?? 1;
  weights.discursive = concurso.discursive_weight ?? 1;
  weights.caseStudy1 = concurso.case_study_1_weight ?? 1;
  weights.caseStudy2 = concurso.case_study_2_weight ?? 1;
  weights.caseStudy3 = concurso.case_study_3_weight ?? 1;
  
  // Adicionar os pesos de todas as áreas de conhecimento
  allAreas.forEach(area => {
    if (area.weightField) {
      weights[area.key] = (concurso[area.weightField as keyof Concurso] as number) ?? 1;
    }
  });
  
  return weights;
};

const RankingTableContent: React.FC<{
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  concurso?: Concurso;
  isAmpla: boolean;
  availableQuotas: string[];
  sectionWeights: Record<string, number>;
  isAuthenticated: boolean;
  isRefetching?: boolean;
  activeTab: string;
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
  activeTab
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
  }, [rankings]);

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

  // Obter todas as áreas de conhecimento habilitadas para este concurso
  const enabledKnowledgeAreas = getEnabledKnowledgeAreas(concurso).filter(area => area.questionsField);
  
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
          
          {/* Renderizar cabeçalhos para todas as áreas de conhecimento objetivas habilitadas */}
          {enabledKnowledgeAreas.map(area => (
            // Apenas áreas com questões (não discursivas)
            concurso[area.hasField as keyof Concurso] === true && (
              <TableHead key={area.key} className="text-right">
                {getDisplayLabel(area, concurso)}
              </TableHead>
            )
          ))}
          
          {/* Mostrar colunas para as discursivas */}
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
          
          {isAdminMode && isAuthenticated && <TableHead className="w-24">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody className="space-y-0.5">
        {rankings.length > 0 ? rankings.map(ranking => {
        const scoreChanged = hasScoreChanged(ranking.id, ranking.score);
        return <TableRow key={ranking.userId} className={`${currentUserId && ranking.userId === currentUserId ? 'bg-muted' : ''} ${scoreChanged ? 'bg-green-50' : ''}`}>
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
              
              {/* Renderizar células de pontuação para todas as áreas de conhecimento habilitadas */}
              {enabledKnowledgeAreas.map(area => {
                if (concurso[area.hasField as keyof Concurso] !== true) return null;
                
                // Determinar o nome do campo de pontuação ponderada com base na chave da área
                const scoreFieldName = `weighted${area.key.charAt(0).toUpperCase() + area.key.slice(1)}Score`;
                
                // Acessar a pontuação usando o nome do campo computado
                const score = ranking[scoreFieldName as keyof Ranking] as number | null | undefined;
                
                return (
                  <TableCell key={area.key} className="text-right">
                    {Number(score || 0).toFixed(2)}
                  </TableCell>
                );
              })}
              
              {/* Células para pontuações discursivas */}
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
              
              {isAdminMode && isAuthenticated && <TableCell>
                  <UserActions userId={ranking.userId} userName={ranking.name} rankingId={ranking.id} onSuccess={() => window.location.reload()} showOnlyRankingActions={true} />
                </TableCell>}
            </TableRow>;
      }) : <TableRow>
            <TableCell colSpan={3 + enabledKnowledgeAreas.filter(area => concurso[area.hasField as keyof Concurso] === true).length + 
              (concurso.has_discursive ? 1 : 0) + 
              (concurso.has_case_study_1 ? 1 : 0) + 
              (concurso.has_case_study_2 ? 1 : 0) + 
              (concurso.has_case_study_3 ? 1 : 0) + 
              (isAdminMode && isAuthenticated ? 1 : 0) +
              (!isAmpla ? 1 : 0)} className="text-center py-4">
              Nenhum participante registrado nesta lista ainda
            </TableCell>
          </TableRow>}
      </TableBody>
    </Table>;
};
