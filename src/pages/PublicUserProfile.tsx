import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { OnlineIndicator } from '@/components/profile/OnlineIndicator';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getFollowers, getFollowing } from '@/components/profile/FollowersService';
import { Link } from 'react-router-dom';
import { fetchUserRankings } from '@/services/rankingService';
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
  profile_text?: string | null;
  estado?: string | null;
  formacao?: string | null;
  cargo_atual?: string | null;
  area_estudos?: string | null;
  especialidade?: string | null;
  curso_preparatorio?: string | null;
  rotina_estudos?: string | null;
}
interface UserRanking {
  concursoId: string;
  concursoTitle: string;
  position: number | null;
  score: number;
  isClassified: boolean;
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
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const {
    data: profile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['public-user-profile', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        // Fetch basic profile info from public view
        const {
          data: profileData,
          error: profileError
        } = await supabase.from('public_profiles').select('id, name, avatar_url').eq('id', id).single();
        if (profileError) throw profileError;

        // Get follower count
        const {
          count: followerCount,
          error: followerError
        } = await supabase.rpc('count_user_followers', {
          user_id: id
        });
        if (followerError) console.error('Error counting followers:', followerError);

        // Get post count (rankings)
        const {
          count: postCount,
          error: postError
        } = await supabase.from('user_rankings').select('*', {
          count: 'exact',
          head: true
        }).eq('user_id', id);
        if (postError) console.error('Error counting posts:', postError);

        // Try to get extended profile data from users_profiles table
        const {
          data: extendedData
        } = await supabase.from('users_profiles').select('*').eq('id', id).single();
        return {
          ...profileData,
          followerCount: followerCount || 0,
          postCount: postCount || 0,
          // Merge extended data if available
          bio: extendedData?.bio || 'Informações privadas',
          email: extendedData?.email || '',
          concursos_aprovados: extendedData?.concursos_aprovados || null,
          status_concurseiro: extendedData?.status_concurseiro || 'Privado',
          profile_text: extendedData?.profile_text || null,
          estado: extendedData?.estado || null,
          formacao: extendedData?.formacao || null,
          cargo_atual: extendedData?.cargo_atual || null,
          area_estudos: extendedData?.area_estudos || null,
          especialidade: extendedData?.especialidade || null,
          curso_preparatorio: extendedData?.curso_preparatorio || null,
          rotina_estudos: extendedData?.rotina_estudos || null
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
            concursos(titulo, id)
          `).eq('user_id', id);
        if (error || !data) throw error || new Error('Sem rankings');
        const concursoIds: string[] = Array.from(new Set(data.map((r: any) => r.concurso_id)));
        const userRankingIdByConcurso = new Map<string, string>();
        data.forEach((r: any) => userRankingIdByConcurso.set(r.concurso_id, r.id));

        // Para cada concurso, pegar a lista que já usamos na página de resultados (Ampla Concorrência)
        const results = await Promise.all(concursoIds.map(async cid => {
          const list = await fetchUserRankings(cid);

          // Mesma regra de eliminação usada na tabela de rankings
          const isBelowMinimum = (ranking: any) => {
            return !!ranking.belowMinimum || ranking.belowBlockMinimums && ranking.belowBlockMinimums.length > 0 || ranking.belowDisciplineMinimums && ranking.belowDisciplineMinimums.length > 0;
          };
          const classified = list.filter((r: any) => !isBelowMinimum(r)).sort((a: any, b: any) => b.score - a.score);
          const rid = userRankingIdByConcurso.get(cid);
          const idx = classified.findIndex((r: any) => r.id === rid);
          const isClassified = idx >= 0;
          const position = isClassified ? idx + 1 : null; // Ampla Concorrência exibe apenas classificados com posição
          return {
            cid,
            position,
            isClassified
          };
        }));
        const byConcurso = new Map<string, {
          position: number | null;
          isClassified: boolean;
        }>();
        results.forEach(res => byConcurso.set(res.cid, {
          position: res.position,
          isClassified: res.isClassified
        }));
        return data.map((item: any) => {
          const concursoData = item.concursos || {};
          const titulo = typeof concursoData === 'object' && concursoData !== null && 'titulo' in concursoData ? String((concursoData as any).titulo) : 'Concurso sem título';
          const info = byConcurso.get(item.concurso_id) || {
            position: null,
            isClassified: false
          };
          return {
            concursoId: item.concurso_id,
            concursoTitle: titulo,
            position: info.position,
            score: item.score,
            isClassified: info.isClassified
          } as UserRanking;
        });
      } catch (error) {
        console.error('Error fetching rankings:', error);
        return [];
      }
    },
    enabled: !!id
  });

  // Load followers and following
  useEffect(() => {
    const loadFollowersData = async () => {
      if (!id) return;
      try {
        const [followersData, followingData] = await Promise.all([getFollowers(id), getFollowing(id)]);
        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error('Error loading followers data:', error);
      }
    };
    if (id) {
      loadFollowersData();
    }
  }, [id]);
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
  const handleViewProfile = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };
  if (profileLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-primary rounded-full border-t-transparent"></div>
      </div>;
  }
  if (!profile) {
    return <div className="container mx-auto p-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
          <p className="text-muted-foreground mb-6">O perfil que você está procurando não existe ou foi removido.</p>
          <Button onClick={() => navigate('/comunidade')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Comunidade
          </Button>
        </div>
      </div>;
  }

  // Processar as aprovações do usuário
  const aprovacoesList = profile.concursos_aprovados ? profile.concursos_aprovados.split('\n').filter(Boolean) : [];

  // Verificar se há informações de "Sobre mim"
  const hasAboutInfo = profile.estado || profile.formacao || profile.cargo_atual || profile.area_estudos || profile.especialidade || profile.curso_preparatorio;
  return <div className="container mx-auto p-6 max-w-7xl">
      
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda - Perfil do Usuário */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.name} /> : <AvatarFallback className="text-3xl">
                        {getInitials(profile?.name || '')}
                      </AvatarFallback>}
                  </Avatar>
                  <OnlineIndicator userId={profile?.id as string} />
                </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">
                    {profile?.name || 'Usuário'}
                  </h2>
                  
                </div>
                
                <Separator />
                
                {/* Status */}
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status</span>
                    <span className="text-sm">{profile.status_concurseiro || 'Estudando'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sobre mim */}
          {hasAboutInfo && <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sobre mim</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-sm">
                  {profile.estado && <div className="flex justify-between">
                      <span className="font-medium">Estado:</span>
                      <span className="text-muted-foreground">{profile.estado}</span>
                    </div>}
                  {profile.formacao && <div className="flex justify-between">
                      <span className="font-medium">Formação:</span>
                      <span className="text-muted-foreground">{profile.formacao}</span>
                    </div>}
                  {profile.cargo_atual && <div className="flex justify-between">
                      <span className="font-medium">Cargo:</span>
                      <span className="text-muted-foreground">{profile.cargo_atual}</span>
                    </div>}
                  {profile.area_estudos && <div className="flex justify-between">
                      <span className="font-medium">Área de Estudos:</span>
                      <span className="text-muted-foreground">{profile.area_estudos}</span>
                    </div>}
                  {profile.especialidade && <div className="flex justify-between">
                      <span className="font-medium">Especialidade:</span>
                      <span className="text-muted-foreground">{profile.especialidade}</span>
                    </div>}
                  {profile.curso_preparatorio && <div className="flex justify-between">
                      <span className="font-medium">Curso Preparatório:</span>
                      <span className="text-muted-foreground">{profile.curso_preparatorio}</span>
                    </div>}
                </div>
              </CardContent>
            </Card>}
        </div>
        
        {/* Coluna Central - Conteúdo Principal */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            
            
            {/* Rotina de estudos */}
            {profile.rotina_estudos && <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Rotina de estudos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground break-words">
                    {profile.rotina_estudos}
                  </p>
                </CardContent>
              </Card>}
            
            {/* Rankings */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                {!user ? <div className="text-center py-6">
                    <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-4">
                      Você precisa estar cadastrado para visualizar os rankings.
                    </p>
                    <Button asChild>
                      <Link to="/auth" className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar-se
                      </Link>
                    </Button>
                  </div> : rankings && rankings.length > 0 ? <div className="space-y-3">
                    {rankings.map(ranking => <Card key={ranking.concursoId} className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">
                              {ranking.concursoTitle}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Participando - {ranking.score} pts
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Classificação:</span>
                            {ranking.position ? <span className="font-bold text-primary">
                                {ranking.position}º
                              </span> : <Badge variant="destructive" className="font-bold">
                                E
                              </Badge>}
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
            
            {/* Aprovações */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-800">Aprovações</CardTitle>
              </CardHeader>
              <CardContent>
                {aprovacoesList.length > 0 ? <div className="space-y-2">
                    {aprovacoesList.map((concurso, index) => <div key={index} className="p-3 rounded-md bg-primary-50 border-primary-200">
                        <div className="flex items-center">
                          <div className="bg-emerald-200 p-2 rounded-full mr-3">
                            <Trophy className="h-4 w-4 text-emerald-700" />
                          </div>
                          <span className="text-sm font-medium text-emerald-800">
                            {concurso.trim()}
                          </span>
                        </div>
                      </div>)}
                  </div> : <p className="text-sm text-emerald-700">Nenhuma aprovação registrada ainda.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Coluna Direita - Seguidores */}
        <div className="lg:col-span-3 space-y-4">
          {/* Seguidores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Seguidores ({followers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followers.length > 0 ? <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {followers.slice(0, 6).map(follower => <div key={follower.id} className="text-center">
                        <Avatar className="h-12 w-12 mx-auto mb-1 cursor-pointer" onClick={() => handleViewProfile(follower.id)}>
                          <AvatarImage src={follower.avatar_url || ''} alt={follower.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(follower.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate block">
                          {follower.name?.split(' ')[0]}
                        </span>
                      </div>)}
                  </div>
                  {followers.length > 6 && <Button variant="link" size="sm" className="w-full" onClick={() => navigate(`/usuario/${id}/seguidores`)}>
                      Ver todas
                    </Button>}
                </div> : <p className="text-sm text-muted-foreground text-center">
                  Nenhum seguidor ainda
                </p>}
            </CardContent>
          </Card>
          
          {/* Seguindo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Seguindo ({following.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {following.length > 0 ? <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {following.slice(0, 6).map(followedUser => <div key={followedUser.id} className="text-center">
                        <Avatar className="h-12 w-12 mx-auto mb-1 cursor-pointer" onClick={() => handleViewProfile(followedUser.id)}>
                          <AvatarImage src={followedUser.avatar_url || ''} alt={followedUser.name} />
                          <AvatarFallback className="text-xs">
                            {getInitials(followedUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate block">
                          {followedUser.name?.split(' ')[0]}
                        </span>
                      </div>)}
                  </div>
                  {following.length > 6 && <Button variant="link" size="sm" className="w-full" onClick={() => navigate(`/usuario/${id}/seguindo`)}>
                      Ver todas
                    </Button>}
                </div> : <p className="text-sm text-muted-foreground text-center">
                  Não seguindo ninguém ainda
                </p>}
            </CardContent>
          </Card>
          
          {/* Botão de Seguir/Deixar de Seguir */}
          {user && user.id !== id && <Button onClick={handleFollowToggle} variant={isFollowing ? "outline" : "default"} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              {isFollowing ? "Deixar de seguir" : "Seguir"}
            </Button>}
        </div>
      </div>
    </div>;
};
export default PublicUserProfile;