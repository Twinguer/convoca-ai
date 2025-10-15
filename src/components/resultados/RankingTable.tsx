import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Concurso, isDisciplineBlock } from '@/types/concursos';
import { UserActions } from '../Admin/UserActions';
import { getDisciplines, sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';
import { Ranking } from '@/services/rankingService';
import { useQuotaCache } from '@/hooks/useQuotaCache';
import { UserUrlObfuscationService } from '@/services/userUrlObfuscation';
import { LoadMoreButton } from './LoadMoreButton';

interface RankingTableProps {
  rankings?: Ranking[];
  concurso?: Concurso;
  currentUserId?: string | null;
  isAuthenticated: boolean;
  isRefetching?: boolean;
  // Props de paginação
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalLoaded?: number;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  concurso,
  currentUserId,
  isAuthenticated,
  isRefetching = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  totalLoaded = 0
}) => {
  const navigate = useNavigate();

  // Debug: verificar se os rankings estão sendo recebidos
  // useEffect(() => {
  //   console.log('RankingTable received rankings:', {
  //     rankingsLength: rankings?.length || 0,
  //     rankings: rankings?.slice(0, 3), // Primeiros 3 para debug
  //     hasMore,
  //     totalLoaded,
  //     isAuthenticated,
  //     currentUserId
  //   });
  // }, [rankings, hasMore, totalLoaded, isAuthenticated, currentUserId]);

  // Debug: verificar se o componente está sendo renderizado
  // console.log('RankingTable render:', {
  //   rankingsLength: rankings?.length || 0,
  //   isLoadingMore,
  //   hasMore,
  //   totalLoaded
  // });
  // const { generateSecureUserUrl } = useSecureUserUrls();
  const [activeTab, setActiveTab] = useState("Ampla Concorrência");
  const [displayNames, setDisplayNames] = useState<Record<string, string>>(sectionDisplayNames);

  useEffect(() => {
    // Update section display names with custom disciplines when concurso is available
    if (concurso) {
      const updatedNames = updateSectionDisplayNames(concurso);
      setDisplayNames(updatedNames);
      // Log removido por segurança
    }
  }, [concurso]);

  // Logs removidos para reduzir overhead em produção
  useEffect(() => {
    // Efeito mantido para compatibilidade, mas sem logs
  }, [concurso, rankings]);

  // Helper function to determine if a ranking is below the required minimum
  const isBelowMinimum = (ranking: Ranking): boolean => {
    // Verificação existente para mínimos por disciplina/bloco
    const hasDisciplineMinimums = ranking.belowDisciplineMinimums && 
      ranking.belowDisciplineMinimums.length > 0;
    const hasBlockMinimums = ranking.belowBlockMinimums && 
      ranking.belowBlockMinimums.length > 0;
    
    // NOVA LÓGICA: Para provas "Certo ou Errado", eliminar se nota <= 0
    const isCertoErradoEliminated = concurso?.exam_type === 'Certo ou Errado' && 
      ranking.score <= 0;
    
    // NOVA LÓGICA: Para provas "Alternativas", eliminar se nota <= 0
    const isAlternativasEliminated = concurso?.exam_type === 'Alternativas' && 
      ranking.score <= 0;
    
    
    return !!ranking.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || isCertoErradoEliminated || isAlternativasEliminated;
  };

  // Calculate quota positions for each ranking, separating classified from eliminated
  const rankingsWithQuotaPositions = React.useMemo(() => {
    if (!rankings) return [];

    // Separate classified from eliminated users
    const classifiedRankings = rankings.filter(ranking => !isBelowMinimum(ranking));
    const eliminatedRankings = rankings.filter(ranking => isBelowMinimum(ranking));

    // Sort classified rankings by score (descending)
    classifiedRankings.sort((a, b) => b.score - a.score);
    
    // Sort eliminated rankings by score (descending) but they go to the end
    eliminatedRankings.sort((a, b) => b.score - a.score);

    // Group classified rankings by reservation type
    const groupedByQuota: Record<string, Ranking[]> = {};
    classifiedRankings.forEach(ranking => {
      if (!groupedByQuota[ranking.reservationType]) {
        groupedByQuota[ranking.reservationType] = [];
      }
      groupedByQuota[ranking.reservationType].push(ranking);
    });

    // Calculate positions for classified users
    const classifiedWithPositions = classifiedRankings.map((ranking, index) => {
      const sameQuotaRankings = groupedByQuota[ranking.reservationType] || [];
      const quotaPosition = sameQuotaRankings.findIndex(r => r.id === ranking.id) + 1;
      return {
        ...ranking,
        position: index + 1, // Override position based on classification
        quotaPosition
      };
    });

    // Eliminated users don't get positions, they're marked as eliminated
    const eliminatedWithoutPositions = eliminatedRankings.map(ranking => ({
      ...ranking,
      position: 0, // No position for eliminated users
      quotaPosition: 0
    }));

    // Return classified users first, then eliminated users
    return [...classifiedWithPositions, ...eliminatedWithoutPositions];
  }, [rankings]);

  // Usar cache de cotas para otimizar performance
  const { data: quotaConfig } = useQuotaCache(concurso?.id || '');
  
  const getAvailableQuotas = React.useMemo(() => {
    if (!concurso) return ["Ampla Concorrência"];
    
    // Usar dados do cache se disponível, senão usar dados do concurso
    const config = quotaConfig || {
      has_ampla_concorrencia: concurso.has_ampla_concorrencia,
      has_ppp: concurso.has_ppp,
      has_pcd: concurso.has_pcd,
      has_hipossuficientes: concurso.has_hipossuficientes,
      has_indigenas: concurso.has_indigenas,
      has_transsexuais: concurso.has_transsexuais,
    };
    
    const quotas = ["Ampla Concorrência"];
    if (config.has_ppp === true) {
      quotas.push("PPP");
    }
    if (config.has_pcd === true) {
      quotas.push("PCD");
    }
    if (config.has_hipossuficientes === true) {
      quotas.push("Hipossuficientes");
    }
    if (config.has_indigenas === true) {
      quotas.push("Indígenas");
    }
    if (config.has_transsexuais === true) {
      quotas.push("Pessoas Trans");
    }
    return quotas;
  }, [concurso, quotaConfig]);

  const availableQuotas = getAvailableQuotas;

  const filterRankingsByQuota = (quota: string) => {
    if (!rankingsWithQuotaPositions) return [];
    if (quota === "Ampla Concorrência") {
      return rankingsWithQuotaPositions;
    }
    return rankingsWithQuotaPositions.filter(ranking => ranking.reservationType === quota);
  };

  const handleUserClick = async (userId: string) => {
    console.log('handleUserClick called with userId:', userId);
    
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId:', userId);
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: window.location.pathname } });
      return;
    }
    
    try {
      // Usar o sistema de ofuscação de URLs para navegar para o perfil
      const secureUrl = await UserUrlObfuscationService.generateSecureProfileUrl(userId);
      console.log('Generated secure URL:', secureUrl);
      navigate(secureUrl);
    } catch (error) {
      console.error('Erro ao gerar URL segura de usuário:', error);
      // Fallback: usar a rota correta do sistema
      console.log('Using fallback URL:', `/usuario/profile/${userId}`);
      navigate(`/usuario/profile/${userId}`);
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
                <RankingTableContent 
                  rankings={filterRankingsByQuota(quota)} 
                  currentUserId={currentUserId} 
                  handleUserClick={handleUserClick} 
                  concurso={concurso} 
                  isAmpla={quota === "Ampla Concorrência"} 
                  availableQuotas={availableQuotas} 
                  isAuthenticated={isAuthenticated} 
                  isRefetching={isRefetching} 
                  activeTab={quota}
                  displayNames={displayNames} // Pass display names
                  hasMore={hasMore}
                  onLoadMore={onLoadMore}
                  isLoadingMore={isLoadingMore}
                  totalLoaded={totalLoaded}
                />
              </TabsContent>)}
          </Tabs> : <RankingTableContent 
                    rankings={rankingsWithQuotaPositions || []} 
                    currentUserId={currentUserId} 
                    handleUserClick={handleUserClick} 
                    concurso={concurso} 
                    isAmpla={true} 
                    availableQuotas={availableQuotas} 
                    isAuthenticated={isAuthenticated} 
                    isRefetching={isRefetching} 
                    activeTab="Ampla Concorrência" 
                    displayNames={displayNames} // Pass display names
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                    isLoadingMore={isLoadingMore}
                    totalLoaded={totalLoaded}
                  />}
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
  displayNames: Record<string, string>; // Added display names prop
  // Props de paginação
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalLoaded?: number;
}> = ({
  rankings,
  currentUserId,
  handleUserClick,
  concurso,
  isAmpla,
  availableQuotas,
  isAuthenticated,
  isRefetching = false,
  activeTab,
  displayNames, // Accept display names
  // Props de paginação
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  totalLoaded = 0
}) => {
  const isAdminMode = React.useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('admin') === 'true';
  }, []);

  // State to store scores when table is loaded
  const [initialScores, setInitialScores] = useState<{
    [key: string]: number;
  }>({});

  // Initialize initial scores on first render
  useEffect(() => {
    const scores: {
      [key: string]: number;
    } = {};
    rankings.forEach(ranking => {
      scores[ranking.id] = ranking.score;
    });
    setInitialScores(scores);
  }, [rankings]);

  // Function to check if a score has been updated
  const hasScoreChanged = (rankingId: string, currentScore: number): boolean => {
    return initialScores[rankingId] !== undefined && initialScores[rankingId] !== currentScore && !isRefetching;
  };

  // Function to determine if a ranking is below the required minimum
  const isBelowMinimum = (ranking: Ranking): boolean => {
    // Verificação existente para mínimos por disciplina/bloco
    const hasDisciplineMinimums = ranking.belowDisciplineMinimums && 
      ranking.belowDisciplineMinimums.length > 0;
    const hasBlockMinimums = ranking.belowBlockMinimums && 
      ranking.belowBlockMinimums.length > 0;
    
    // NOVA LÓGICA: Para provas "Certo ou Errado", eliminar se nota <= 0
    const isCertoErradoEliminated = concurso?.exam_type === 'Certo ou Errado' && 
      ranking.score <= 0;
    
    // NOVA LÓGICA: Para provas "Alternativas", eliminar se nota <= 0
    const isAlternativasEliminated = concurso?.exam_type === 'Alternativas' && 
      ranking.score <= 0;
    
    
    return !!ranking.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || isCertoErradoEliminated || isAlternativasEliminated;
  };
  
  // Function to calculate the objective total score of the ranking
  const calculateObjectiveScore = (ranking: Ranking): number => {
    // If there are custom disciplines
    if (ranking.weightedCustomDisciplineScores && Object.keys(ranking.weightedCustomDisciplineScores).length > 0) {
      return Object.values(ranking.weightedCustomDisciplineScores).reduce((sum, score) => sum + Number(score || 0), 0);
    }
    
    // Otherwise, use traditional scores
    return 0; // Implement if necessary
  };

  // Get enabled custom disciplines from the nested structure (blocks with disciplines)
  const getCustomDisciplines = (): {
    type: string;
    name: string;
  }[] => {
    if (!concurso || !concurso.disciplines || !Array.isArray(concurso.disciplines)) {
      return [];
    }

    let allEnabledDisciplines: { type: string; name: string }[] = [];

    // Check if hierarchical structure
    const isHierarchical = concurso.disciplines.length > 0 && 
                          isDisciplineBlock(concurso.disciplines[0]);

    if (isHierarchical) {
      // Iterate through blocks (first level in the disciplines array)
      for (const block of concurso.disciplines) {
        // Check if the block is valid and has a disciplines array
        if (isDisciplineBlock(block)) {
          // Iterate through disciplines within the block
          for (const discipline of block.disciplines) {
            // Check if discipline is valid, enabled and has type and name properties
            if (
              discipline &&
              typeof discipline === 'object' &&
              discipline.isEnabled === true &&
              typeof discipline.type === 'string' &&
              typeof discipline.name === 'string'
            ) {
              allEnabledDisciplines.push({
                type: discipline.type,
                name: discipline.name,
              });
            }
          }
        }
      }
    } else {
      // Flat structure - handle disciplines directly
      for (const discipline of concurso.disciplines) {
        if (
          discipline &&
          typeof discipline === 'object' &&
          'isEnabled' in discipline &&
          discipline.isEnabled === true &&
          'type' in discipline &&
          'name' in discipline
        ) {
          allEnabledDisciplines.push({
            type: discipline.type as string,
            name: discipline.name as string,
          });
        }
      }
    }

    return allEnabledDisciplines;
  };

  const customDisciplines = getCustomDisciplines();
  
  if (!concurso) {
    // ... keep existing code for the simplified table
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

  // Determine table columns based on concurso disciplines
  const renderTableHeader = () => <TableHeader>
      <TableRow>
        <TableHead className="text-center w-16">ac</TableHead>
        {!isAmpla && <TableHead className="text-center w-16">
          {getQuotaAbbreviation(activeTab)}
        </TableHead>}
        <TableHead>part</TableHead>
        <TableHead className="text-right">tot</TableHead>
        
        {/* Custom discipline columns */}
        {customDisciplines.map((discipline, idx) => <TableHead key={`custom-${idx}`} className="text-right">
            {discipline.name}
          </TableHead>)}
        
        {/* Subjective parts */}
        {concurso.has_discursive === true && <TableHead className="text-right">dis</TableHead>}
        
        {concurso.has_case_study_1 === true && <TableHead className="text-right">ec1</TableHead>}
        
        {concurso.has_case_study_2 === true && <TableHead className="text-right">ec2</TableHead>}
        
        {concurso.has_case_study_3 === true && <TableHead className="text-right">ec3</TableHead>}
        
        {(() => {
          // Verificar se tem seção "Outro" usando sistema híbrido
          const hasOtherDirect = concurso.has_other_subjective === true;
          const hasOtherJsonb = concurso.disciplines?.some(discipline => {
            if ('disciplines' in discipline) {
              return discipline.disciplines?.some(d => 
                d.isEnabled && d.type === 'other_subjective'
              );
            } else {
              return discipline.isEnabled && discipline.type === 'other_subjective';
            }
          }) || false;
          
          const hasOther = hasOtherDirect || hasOtherJsonb;
          
          return hasOther ? (
            <TableHead className="text-right">
              {concurso.other_subjective_name || 'Outro'}
            </TableHead>
          ) : null;
        })()}
          
        {isAdminMode && isAuthenticated && <TableHead className="w-24">Ações</TableHead>}
      </TableRow>
    </TableHeader>;

  // Render each ranking row
  const renderRankingRows = () => {
    console.log('[RankingTable] renderRankingRows debug:', {
      rankingsLength: rankings?.length || 0,
      currentUserId,
      isAuthenticated,
      customDisciplinesLength: customDisciplines?.length || 0
    });
    
    return <TableBody className="space-y-0.5">
      {rankings.length > 0 ? rankings.map(ranking => {
      const scoreChanged = hasScoreChanged(ranking.id, ranking.score);
      const belowMinimum = isBelowMinimum(ranking);
      
      // Apply class to highlight participants below minimum in red
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
                : ranking.position > 0 
                  ? `${ranking.position}º`
                  : '-'
              }
            </TableCell>
            
            {!isAmpla && <TableCell className="text-center font-bold">
              {belowMinimum 
                ? <span className="text-red-600 font-bold">E</span>
                : ranking.quotaPosition > 0
                  ? `${ranking.quotaPosition}º`
                  : '-'
              }
            </TableCell>}
            
            <TableCell>
              <div className="flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => {
                console.log('User click debug:', { userId: ranking.userId, name: ranking.name });
                handleUserClick(ranking.userId);
              }}>
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
            
            {/* Custom discipline scores */}
            {customDisciplines.map((discipline, idx) => {
              // Access the score using the discipline type as the key
              const scoreValue = ranking.weightedCustomDisciplineScores?.[discipline.type] || 0;
              // Check if this specific discipline is below minimum
              const isDisciplineBelowMinimum = ranking.belowDisciplineMinimums?.includes?.(discipline.type) || false;
              
              return <TableCell key={`custom-score-${idx}`} className={`text-right ${isDisciplineBelowMinimum ? 'text-red-600 font-bold' : ''}`}>
                      {Number(scoreValue).toFixed(2)}
                    </TableCell>;
            })}
            
            {/* Subjective part scores */}
            {concurso.has_discursive === true && <TableCell className="text-right">
                {(() => {
                  console.log('Discursive score debug:', {
                    rankingId: ranking.id,
                    weightedDiscursiveScore: ranking.weightedDiscursiveScore,
                    discursiveScore: ranking.discursiveScore
                  });
                  return Number(ranking.weightedDiscursiveScore || 0).toFixed(2);
                })()}
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
            
            {(() => {
              // Verificar se tem seção "Outro" usando sistema híbrido
              const hasOtherDirect = concurso.has_other_subjective === true;
              const hasOtherJsonb = concurso.disciplines?.some(discipline => {
                if ('disciplines' in discipline) {
                  return discipline.disciplines?.some(d => 
                    d.isEnabled && d.type === 'other_subjective'
                  );
                } else {
                  return discipline.isEnabled && discipline.type === 'other_subjective';
                }
              }) || false;
              
              const hasOther = hasOtherDirect || hasOtherJsonb;
              
              return hasOther ? (
                <TableCell className="text-right">
                  {Number(ranking.weightedOtherSubjectiveScore || 0).toFixed(2)}
                </TableCell>
              ) : null;
            })()}
            
            {isAdminMode && isAuthenticated && <TableCell>
                <UserActions userId={ranking.userId} userName={ranking.name} rankingId={ranking.id} onSuccess={() => window.location.reload()} showOnlyRankingActions={true} />
              </TableCell>}
          </TableRow>;
    }) : <TableRow>
          <TableCell colSpan={(() => {
            // Calcular colSpan usando sistema híbrido
            const hasOtherDirect = concurso.has_other_subjective === true;
            const hasOtherJsonb = concurso.disciplines?.some(discipline => {
              if ('disciplines' in discipline) {
                return discipline.disciplines?.some(d => 
                  d.isEnabled && d.type === 'other_subjective'
                );
              } else {
                return discipline.isEnabled && discipline.type === 'other_subjective';
              }
            }) || false;
            const hasOther = hasOtherDirect || hasOtherJsonb;
            
            return 4 + customDisciplines.length + 
                   (concurso.has_discursive ? 1 : 0) + 
                   (concurso.has_case_study_1 ? 1 : 0) + 
                   (concurso.has_case_study_2 ? 1 : 0) + 
                   (concurso.has_case_study_3 ? 1 : 0) + 
                   (hasOther ? 1 : 0) + 
                   (isAdminMode && isAuthenticated ? 1 : 0);
          })()} className="text-center py-4">
            Nenhum participante registrado nesta lista ainda
          </TableCell>
        </TableRow>}
    </TableBody>;
  };
    
  return (
    <div>
      <Table>
        {renderTableHeader()}
        {renderRankingRows()}
      </Table>
      
      {/* Botão Carregar Mais */}
      {onLoadMore && (
        <LoadMoreButton
          onLoadMore={onLoadMore}
          isLoading={isLoadingMore}
          hasMore={hasMore}
          totalLoaded={totalLoaded}
          className="mt-4"
        />
      )}
    </div>
  );
};
