
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';
import { UserActions } from '../Admin/UserActions';
import { getDisciplines, sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';
import { Ranking } from '@/services/rankingService';

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
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        console.log('Custom disciplines:', concurso.disciplines);
      }
    }
    if (rankings && rankings.length > 0) {
      console.log('First ranking scores:', {
        total: rankings[0].score,
        customScores: rankings[0].customDisciplineScores,
        weightedCustomScores: rankings[0].weightedCustomDisciplineScores
      });
      console.log('Reservation types in rankings:', [...new Set(rankings.map(r => r.reservationType))]);
      
      // Debugging minimum scores
      console.log('Minimum score checks:', rankings.map(r => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        belowMinimum: r.belowMinimum,
        belowBlockMinimums: r.belowBlockMinimums,
        belowDisciplineMinimums: r.belowDisciplineMinimums
      })));
    }
  }, [concurso, rankings]);

  // Calcular posições de cota para cada ranking
  const rankingsWithQuotaPositions = React.useMemo(() => {
    if (!rankings) return [];

    // Agrupar rankings por tipo de reserva
    const groupedByQuota: Record<string, Ranking[]> = {};
    rankings.forEach(ranking => {
      if (!groupedByQuota[ranking.reservationType]) {
        groupedByQuota[ranking.reservationType] = [];
      }
      groupedByQuota[ranking.reservationType].push(ranking);
    });

    // Calcular posição dentro de cada grupo de cota
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
                <RankingTableContent rankings={filterRankingsByQuota(quota)} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={quota === "Ampla Concorrência"} availableQuotas={availableQuotas} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab={quota} />
              </TabsContent>)}
          </Tabs> : <RankingTableContent rankings={rankingsWithQuotaPositions || []} currentUserId={currentUserId} handleUserClick={handleUserClick} concurso={concurso} isAmpla={true} availableQuotas={availableQuotas} isAuthenticated={isAuthenticated} isRefetching={isRefetching} activeTab="Ampla Concorrência" />}
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

const RankingTableContent: React.FC<{
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  concurso?: Concurso;
  isAmpla: boolean;
  availableQuotas: string[];
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

  // Função para determinar se um ranking está abaixo do mínimo exigido
  const isBelowMinimum = (ranking: Ranking): boolean => {
    return !!ranking.belowMinimum || 
           (ranking.belowBlockMinimums && ranking.belowBlockMinimums.length > 0) || 
           (ranking.belowDisciplineMinimums && ranking.belowDisciplineMinimums.length > 0);
  };
  
  // Função para calcular a pontuação objetiva total do ranking
  const calculateObjectiveScore = (ranking: Ranking): number => {
    // Se há disciplinas customizadas
    if (ranking.weightedCustomDisciplineScores && Object.keys(ranking.weightedCustomDisciplineScores).length > 0) {
      return Object.values(ranking.weightedCustomDisciplineScores).reduce((sum, score) => sum + Number(score || 0), 0);
    }
    
    // Caso contrário, usar pontuações tradicionais
    return 0; // Implementar caso necessário
  };

  // Obter disciplinas customizadas habilitadas
  const getCustomDisciplines = (): {
    type: string;
    name: string;
  }[] => {
    if (!concurso || !concurso.disciplines || !Array.isArray(concurso.disciplines)) {
      return [];
    }
    return concurso.disciplines.filter(d => d.isEnabled).map(d => ({
      type: d.type,
      name: d.name
    }));
  };
  const customDisciplines = getCustomDisciplines();
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

  // Determinar as colunas da tabela com base nas disciplinas do concurso
  const renderTableHeader = () => <TableHeader>
      <TableRow>
        <TableHead className="text-center w-16">ac</TableHead>
        {!isAmpla && <TableHead className="text-center w-16">
          {getQuotaAbbreviation(activeTab)}
        </TableHead>}
        <TableHead>part</TableHead>
        <TableHead className="text-right">tot</TableHead>
        
        {/* Colunas de disciplinas customizadas */}
        {customDisciplines.map((discipline, idx) => <TableHead key={`custom-${idx}`} className="text-right">
            {discipline.name}
          </TableHead>)}
        
        {/* Partes subjetivas */}
        {concurso.has_discursive === true && <TableHead className="text-right">dis</TableHead>}
        
        {concurso.has_case_study_1 === true && <TableHead className="text-right">ec1</TableHead>}
        
        {concurso.has_case_study_2 === true && <TableHead className="text-right">ec2</TableHead>}
        
        {concurso.has_case_study_3 === true && <TableHead className="text-right">ec3</TableHead>}
          
        {isAdminMode && isAuthenticated && <TableHead className="w-24">Ações</TableHead>}
      </TableRow>
    </TableHeader>;

  // Renderizar cada linha de ranking
  const renderRankingRows = () => <TableBody className="space-y-0.5">
      {rankings.length > 0 ? rankings.map(ranking => {
      const scoreChanged = hasScoreChanged(ranking.id, ranking.score);
      const belowMinimum = isBelowMinimum(ranking);
      
      // Aplicar classe para destacar participantes abaixo do mínimo em vermelho
      const rowColorClass = belowMinimum 
        ? 'text-red-600' 
        : (currentUserId && ranking.userId === currentUserId 
            ? 'bg-muted' 
            : scoreChanged 
              ? 'bg-green-50' 
              : '');
      
      return <TableRow key={ranking.userId} className={rowColorClass}>
            <TableCell className="text-center font-bold">
              {belowMinimum 
                ? <span className="text-red-600 font-bold">E</span> 
                : `${ranking.position}º`
              }
            </TableCell>
            
            {!isAmpla && <TableCell className="text-center font-bold">
              {belowMinimum 
                ? <span className="text-red-600 font-bold">E</span>
                : `${ranking.quotaPosition}º`
              }
            </TableCell>}
            
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
            
            <TableCell className={`text-right font-medium ${scoreChanged && !belowMinimum ? 'text-emerald-600' : ''}`}>
              {ranking.score.toFixed(2)}
              {belowMinimum && <span className="ml-2 text-xs text-red-600"></span>}
            </TableCell>
            
            {/* Pontuações de disciplinas customizadas */}
            {customDisciplines.map((discipline, idx) => {
              // Access the score using the discipline type as the key
              const scoreValue = ranking.weightedCustomDisciplineScores?.[discipline.type] || 0;
              // Verificar se esta disciplina específica está abaixo do mínimo
              const isDisciplineBelowMinimum = ranking.belowDisciplineMinimums?.includes(discipline.type);
              
              return <TableCell key={`custom-score-${idx}`} className={`text-right ${isDisciplineBelowMinimum ? 'text-red-600 font-bold' : ''}`}>
                      {Number(scoreValue).toFixed(2)}
                    </TableCell>;
            })}
            
            {/* Pontuações de partes subjetivas */}
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
          <TableCell colSpan={4 + customDisciplines.length + (concurso.has_discursive ? 1 : 0) + (concurso.has_case_study_1 ? 1 : 0) + (concurso.has_case_study_2 ? 1 : 0) + (concurso.has_case_study_3 ? 1 : 0) + (isAdminMode && isAuthenticated ? 1 : 0)} className="text-center py-4">
            Nenhum participante registrado nesta lista ainda
          </TableCell>
        </TableRow>}
    </TableBody>;
  return <Table>
      {renderTableHeader()}
      {renderRankingRows()}
    </Table>;
};
