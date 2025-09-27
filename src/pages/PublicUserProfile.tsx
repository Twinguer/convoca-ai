import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Trophy, Users, BookOpen, Pen, ArrowLeft, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FollowersColumn } from '@/components/profile/FollowersColumn';
import Logo from '@/assets/logo';
import { Link } from 'react-router-dom';
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
  const {
    data: profile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['public-user-profile', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        // Fetch basic profile info from public view, will fail for private profiles
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('id, name, avatar_url')
          .eq('id', id)
          .single();
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
          postCount: postCount || 0,
          // Set default values for missing private fields
          bio: 'Informações privadas',
          email: '',
          concursos_aprovados: null,
          concursos_participando: null,
          status_concurseiro: 'Privado',
          profile_text: null,
          estado: null,
          formacao: null,
          cargo_atual: null,
          area_estudos: null,
          especialidade: null,
          curso_preparatorio: null,
          rotina_estudos: null
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
          `).eq('user_id', id).order('score', {
          ascending: false
        });
        if (error) throw error;
        
        const rankingsWithPosition = await Promise.all(data.map(async item => {
          // Check if user is classified using the function
          const { data: isClassified } = await supabase.rpc('is_candidate_classified', {
            p_ranking_id: item.id,
            p_concurso_id: item.concurso_id
          });

          const {
            data: allScores,
            error: scoresError
          } = await supabase.from('user_rankings').select('score').eq('concurso_id', item.concurso_id).order('score', {
            ascending: false
          });
          if (scoresError) {
            console.error('Error fetching scores:', scoresError);
            return null;
          }
          
          const position = allScores.findIndex(s => s.score <= item.score) + 1;
          const concursoData = item.concursos || {};
          const titulo = typeof concursoData === 'object' && concursoData !== null && 'titulo' in concursoData ? String(concursoData.titulo) : 'Concurso sem título';
          
          return {
            concursoId: item.concurso_id,
            concursoTitle: titulo,
            position: isClassified ? position : null, // null if eliminated
            score: item.score,
            isClassified: Boolean(isClassified)
          };
        }));
        return rankingsWithPosition.filter(Boolean) as UserRanking[];
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
        <div className="animate-spin h-8 w-8 border-emerald-600 rounded-full border-t-transparent"></div>
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

  // Processar as aprovações do usuário
  const aprovacoesList = profile.concursos_aprovados ? profile.concursos_aprovados.split('\n').filter(Boolean) : [];
  const approvalCount = aprovacoesList.length;

  // Verificar se há informações de "Sobre mim"
  const hasAboutInfo = profile.estado || profile.formacao || profile.cargo_atual || profile.area_estudos || profile.especialidade || profile.curso_preparatorio;
  return <div className="container mx-auto p-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/comunidade')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Comunidade
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                   {/* Online indicator */}
                   <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white" />
                 </div>
                   <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white" />
                 </div>
                
                <div className="text-center">
                  <h2 className="text-xl font-bold">
                    {profile?.name ? 
                      profile.name.split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                      ).join(' ').substring(0, 15) 
                      : 'Usuário'
                    }
                  </h2>
                  
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-2 break-words overflow-hidden line-clamp-3">
                      {profile.bio}
                    </p>
                  )}
                  
                  {user && user.id !== id && <Button onClick={handleFollowToggle} variant={isFollowing ? "outline" : "default"} className="mt-4">
                      {isFollowing ? "Deixar de seguir" : "Seguir"}
                    </Button>}
                </div>
                
                <Separator />
                
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center">
                  
                  {profile?.profile_text && <div className="mt-3 text-sm text-center py-2 px-3 bg-gray-50 rounded-md italic">
                      "{profile.profile_text}"
                    </div>}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {hasAboutInfo && <Card>
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold">Sobre mim</h3>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                   {profile.estado && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Estado:</span>
                       <span className="text-gray-600 break-words">{profile.estado}</span>
                     </div>}
                   
                   {profile.formacao && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Formação:</span>
                       <span className="text-gray-600 break-words">{profile.formacao}</span>
                     </div>}
                   
                   {profile.cargo_atual && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Cargo atual:</span>
                       <span className="text-gray-600 break-words">{profile.cargo_atual}</span>
                     </div>}
                   
                   {profile.area_estudos && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Área de Estudos:</span>
                       <span className="text-gray-600 break-words">{profile.area_estudos}</span>
                     </div>}
                   
                   {profile.especialidade && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Especialidade:</span>
                       <span className="text-gray-600 break-words">{profile.especialidade}</span>
                     </div>}
                   
                   {profile.curso_preparatorio && <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                       <span className="font-medium">Curso Preparatório:</span>
                       <span className="text-gray-600 break-words">{profile.curso_preparatorio}</span>
                     </div>}
                </div>
              </CardContent>
            </Card>}
        </div>
        
        <div className="lg:col-span-6 space-y-4">
          {profile.rotina_estudos && <Card className="mb-4">
              <CardHeader className="pb-3">
                <h3 className="text-xl font-bold">Rotina de estudos</h3>
              </CardHeader>
               <CardContent>
                 <p className="whitespace-pre-line break-words overflow-hidden">{profile.rotina_estudos}</p>
               </CardContent>
            </Card>}
          
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <h3 className="text-xl font-bold">Rankings</h3>
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
                </div> : rankings && rankings.length > 0 ? <div className="space-y-4">
                  {rankings.map((ranking, index) => <Card key={ranking.concursoId} className="overflow-hidden">
                      <div className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                        ranking.isClassified 
                          ? 'bg-gradient-to-r from-emerald-100 to-emerald-50' 
                          : 'bg-gradient-to-r from-red-100 to-red-50'
                      }`}>
                         <div className="flex-1">
                           <h3 className="font-medium text-slate-700 text-sm sm:text-base break-words overflow-hidden line-clamp-2">
                             {ranking.concursoTitle}
                           </h3>
                          <div className="flex items-center mt-1">
                            <Trophy className="h-4 w-4 text-yellow-500 mr-1 flex-shrink-0" />
                           <span className="text-xs sm:text-sm text-slate-700">
                              {ranking.position 
                                ? `Posição: ${ranking.position}º` 
                                : `Participando - ${ranking.score} pts`}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white rounded-full h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-sm sm:text-lg font-bold text-slate-700">{ranking.score}</span>
                          <span className="text-xs ml-1 text-slate-700">pts</span>
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
              <h3 className="text-xl font-bold">Concursos aprovados ({approvalCount})</h3>
            </CardHeader>
            <CardContent>
              {aprovacoesList.length > 0 ? <div className="space-y-2">
                  {aprovacoesList.map((concurso, index) => <div key={index} className="p-3 rounded-md bg-emerald-100">
                      <div className="flex items-start">
                        <div className="bg-emerald-200 p-2 rounded-full mr-3">
                          <Trophy className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="text-slate-700 break-words overflow-hidden line-clamp-2">{concurso}</p>
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
        
        <div className="lg:col-span-3">
          <FollowersColumn userId={id || ''} />
        </div>
      </div>
    </div>;
};
export default PublicUserProfile;