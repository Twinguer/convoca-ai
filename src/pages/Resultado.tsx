
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Users, Award, PenTool, Share } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ParticipationForm } from '@/components/resultados/ParticipationForm';
import { RankingTable } from '@/components/resultados/RankingTable';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { useAuth } from '@/hooks/useAuth';
import { AnswerKeyForm } from '@/components/Admin/AnswerKeyForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Resultado = () => {
  const { concursoId } = useParams<{ concursoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ranking");
  
  const {
    concurso,
    rankings,
    userParticipation,
    loading,
    error,
    userCanEdit,
  } = useResultadosData(concursoId || '');

  if (loading) {
    return <LoadingState />;
  }

  if (error || !concurso) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="text-center p-8">
          <p className="text-red-500 mb-2">Erro ao carregar os resultados.</p>
          <p>{error || "Concurso não encontrado."}</p>
        </div>
      </div>
    );
  }

  // Check if the current user is the creator or admin
  const isCreatorOrAdmin = user && (
    user.id === concurso.created_by_user_id || 
    (user.user_metadata && user.user_metadata.is_admin)
  );

  // Get creator name from rankings data
  const creatorName = concurso.creatorName;
  const isAdminCreated = concurso.is_admin_created;

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="mb-6">
        <ConcursoInfoCard
          concursoTitle={concurso.orgao}
          cargoTitle={concurso.titulo}
          banca={concurso.banca}
          data={concurso.data_publicacao}
          creatorName={creatorName}
          isAdminCreated={isAdminCreated}
        />
      </div>

      <div className="my-4 flex flex-col md:flex-row gap-4 justify-between">
        <div className="space-x-2">
          {!userParticipation && user && (
            <Button onClick={() => setActiveTab("participate")} className="mb-2 md:mb-0">
              <PenTool className="mr-2 h-4 w-4" /> Participar
            </Button>
          )}
          {userParticipation && (
            <Button onClick={() => setActiveTab("participate")} variant="outline" className="mb-2 md:mb-0">
              <Edit className="mr-2 h-4 w-4" /> Editar minha participação
            </Button>
          )}
          {isCreatorOrAdmin && (
            <Button onClick={() => setActiveTab("answerKey")} variant="outline" className="mb-2 md:mb-0">
              <Award className="mr-2 h-4 w-4" /> Gabarito Oficial
            </Button>
          )}
        </div>
        
        <div className="space-x-2">
          <Button variant="outline" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Ranking: ${concurso.titulo} - ${concurso.orgao}`,
                url: window.location.href
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: "Link copiado!",
                description: "O link foi copiado para sua área de transferência."
              });
            }
          }}>
            <Share className="mr-2 h-4 w-4" /> Compartilhar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ranking">
            <Users className="mr-2 h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="participate">
            <PenTool className="mr-2 h-4 w-4" />
            Participar
          </TabsTrigger>
          {isCreatorOrAdmin && (
            <TabsTrigger value="answerKey">
              <Award className="mr-2 h-4 w-4" />
              Gabarito Oficial
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ranking" className="mt-6">
          <RankingTable rankings={rankings} currentUserId={user?.id} isAuthenticated={!!user} />
        </TabsContent>

        <TabsContent value="participate" className="mt-6">
          {user ? (
            <ParticipationForm 
              concurso={concurso} 
              isAlreadyParticipating={!!userParticipation}
              userRankingId={userParticipation?.id}
            />
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <p className="mb-4">Você precisa estar logado para participar deste ranking.</p>
              <Button onClick={() => navigate('/auth')}>Fazer login</Button>
            </div>
          )}
        </TabsContent>

        {isCreatorOrAdmin && (
          <TabsContent value="answerKey" className="mt-6">
            <AnswerKeyForm concursoId={concursoId || ''} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Resultado;
