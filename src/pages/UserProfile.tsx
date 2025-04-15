
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import ConcursosTab from '@/components/profile/ConcursosTab';
import RankingsTab from '@/components/profile/RankingsTab';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Loader2, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRankings, setUserRankings] = useState<any[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [isExitingRanking, setIsExitingRanking] = useState(false);
  const [exitRankingId, setExitRankingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching user profile for ID:', user.id);
        const { data, error } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching user profile:', error.message);
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Não foi possível carregar seus dados.',
          variant: 'destructive',
        });
      } finally {
        console.log('Setting profile state with data:', profile);
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, toast]);

  useEffect(() => {
    const fetchUserRankings = async () => {
      if (!user) return;
      
      setLoadingRankings(true);
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .select(`
            id, 
            score,
            reservation_type,
            created_at,
            concursos(id, titulo, orgao, banca)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setUserRankings(data || []);
      } catch (error) {
        console.error('Error fetching user rankings:', error);
      } finally {
        setLoadingRankings(false);
      }
    };
    
    fetchUserRankings();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'Erro ao sair',
        description: 'Houve um problema ao tentar sair. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleExitRanking = async (rankingId: string) => {
    setExitRankingId(rankingId);
    setIsExitingRanking(false);
  };

  const confirmExitRanking = async () => {
    if (!exitRankingId) return;
    
    setIsExitingRanking(true);
    try {
      // Delete user answers first
      const { error: answersError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', exitRankingId);
      
      if (answersError) throw answersError;
      
      // Then delete the ranking participation
      const { error: rankingError } = await supabase
        .from('user_rankings')
        .delete()
        .eq('id', exitRankingId);
      
      if (rankingError) throw rankingError;
      
      // Update local state
      setUserRankings(userRankings.filter(r => r.id !== exitRankingId));
      
      toast({
        title: 'Saiu do ranking',
        description: 'Você saiu deste ranking com sucesso.',
      });
    } catch (error: any) {
      console.error('Error exiting ranking:', error);
      toast({
        title: 'Erro ao sair do ranking',
        description: error.message || 'Houve um problema ao tentar sair deste ranking.',
        variant: 'destructive',
      });
    } finally {
      setIsExitingRanking(false);
      setExitRankingId(null);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando seu perfil...</span>
      </div>
    );
  }

  return (
    <div className="container py-10">
      {profile && <ProfileHeader profile={profile} />}

      <div className="mt-8">
        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="concursos">Concursos</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            {profile && <ProfileInfoTab profile={profile} />}
          </TabsContent>

          <TabsContent value="concursos">
            <ConcursosTab userId={user.id} />
          </TabsContent>

          <TabsContent value="rankings">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Meus Rankings</h3>
                
                {loadingRankings ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : userRankings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Você ainda não está participando de nenhum ranking.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {userRankings.map((ranking) => (
                      <div key={ranking.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <h4 className="font-medium">{ranking.concursos?.titulo || 'Ranking'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {ranking.concursos?.orgao} • {ranking.concursos?.banca}
                          </p>
                          {ranking.reservation_type && ranking.reservation_type !== 'Ampla Concorrência' && (
                            <span className="inline-block px-2 py-1 mt-1 text-xs bg-muted rounded-full">
                              {ranking.reservation_type}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/concurso/${ranking.concursos?.id}/responder/${ranking.id}`)}
                          >
                            Editar Gabarito
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleExitRanking(ranking.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Sair
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sair do Ranking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja sair deste ranking? Essa ação excluirá seu gabarito e 
                                  sua participação neste concurso. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={confirmExitRanking}
                                  disabled={isExitingRanking}
                                >
                                  {isExitingRanking ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processando...
                                    </>
                                  ) : (
                                    'Sim, sair do ranking'
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-10 flex justify-center">
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
