import React, { useState } from 'react';
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
import { Link } from 'react-router-dom';
import { ProfileStatsColumn } from '@/components/profile/ProfileStatsColumn';
import { fetchUserRankingsV3 } from '@/services/rankingServiceV3';
import { maskEmail, canViewFullEmail } from '@/utils/emailMasking';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { UserUrlObfuscationService } from '@/services/userUrlObfuscation';

// Helper para verificar se é UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

interface UserProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  email: string;
  concursos_aprovados: string | null;
  concursos_participando: string | null;
  status_concurseiro: string | null;
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
  const navigate = useNavigate();
  const { toast } = useToast(); // ✅ CORREÇÃO: Declarar toast antes de usar no useEffect
  const [validatedUserId, setValidatedUserId] = React.useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = React.useState(false);
  
  // ✅ SEGURANÇA: Validar token ofuscado se necessário
  React.useEffect(() => {
    const validateId = async () => {
      const idToValidate = userId || urlId;
      if (!idToValidate) {
        navigate('/comunidade');
        return;
      }

      // Se for UUID válido, usar diretamente (compatibilidade com rotas antigas)
      if (isValidUUID(idToValidate)) {
        setValidatedUserId(idToValidate);
        return;
      }

      // Se não for UUID, provavelmente é um token ofuscado
      setIsValidatingToken(true);
      try {
        const realUserId = await UserUrlObfuscationService.validateUserToken(idToValidate);
        if (realUserId) {
          setValidatedUserId(realUserId);
        } else {
          toast({
            title: 'Acesso negado',
            description: 'O link de acesso é inválido ou expirado.',
            variant: 'destructive',
          });
          navigate('/comunidade');
        }
      } catch (error) {
        devLog.error('Erro ao validar token na PublicUserProfile:', error);
        toast({
          title: 'Erro de segurança',
          description: 'Não foi possível validar o acesso. Tente novamente.',
          variant: 'destructive',
        });
        navigate('/comunidade');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateId();
  }, [userId, urlId, navigate, toast]);

  // Usar userId validado
  const id = validatedUserId;
  const {
    data: profile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['public-user-profile', id],
    queryFn: async () => {
      if (!id) return null;
      
      // ✅ SEGURANÇA: Não fazer query se ainda está validando token
      if (isValidatingToken) return null;
      try {
        // Fetch basic profile info from public view
        const {
          data: profileData,
          error: profileError
        } = await supabase.from('users_profiles').select('id, name, avatar_url').eq('id', id).maybeSingle();
        if (profileError) throw profileError;
        if (!profileData) throw new Error('User profile not found');

        // ✅ SEGURANÇA: Contar rankings sem expor consolidated_data completo
        const {
          count: postCount,
          error: postError
        } = await supabase.from('user_rankings').select('user_id', {
          count: 'exact',
          head: true
        }).eq('user_id', id);
        if (postError) devLog.error('Error counting posts:', postError);

        // ✅ SEGURANÇA: Buscar apenas campos públicos necessários (não usar select('*'))
        const {
          data: extendedData
        } = await supabase.from('users_profiles').select('bio, estado, formacao, cargo_atual, area_estudos, especialidade, curso_preparatorio, rotina_estudos, concursos_aprovados, concursos_participando, status_concurseiro, profile_text').eq('id', id).maybeSingle();
        
        // Check if user is a coach using RPC function (has active coach subscription)
        let isCoach = false;
        try {
          const { data: coachCheck, error: coachError } = await supabase.rpc('is_user_coach', {
            p_user_id: id
          });
          
          if (!coachError && coachCheck === true) {
            isCoach = true;
          } else {
            // Fallback: try direct query
            const { data: coachSubscription } = await supabase
              .from('coach_subscriptions')
              .select('id, status, expires_at')
              .eq('coach_id', id)
              .eq('status', 'active')
              .maybeSingle();
            
            isCoach = !!coachSubscription && 
              (!coachSubscription.expires_at || new Date(coachSubscription.expires_at) > new Date());
          }
        } catch (error) {
          // If both fail, assume not coach
          isCoach = false;
        }
        
        return {
          ...profileData,
          postCount: postCount || 0,
          isCoach: isCoach,
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
        } as UserProfile & { isCoach?: boolean };
      } catch (error) {
        devLog.error('Error fetching profile:', error);
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
      
      // ✅ SEGURANÇA: Não fazer query se ainda está validando token
      if (isValidatingToken) return [];
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
              devLog.error('Error fetching concurso exam_type:', error);
              // Use default exam_type if we can't fetch it
              rankingData = { exam_type: 'Alternativas' };
            } else if (!data) {
              // Concurso não existe, usar tipo padrão (não é um erro)
              rankingData = { exam_type: 'Alternativas' };
            } else {
              rankingData = data;
            }
          } catch (err) {
            devLog.error('Exception fetching concurso exam_type:', err);
            // Use default exam_type if we can't fetch it
            rankingData = { exam_type: 'Alternativas' };
          }

          // Mesma regra de eliminação usada na tabela de rankings
          const isBelowMinimum = (ranking: any, concursoData: any) => {
            // Verificação existente para mínimos por disciplina/bloco
            const hasDisciplineMinimums = ranking.belowDisciplineMinimums && 
              ranking.belowDisciplineMinimums.length > 0;
            const hasBlockMinimums = ranking.belowBlockMinimums && 
              ranking.belowBlockMinimums.length > 0;
            
            // NOVA LÓGICA: Para provas "Certo ou Errado", eliminar se nota <= 0
            const isCertoErradoEliminated = concursoData?.exam_type === 'Certo ou Errado' && 
              ranking.score <= 0;
            
            // NOVA LÓGICA: Para provas "Alternativas", eliminar se nota <= 0
            const isAlternativasEliminated = concursoData?.exam_type === 'Alternativas' && 
              ranking.score <= 0;
            
            
            return !!ranking.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || 
                   isCertoErradoEliminated || isAlternativasEliminated;
          };
          const classified = list.filter((r: any) => !isBelowMinimum(r, rankingData)).sort((a: any, b: any) => b.score - a.score);
          const rid = userRankingIdByConcurso.get(cid);
          const idx = classified.findIndex((r: any) => r.id === rid);
          const isClassified = idx >= 0;
          const position = isClassified ? idx + 1 : null;
          
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
        devLog.error('Error fetching rankings:', error);
        return [];
      }
    },
    enabled: !!id
  });

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  // ✅ SEGURANÇA: Mostrar loading enquanto valida token
  if (isValidatingToken || profileLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-primary rounded-full border-t-transparent"></div>
        <p className="ml-4 text-muted-foreground">
          {isValidatingToken ? 'Validando acesso...' : 'Carregando perfil...'}
        </p>
      </div>;
  }
  
  // ✅ SEGURANÇA: Se não conseguiu validar, não mostrar nada
  if (!validatedUserId || !id) {
    return null;
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
      
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                  {profile?.isCoach && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 mb-2">
                      Coach
                    </Badge>
                  )}
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
        <div className="lg:col-span-6 space-y-4">
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
        
        {/* Coluna Direita - Estatísticas e Grupos */}
        <div className="lg:col-span-3 space-y-4">
          {id && <ProfileStatsColumn userId={id} rankings={rankings} />}
        </div>
      </div>
    </div>;
};
export default PublicUserProfile;