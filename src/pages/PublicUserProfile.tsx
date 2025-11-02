import React, { useEffect, useState, useRef } from 'react';
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
import { Trophy, Users, ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { showProRequiredToast } from '@/utils/planRestrictions';
import { getFollowers, getFollowing } from '@/components/profile/FollowersService';
import { Link } from 'react-router-dom';
import { LoadingState } from '@/components/resultados/LoadingState';
import { fetchUserRankingsV3 } from '@/services/rankingServiceV3';
import { useSecureUserUrls } from '@/services/userUrlObfuscation';
import { maskEmail, canViewFullEmail } from '@/utils/emailMasking';
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
interface PublicUserProfileProps {
  userId?: string;
  secureToken?: string;
}

const PublicUserProfile: React.FC<PublicUserProfileProps> = ({ userId, secureToken }) => {
  const {
    id: urlId
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const { isPro, isLoading: isLoadingSubscription } = useSubscription();
  const navigate = useNavigate();
  const { generateSecureUserUrl } = useSecureUserUrls();
  
  // Usar userId passado como prop ou do URL
  const id = userId || urlId;
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
        } = await supabase.from('users_profiles').select('id, name, avatar_url').eq('id', id).maybeSingle();
        if (profileError) throw profileError;
        if (!profileData) throw new Error('User profile not found');

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
        } = await supabase.from('user_rankings').select('consolidated_data', {
          count: 'exact',
          head: true
        }).eq('user_id', id);
        if (postError) console.error('Error counting posts:', postError);

        // Try to get extended profile data from users_profiles table
        const {
          data: extendedData
        } = await supabase.from('users_profiles').select('*').eq('id', id).maybeSingle();
        return {
          ...profileData,
          followerCount: followerCount || 0,
          postCount: postCount || 0,
          // Merge extended data if available
          bio: extendedData?.bio || 'Informações privadas',
          email: extendedData?.email ? maskEmail(extendedData.email) : '',
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
            user_id,
            consolidated_data
          `).eq('user_id', id);
        if (error || !data) throw error || new Error('Sem rankings');
        
        // Processar dados da nova estrutura consolidated_data
        const concursoIds: string[] = [];
        const userRankingIdByConcurso = new Map<string, string>();
        
        if (data && data.length > 0) {
          const userRanking = data[0]; // Deve haver apenas um registro por usuário
          
          if (userRanking.consolidated_data?.rankings) {
            // Iterar sobre todos os rankings do usuário
            for (const [rankingId, rankingData] of Object.entries(userRanking.consolidated_data.rankings)) {
              const concursoId = (rankingData as any)?.concurso_id;
              if (concursoId) {
                concursoIds.push(concursoId);
                userRankingIdByConcurso.set(concursoId, rankingId);
              }
            }
          }
        }

        // Buscar dados dos concursos
        const { data: concursosData } = await supabase
          .from('concursos')
          .select('id, titulo, orgao, banca')
          .in('id', concursoIds);

        // Para cada concurso, pegar a lista que já usamos na página de resultados (Ampla Concorrência)
        const results = await Promise.all(concursoIds.map(async cid => {
          const list = await fetchUserRankingsV3(cid);

          // Buscar dados do ranking para verificar o tipo de exame
          let rankingData = null;
          try {
            const { data, error } = await supabase
              .from('concursos')
              .select('exam_type')
              .eq('id', cid)
              .maybeSingle();
            
            if (error) {
              console.error('Error fetching concurso exam_type:', error);
              // Use default exam_type if we can't fetch it
              rankingData = { exam_type: 'Alternativas' };
            } else if (!data) {
              // Concurso não existe, usar tipo padrão (não é um erro)
              rankingData = { exam_type: 'Alternativas' };
            } else {
              rankingData = data;
            }
          } catch (err) {
            console.error('Exception fetching concurso exam_type:', err);
            // Use default exam_type if we can't fetch it
            rankingData = { exam_type: 'Alternativas' };
          }

          // Mesma regra de eliminação usada na tabela de rankings
          // ✅ Usar apenas dados do backend - sem lógica de eliminação no frontend
          const isBelowMinimum = (ranking: any, concursoData: any) => {
            // Usar apenas os flags que vêm do backend
            const hasDisciplineMinimums = ranking.belowDisciplineMinimums && 
              ranking.belowDisciplineMinimums.length > 0;
            const hasBlockMinimums = ranking.belowBlockMinimums && 
              ranking.belowBlockMinimums.length > 0;
            
            return !!ranking.belowMinimum || hasDisciplineMinimums || hasBlockMinimums;
          };
          // ✅ Usar posição que vem do backend (ranking.position)
          // Não recalcular no frontend
          const rid = userRankingIdByConcurso.get(cid);
          const userRanking = list.find((r: any) => r.id === rid);
          const isClassified = userRanking ? !isBelowMinimum(userRanking, rankingData) : false;
          const position = userRanking?.position || null;
          
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
        // Construir dados finais combinando informações dos concursos e rankings
        const finalData = [];
        
        if (data && data.length > 0) {
          const userRanking = data[0];
          
          if (userRanking.consolidated_data?.rankings) {
            for (const [rankingId, rankingData] of Object.entries(userRanking.consolidated_data.rankings)) {
              const concursoId = (rankingData as any)?.concurso_id;
              if (concursoId) {
                // Buscar dados do concurso
                const concursoInfo = concursosData?.find(c => c.id === concursoId);
                const titulo = concursoInfo?.titulo || 'Concurso sem título';
                
                // Buscar informações de classificação
                const info = byConcurso.get(concursoId) || {
                  position: null,
                  isClassified: false
                };
                
                finalData.push({
                  concursoId: concursoId,
                  concursoTitle: titulo,
                  position: info.position,
                  score: (rankingData as any)?.user_data?.score || 0,
                  isClassified: info.isClassified
                } as UserRanking);
              }
            }
          }
        }
        
        return finalData;
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

  // Verificar se é perfil de outro usuário e se o usuário atual é Free
  // MOVER PARA ANTES DOS RETORNOS CONDICIONAIS
  const isOtherUserProfile = user && id && user.id !== id;
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (isOtherUserProfile && !isPro && !toastShownRef.current) {
      toastShownRef.current = true;
      showProRequiredToast(navigate, 'Visualizar Perfis de Outros Usuários');
    }
  }, [isOtherUserProfile, isPro, navigate]);

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
  const handleViewProfile = async (userId: string) => {
    try {
      const secureUrl = await generateSecureUserUrl(userId, 'profile');
      navigate(secureUrl);
    } catch (error) {
      navigate('/comunidade');
    }
  };
  if (profileLoading || isLoadingSubscription) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
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

  // Bloquear Free users de ver perfil de outros usuários
  if (isOtherUserProfile && !isPro) {
    return <LoadingState />;
  }

  // Processar as aprovações do usuário
  const aprovacoesList = profile.concursos_aprovados ? profile.concursos_aprovados.split('\n').filter(Boolean) : [];

  // Verificar se há informações de "Sobre mim"
  const hasAboutInfo = profile.estado || profile.formacao || profile.cargo_atual || profile.area_estudos || profile.especialidade || profile.curso_preparatorio;
  return <div className="container mx-auto p-6 max-w-7xl">
      
      
      <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-2">
        {/* Coluna Esquerda - Perfil do Usuário */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32" style={{ boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)' }}>
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
          {hasAboutInfo && <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sobre mim</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-xs">
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
            {profile.rotina_estudos && <Card className="mb-6 rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                <CardHeader className="pb-3">
                  <CardTitle>Rotina de estudos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm text-muted-foreground break-words overflow-wrap-anywhere">
                    {profile.rotina_estudos}
                  </p>
                </CardContent>
              </Card>}
            
            {/* Aprovações */}
            <Card className="mb-6 rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <CardHeader className="pb-3">
                <CardTitle>Aprovações</CardTitle>
              </CardHeader>
              <CardContent>
                {aprovacoesList.length > 0 ? <div className="space-y-2">
                    {aprovacoesList.map((concurso, index) => <div key={index} className="p-3 rounded-md bg-muted border">
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-full mr-3">
                            <Trophy className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            {concurso.trim()}
                          </span>
                        </div>
                      </div>)}
                  </div> : <p className="text-sm text-muted-foreground">Nenhuma aprovação registrada ainda.</p>}
              </CardContent>
            </Card>
            
            {/* Rankings */}
            <Card className="mb-6 rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
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
                    {rankings.map((ranking, index) => <Card key={`${ranking.concursoId}-${index}`} className="p-4">
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
          </div>
        </div>
        
        {/* Coluna Direita - Seguidores */}
        <div className="lg:col-span-3 space-y-4">
          {/* Seguidores */}
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
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
                        <Avatar className="h-12 w-12 mx-auto mb-1 cursor-pointer" style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)' }} onClick={() => handleViewProfile(follower.id)}>
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
                  {followers.length > 6 && <Button variant="link" size="sm" className="w-full" onClick={async () => {
                      try {
                        const secureUrl = await generateSecureUserUrl(id, 'followers');
                        navigate(secureUrl);
                      } catch (error) {
                        console.error('Erro ao gerar URL segura:', error);
                        navigate('/comunidade');
                      }
                    }}>
                      Ver todas
                    </Button>}
                </div> : <p className="text-sm text-muted-foreground text-center">
                  Nenhum seguidor ainda
                </p>}
            </CardContent>
          </Card>
          
          {/* Seguindo */}
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
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
                        <Avatar className="h-12 w-12 mx-auto mb-1 cursor-pointer" style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)' }} onClick={() => handleViewProfile(followedUser.id)}>
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
                  {following.length > 6 && <Button variant="link" size="sm" className="w-full" onClick={async () => {
                      try {
                        const secureUrl = await generateSecureUserUrl(id, 'following');
                        navigate(secureUrl);
                      } catch (error) {
                        console.error('Erro ao gerar URL segura:', error);
                        navigate('/comunidade');
                      }
                    }}>
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