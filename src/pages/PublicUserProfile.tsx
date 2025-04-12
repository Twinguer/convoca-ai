import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, BookOpen, Pen, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FollowersColumn } from '@/components/profile/FollowersColumn';
import Logo from '@/assets/logo';
interface UserProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  email: string;
  concursos_aprovados: string | null;
  concursos_participando: string | null;
  status_concurseiro: string | null;
  followerCount?: number;
  postCount?: number;
}
interface UserRanking {
  concursoId: string;
  concursoTitle: string;
  position: number;
  score: number;
}
const PublicUserProfile: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const {
    data: profile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['public-user-profile', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const {
          data: profileData,
          error: profileError
        } = await supabase.from('users_profiles').select('*').eq('id', id).single();
        if (profileError) throw profileError;
        const {
          count: followerCount,
          error: followerError
        } = await supabase.rpc('count_user_followers', {
          user_id: id
        });
        if (followerError) console.error('Error counting followers:', followerError);
        const {
          count: postCount,
          error: postError
        } = await supabase.from('user_rankings').select('*', {
          count: 'exact',
          head: true
        }).eq('user_id', id);
        if (postError) console.error('Error counting posts:', postError);
        return {
          ...profileData,
          followerCount: followerCount || 0,
          postCount: postCount || 0
        } as UserProfile;
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o perfil do usuário.',
          variant: 'destructive'
        });
        throw error;
      }
    },
    enabled: !!id
  });
  const {
    data: rankings
  } = useQuery({
    queryKey: ['public-user-rankings', id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const {
          data,
          error
        } = await supabase.from('user_rankings').select(`
            id,
            concurso_id,
            score,
            concursos(titulo)
          `).eq('user_id', id).order('score', {
          ascending: false
        });
        if (error) throw error;
        return data.map(item => {
          const concursoData = item.concursos || {};
          const titulo = typeof concursoData === 'object' && concursoData !== null && 'titulo' in concursoData ? String(concursoData.titulo) : 'Concurso sem título';
          return {
            concursoId: item.concurso_id,
            concursoTitle: titulo,
            position: 0,
            score: item.score
          };
        }) as UserRanking[];
      } catch (error) {
        console.error('Error fetching rankings:', error);
        return [];
      }
    },
    enabled: !!id
  });
  useEffect(() => {
    const checkFollowing = async () => {
      if (user && id && user.id !== id) {
        try {
          const {
            count,
            error
          } = await supabase.from('user_followers').select('*', {
            count: 'exact',
            head: true
          }).eq('follower_id', user.id).eq('followed_id', id);
          if (error) throw error;
          setIsFollowing(count > 0);
        } catch (error) {
          console.error('Error checking following status:', error);
        }
      }
    };
    checkFollowing();
  }, [user, id]);
  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para seguir outros usuários.',
        variant: 'default'
      });
      navigate('/auth');
      return;
    }
    if (!id || user.id === id) return;
    try {
      if (isFollowing) {
        const {
          error
        } = await supabase.from('user_followers').delete().eq('follower_id', user.id).eq('followed_id', id);
        if (error) throw error;
        setIsFollowing(false);
        toast({
          title: 'Deixou de seguir',
          description: `Você deixou de seguir ${profile?.name}.`
        });
      } else {
        const {
          error
        } = await supabase.from('user_followers').insert({
          follower_id: user.id,
          followed_id: id
        });
        if (error) throw error;
        setIsFollowing(true);
        toast({
          title: 'Seguindo',
          description: `Você está seguindo ${profile?.name}.`
        });
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status de seguidor.',
        variant: 'destructive'
      });
    }
  };
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  if (profileLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
      </div>;
  }
  if (!profile) {
    return <div className="container mx-auto p-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Usuário não encontrado</h1>
          <p className="text-gray-600 mb-6">O perfil que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/comunidade')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Comunidade
          </Button>
        </div>
      </div>;
  }
  const approvalCount = profile.concursos_aprovados ? profile.concursos_aprovados.split('\n').filter(Boolean).length : 0;
  return <div className="container mx-auto p-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/comunidade')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Comunidade
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
        <div className="md:col-span-9 md:order-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
            <div className="md:col-span-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.name} /> : <AvatarFallback className="text-3xl">
                          {getInitials(profile?.name || '')}
                        </AvatarFallback>}
                    </Avatar>
                    
                    <div className="text-center">
                      <h2 className="text-xl font-bold">{profile?.name}</h2>
                      
                      {profile?.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
                      
                      {user && user.id !== id && <Button onClick={handleFollowToggle} variant={isFollowing ? "outline" : "default"} className="mt-4">
                          {isFollowing ? "Deixar de seguir" : "Seguir"}
                        </Button>}
                    </div>
                    
                    <Separator />
                    
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          <span className="text-sm">Rankings</span>
                        </div>
                        <span className="text-sm font-semibold">{profile?.postCount || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">Seguidores</span>
                        </div>
                        <span className="text-sm font-semibold">{profile?.followerCount || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm">Aprovações</span>
                        </div>
                        <span className="text-sm font-semibold">{approvalCount}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Pen className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm">Status</span>
                        </div>
                        <span className="text-sm font-semibold">{profile?.status_concurseiro || 'Na Ativa'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-8">
              <Card className="mb-1">
                <CardHeader className="pb-3">
                  <h3 className="text-xl font-bold">Rankings</h3>
                </CardHeader>
                <CardContent>
                  {rankings && rankings.length > 0 ? <div className="space-y-1">
                      {rankings.map((ranking, index) => <Card key={ranking.concursoId} className="overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-100 to-emerald-50 p-4 flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{ranking.concursoTitle}</h3>
                            </div>
                            <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
                              <span className="text-lg font-bold">{ranking.score}</span>
                              <span className="text-xs ml-1">pts</span>
                            </div>
                          </div>
                        </Card>)}
                    </div> : <div className="text-center py-6">
                      <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Nenhum ranking encontrado para este usuário.
                      </p>
                    </div>}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="text-xl font-bold">Concursos aprovados</h3>
                </CardHeader>
                <CardContent>
                  {profile.concursos_aprovados ? <div className="space-y-1">
                      {profile.concursos_aprovados.split('\n').filter(Boolean).map((concurso, index) => <div key={index} className="p-3 bg-emerald-50 rounded-md">
                            <div className="flex items-start">
                              <div className="bg-emerald-100 p-2 rounded-full mr-3">
                                <Trophy className="h-4 w-4 text-emerald-600" />
                              </div>
                              <p>{concurso}</p>
                            </div>
                          </div>)}
                    </div> : <div className="text-center py-6">
                      <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Nenhuma aprovação registrada.
                      </p>
                    </div>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3 md:order-1">
          <FollowersColumn userId={id || ''} />
        </div>
      </div>

      
    </div>;
};
export default PublicUserProfile;