import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useResultadosData } from '@/hooks/useResultadosData';
import { RankingTable } from '@/components/resultados/RankingTable';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { StatisticsCard } from '@/components/resultados/StatisticsCard';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ChartBar, RefreshCcw, Share2, UserPlus } from 'lucide-react';
import ConcursoChart from '@/components/resultados/ConcursoChart';
import Loading from '@/components/Loading';
import UserRankingCard from '@/components/resultados/UserRankingCard';
import { useDeferredValue } from 'react';
import RankingSharingModal from '@/components/resultados/RankingSharingModal';
import { useNavigate } from 'react-router-dom';
import { RankingManagement } from '@/components/Rankings/RankingManagement';
import { deleteRanking } from '@/integrations/supabase/rankings/concursoManager';

export default function ResultadosPage() {
  
  const {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user,
    refreshData,
    creatorName,
    inscritos,
    isCreator
  } = useResultadosData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentRankings, setCurrentRankings] = useState<typeof rankings>([]);
  const [showChart, setShowChart] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const deferredRankings = useDeferredValue(currentRankings);
  
  useEffect(() => {
    if (rankings && rankings.length > 0) {
      setCurrentRankings(rankings);
    }
  }, [rankings]);

  useEffect(() => {
    if (concurso) {
      document.title = `${concurso.titulo} - ${concurso.orgao} | Resultados`;
    }
  }, [concurso]);

  const handleRefresh = () => {
    refreshData();
    toast.success('Dados atualizados');
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleShowChart = () => {
    setShowChart(!showChart);
  };

  const handleDeleteRanking = async () => {
    if (!user || !concurso) return;
    
    await deleteRanking(concurso.id, user.id);
    
    queryClient.invalidateQueries({ queryKey: ['concurso', concurso.id] });
    queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
    
    navigate('/');
  };

  if (isLoading || !concurso) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">{concurso.titulo}</h1>
        <div className="flex flex-wrap gap-2">
          {isCreator && (
            <RankingManagement
              concursoId={concurso.id}
              isCreator={isCreator}
              onDeleteRanking={handleDeleteRanking}
            />
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleShowChart}>
            <ChartBar className="w-4 h-4 mr-2" />
            {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ConcursoInfoCard concurso={concurso} creatorName={creatorName} />
        </div>
        <div className="lg:col-span-1">
          <StatisticsCard participantCount={participantCount} inscritos={inscritos} />
        </div>
      </div>

      {showChart && (
        <Card>
          <CardContent className="p-6">
            <ConcursoChart rankings={deferredRankings} />
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <p className="text-center mb-4">Faça login para ver sua classificação nos rankings</p>
            <Button asChild>
              <Link to="/auth" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar-se
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {user && userRanking && (
        <UserRankingCard userRanking={userRanking} totalParticipants={participantCount} />
      )}

      <Tabs defaultValue="ampla" className="w-full">
        <TabsList>
          <TabsTrigger value="ampla">Ampla Concorrência</TabsTrigger>
          {concurso.has_ppp && <TabsTrigger value="ppp">PPP</TabsTrigger>}
          {concurso.has_pcd && <TabsTrigger value="pcd">PCD</TabsTrigger>}
          {concurso.has_hipossuficientes && <TabsTrigger value="hipossuficientes">Hipossuficientes</TabsTrigger>}
          {concurso.has_indigenas && <TabsTrigger value="indigenas">Indígenas</TabsTrigger>}
          {concurso.has_transsexuais && <TabsTrigger value="trans">Pessoas Trans</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="ampla">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <RankingTable 
                rankings={deferredRankings.filter(r => r.reservationType === 'ampla')} 
                currentUserId={user?.id} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {concurso.has_ppp && (
          <TabsContent value="ppp">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <RankingTable 
                  rankings={deferredRankings.filter(r => r.reservationType === 'ppp')} 
                  currentUserId={user?.id} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {concurso.has_pcd && (
          <TabsContent value="pcd">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <RankingTable 
                  rankings={deferredRankings.filter(r => r.reservationType === 'pcd')} 
                  currentUserId={user?.id} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {concurso.has_hipossuficientes && (
          <TabsContent value="hipossuficientes">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <RankingTable 
                  rankings={deferredRankings.filter(r => r.reservationType === 'hipossuficiente')} 
                  currentUserId={user?.id} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {concurso.has_indigenas && (
          <TabsContent value="indigenas">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <RankingTable 
                  rankings={deferredRankings.filter(r => r.reservationType === 'indigena')} 
                  currentUserId={user?.id} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {concurso.has_transsexuais && (
          <TabsContent value="trans">
            <Card>
              <CardContent className="p-0 overflow-auto">
                <RankingTable 
                  rankings={deferredRankings.filter(r => r.reservationType === 'trans')} 
                  currentUserId={user?.id} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <RankingSharingModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        concurso={concurso} 
        userRanking={userRanking}
      />
    </div>
  );
}
