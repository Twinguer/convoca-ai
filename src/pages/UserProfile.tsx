
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Upload, Check, Loader2, Trophy, Users, Calendar, BookOpen, Pen } from 'lucide-react';
import { ProfileStatsColumn } from '@/components/profile/ProfileStatsColumn';
import Logo from '@/assets/logo';
import StatusSelect from '@/components/profile/StatusSelect';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import { validateFileUploadSimple } from '@/utils/fileUploadValidator';
import ProfileHeader from '@/components/profile/ProfileHeader';
import RankingsTab from '@/components/profile/RankingsTab';
import CreatedRankingsTab from '@/components/profile/CreatedRankingsTab';
import DeleteProfileButton from '@/components/profile/DeleteProfileButton';
import CombinedRankingsTab from '@/components/profile/CombinedRankingsTab';
import { fetchUserRankings } from '@/services/rankingService';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { formatPublicNicknameHandle, stripNicknamePrefix } from '@/utils/nicknameUtils';

interface UserRanking {
  concursoId: string;
  concursoTitle: string;
  position: number | null;
  score: number;
  isClassified: boolean;
}


const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [concursosAprovados, setConcursosAprovados] = useState('');
  const [concursosParticipando, setConcursosParticipando] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [statusConcurseiro, setStatusConcurseiro] = useState('Na Ativa');
  const [profileText, setProfileText] = useState('');
  
  // Novos estados para os campos adicionais
  const [estado, setEstado] = useState('');
  const [formacao, setFormacao] = useState('');
  const [cargoAtual, setCargoAtual] = useState('');
  const [areaEstudos, setAreaEstudos] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [cursoPreparatorio, setCursoPreparatorio] = useState('');
  const [rotinaEstudos, setRotinaEstudos] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'saving' | 'success' | 'error'>('idle');
  const [nicknameMessage, setNicknameMessage] = useState('');
  const nicknameAutoRequestedRef = useRef(false);

  const {
    data: profile,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        // Log removido por segurança
        const {
          data,
          error
        } = await supabase.from('users_profiles').select('*').eq('id', user.id).single();
        if (error) {
          devLog.error('Error fetching profile:', error);
          if (error.code === 'PGRST116') {
            // Log removido por segurança
            const {
              data: newProfile,
              error: createError
            } = await supabase.from('users_profiles').insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status_concurseiro: 'Na Ativa',
              profile_text: ''
            }).select('*').single();
            if (createError) {
              devLog.error('Error creating profile:', createError);
              throw createError;
            }
            return newProfile;
          }
          throw error;
        }
        // Log removido por segurança
        return data;
      } catch (err) {
        devLog.error('Error in profile query:', err);
        toast({
          title: 'Erro ao carregar perfil',
          description: 'Não foi possível carregar os dados do perfil. Tente novamente.',
          variant: 'destructive'
        });
        throw err;
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 300000
  });

  // Redirecionar visitante não autenticado sem quebrar a ordem dos hooks
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);



  // Verificar se o usuário é coach (has active coach subscription)
  const {
    data: isCoach
  } = useQuery({
    queryKey: ['user-is-coach', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      try {
        // Try RPC function first (bypasses RLS issues)
        const { data: coachCheck, error: coachError } = await supabase.rpc('is_user_coach', {
          p_user_id: user.id
        });
        
        if (!coachError && coachCheck === true) {
          return true;
        }
        
        // Fallback: try direct query
        const { data: coachSubscription, error: subError } = await supabase
          .from('coach_subscriptions')
          .select('id, status, expires_at')
          .eq('coach_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (subError && subError.code !== 'PGRST116' && subError.code !== 'PGRST406') {
          // Erro silencioso ao verificar status de coach
          return false;
        }
        
        return !!coachSubscription && 
          (!coachSubscription.expires_at || new Date(coachSubscription.expires_at) > new Date());
      } catch (error) {
        // Erro silencioso ao verificar status de coach
        return false;
      }
    },
    enabled: !!user
  });

  // Buscar rankings do usuário para estatísticas
  const { data: userRankings = [] } = useQuery({
    queryKey: ['user-rankings-for-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .select('user_id, consolidated_data')
          .eq('user_id', user.id);

        if (error || !data || data.length === 0) return [];

        const concursoIds: string[] = [];
        const userRankingIdByConcurso = new Map<string, string>();
        const userRanking = data[0];

        if (userRanking.consolidated_data?.rankings) {
          for (const [rankingId, rankingData] of Object.entries(userRanking.consolidated_data.rankings)) {
            const concursoId = (rankingData as any)?.concurso_id;
            if (concursoId) {
              concursoIds.push(concursoId);
              userRankingIdByConcurso.set(concursoId, rankingId);
            }
          }
        }

        if (concursoIds.length === 0) return [];

        const { data: concursosData } = await supabase
          .from('concursos')
          .select('id, titulo, exam_type')
          .in('id', concursoIds);

        const results = await Promise.all(concursoIds.map(async (cid) => {
          const list = await fetchUserRankings(cid);
          const concursoInfo = concursosData?.find(c => c.id === cid);
          const rankingData = concursoInfo || { exam_type: 'Alternativas' };

          const isBelowMinimum = (ranking: any) => {
            const hasDisciplineMinimums = ranking.belowDisciplineMinimums?.length > 0;
            const hasBlockMinimums = ranking.belowBlockMinimums?.length > 0;
            const isCertoErradoEliminated = rankingData.exam_type === 'Certo ou Errado' && ranking.score <= 0;
            const isAlternativasEliminated = rankingData.exam_type === 'Alternativas' && ranking.score <= 0;
            return !!ranking.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || 
                   isCertoErradoEliminated || isAlternativasEliminated;
          };

          const classified = list.filter((r: any) => !isBelowMinimum(r)).sort((a: any, b: any) => b.score - a.score);
          const rid = userRankingIdByConcurso.get(cid);
          const idx = classified.findIndex((r: any) => r.id === rid);
          const isClassified = idx >= 0;
          const position = isClassified ? idx + 1 : null;
          const score = (userRanking.consolidated_data.rankings[rid as string] as any)?.user_data?.score || 0;

          return {
            concursoId: cid,
            concursoTitle: concursoInfo?.titulo || 'Concurso sem título',
            position,
            score,
            isClassified
          } as UserRanking;
        }));

        return results;
      } catch (error) {
        devLog.error('Error fetching rankings for stats:', error);
        return [];
      }
    },
    enabled: !!user?.id
  });



  useEffect(() => {
    if (profile) {
      // Log removido por segurança
      setName(profile.name || '');
      setBio(profile.bio || '');
      setConcursosAprovados(profile.concursos_aprovados || '');
      setConcursosParticipando(profile.concursos_participando || '');
      setAvatarUrl(profile.avatar_url);
      setStatusConcurseiro(profile.status_concurseiro || 'Na Ativa');
      setProfileText(profile.profile_text || '');
      
      // Novos campos
      setEstado(profile.estado || '');
      setFormacao(profile.formacao || '');
      setCargoAtual(profile.cargo_atual || '');
      setAreaEstudos(profile.area_estudos || '');
      setEspecialidade(profile.especialidade || '');
      setCursoPreparatorio(profile.curso_preparatorio || '');
      setRotinaEstudos(profile.rotina_estudos || '');
      const cleanNickname = stripNicknamePrefix(profile.nickname);
      setNickname(cleanNickname);
      setNicknameInput(cleanNickname);
      setNicknameStatus('idle');
      setNicknameMessage('');
    }
  }, [profile]);

  const sanitizeNicknameInput = useCallback((value: string) => {
    if (!value) return '';
    return stripNicknamePrefix(value)
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '')
      .slice(0, 20);
  }, []);

  const handleNicknameInputChange = (value: string) => {
    const sanitized = sanitizeNicknameInput(value);
    setNicknameInput(sanitized);
    setNicknameStatus('idle');
    setNicknameMessage('');
  };

  const nicknameDirty = nicknameInput !== nickname;
  const isNicknameBusy = nicknameStatus === 'checking' || nicknameStatus === 'saving';

  const verifyNicknameAvailability = useCallback(async () => {
    if (!user) return;
    const normalized = sanitizeNicknameInput(nicknameInput);

    if (!normalized || normalized.length < 3) {
      setNicknameStatus('error');
      setNicknameMessage('Use pelo menos 3 caracteres (letras minúsculas, números, underscore ou ponto).');
      return;
    }

    setNicknameStatus('checking');
    setNicknameMessage('');

    try {
      const { data, error } = await supabase.rpc('validate_nickname_availability', {
        p_nickname: normalized,
        p_user_id: user.id
      });

      if (error) throw error;

      if (data?.is_valid) {
        setNicknameStatus('available');
        setNicknameMessage('Nickname disponível!');
      } else {
        setNicknameStatus('unavailable');
        setNicknameMessage(data?.reason || 'Nickname indisponível.');
      }
    } catch (error: any) {
      devLog.error('Nickname validation error:', error);
      setNicknameStatus('error');
      setNicknameMessage(error?.message || 'Não foi possível validar o nickname.');
    }
  }, [nicknameInput, sanitizeNicknameInput, user]);

  const updateNickname = useCallback(async (normalizedNickname: string | null, silent = false) => {
    if (!user) return;
    setNicknameStatus('saving');
    setNicknameMessage('');

    try {
      const { data, error } = await supabase.rpc('update_user_nickname', {
        p_user_id: user.id,
        p_nickname: normalizedNickname
      });

      if (error) throw error;
      if (!data?.success) {
        setNicknameStatus('error');
        setNicknameMessage(data?.error || 'Não foi possível atualizar o nickname.');
        if (!silent) {
          toast({
            title: 'Erro ao atualizar nickname',
            description: data?.error || 'Tente novamente em instantes.',
            variant: 'destructive'
          });
        }
        return;
      }

      setNickname(data.nickname);
      setNicknameInput(data.nickname);
      setNicknameStatus('success');
      setNicknameMessage(silent ? '' : 'Nickname atualizado com sucesso!');
      if (!silent) {
        toast({
          title: 'Nickname atualizado',
          description: `Seu novo nickname é ${formatPublicNicknameHandle(data.nickname) ?? ''}`
        });
      }

      await refetch();
    } catch (error: any) {
      devLog.error('Nickname update error:', error);
      setNicknameStatus('error');
      const description = error?.message || 'Não foi possível atualizar o nickname.';
      setNicknameMessage(description);
      if (!silent) {
        toast({
          title: 'Erro ao atualizar nickname',
          description,
          variant: 'destructive'
        });
      }
    }
  }, [refetch, toast, user]);

  const saveNickname = useCallback(async () => {
    const normalized = sanitizeNicknameInput(nicknameInput);
    if (!normalized || normalized.length < 3) {
      setNicknameStatus('error');
      setNicknameMessage('Use pelo menos 3 caracteres (letras minúsculas, números, underscore ou ponto).');
      return;
    }
    await updateNickname(normalized, false);
  }, [nicknameInput, sanitizeNicknameInput, updateNickname]);

  const generateNicknameAutomatically = useCallback(async (silent = false) => {
    await updateNickname(null, silent);
  }, [updateNickname]);

  useEffect(() => {
    if (profile && !profile.nickname && user?.id && !nicknameAutoRequestedRef.current) {
      nicknameAutoRequestedRef.current = true;
      generateNicknameAutomatically(true);
    }
  }, [profile, user?.id, generateNicknameAutomatically]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files.length) {
        return;
      }
      const file = event.target.files[0];
      
      // Validar arquivo usando o sistema padronizado
      const validation = validateFileUploadSimple(file, 'AVATAR', true);
      
      if (!validation.isValid) {
        toast({
          title: 'Arquivo inválido',
          description: validation.errors.join('. '),
          variant: 'destructive'
        });
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      setUploading(true);
      // Log removido por segurança
      const {
        data,
        error: uploadError
      } = await supabase.storage.from('profiles').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (uploadError) {
        devLog.error("Upload error:", uploadError);
        throw uploadError;
      }
      // Log removido por segurança
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('profiles').getPublicUrl(filePath);
      // Log removido por segurança
      const {
        data: profileData,
        error: updateError
      } = await supabase.from('users_profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', user!.id).select().single();
      if (updateError) {
        devLog.error("Update profile error:", updateError);
        throw updateError;
      }
      // Log removido por segurança
      setAvatarUrl(publicUrl);
      toast({
        title: 'Foto de perfil atualizada',
        description: 'Sua foto de perfil foi atualizada com sucesso.'
      });
      await refetch();
    } catch (error: any) {
      devLog.error("Avatar upload error:", error);
      toast({
        title: 'Erro ao fazer upload',
        description: error.message || 'Ocorreu um erro ao enviar a imagem. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      // Log removido por segurança
      const currentAvatarUrl = avatarUrl;
      const {
        data,
        error
      } = await supabase.from('users_profiles').update({
        name,
        bio,
        concursos_aprovados: concursosAprovados,
        concursos_participando: concursosParticipando,
        avatar_url: currentAvatarUrl,
        status_concurseiro: statusConcurseiro,
        profile_text: profileText,
        estado: estado,
        formacao: formacao,
        cargo_atual: cargoAtual,
        area_estudos: areaEstudos,
        especialidade: especialidade,
        curso_preparatorio: cursoPreparatorio,
        rotina_estudos: rotinaEstudos,
        updated_at: new Date().toISOString()
      }).eq('id', user!.id).select().single();
      if (error) {
        devLog.error("Error saving profile:", error);
        throw error;
      }
      // Log removido por segurança
      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.'
      });
      await refetch();
    } catch (error: any) {
      devLog.error("Save profile error:", error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o perfil. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const concursosAprovadosCount = concursosAprovados ? concursosAprovados.split('\n').filter(Boolean).length : 0;

  if (isLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
      </div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
      </div>;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <CardContent className="pt-6">
              <ProfileHeader 
                name={name} 
                email={user?.email || ''} 
                avatarUrl={avatarUrl} 
                uploading={uploading} 
                handleAvatarUpload={handleAvatarUpload}
                statusConcurseiro={statusConcurseiro}
                profileText={profileText}
                isCoach={isCoach || false}
                nickname={nickname}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Nickname público</CardTitle>
              <CardDescription>Identificador único exibido no perfil público e usado para convites.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="text-muted-foreground shrink-0 select-none">@</span>
                <Input
                  value={nicknameInput}
                  onChange={(e) => handleNicknameInputChange(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  maxLength={20}
                  disabled={nicknameStatus === 'saving'}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={verifyNicknameAvailability}
                  disabled={!nicknameInput || isNicknameBusy}
                >
                  {nicknameStatus === 'checking' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar'
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={saveNickname}
                  disabled={!nicknameDirty || nicknameStatus === 'saving'}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {nicknameStatus === 'saving' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar nickname'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNicknameInput(nickname);
                    setNicknameStatus('idle');
                    setNicknameMessage('');
                  }}
                  disabled={!nicknameDirty || nicknameStatus === 'saving'}
                >
                  Desfazer
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => generateNicknameAutomatically()}
                disabled={nicknameStatus === 'saving'}
              >
                {nicknameStatus === 'saving' && !nicknameDirty ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar automaticamente'
                )}
              </Button>
              <p
                className={`text-xs ${
                  nicknameStatus === 'available' || nicknameStatus === 'success'
                    ? 'text-green-600'
                    : nicknameStatus === 'unavailable' || nicknameStatus === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                }`}
              >
                {nicknameMessage || 'O nickname deve ter 3-20 caracteres (letras minúsculas, números ou underscore).'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold">Sobre mim</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs">
                {estado && (
                  <div className="flex justify-between">
                    <span className="font-medium">Estado:</span>
                    <span className="text-gray-600">{estado}</span>
                  </div>
                )}
                
                {formacao && (
                  <div className="flex justify-between">
                    <span className="font-medium">Formação:</span>
                    <span className="text-gray-600">{formacao}</span>
                  </div>
                )}
                
                {cargoAtual && (
                  <div className="flex justify-between">
                    <span className="font-medium">Cargo atual:</span>
                    <span className="text-gray-600">{cargoAtual}</span>
                  </div>
                )}
                
                {areaEstudos && (
                  <div className="flex justify-between">
                    <span className="font-medium">Área de Estudos:</span>
                    <span className="text-gray-600">{areaEstudos}</span>
                  </div>
                )}
                
                {especialidade && (
                  <div className="flex justify-between">
                    <span className="font-medium">Especialidade:</span>
                    <span className="text-gray-600">{especialidade}</span>
                  </div>
                )}
                
                {cursoPreparatorio && (
                  <div className="flex justify-between">
                    <span className="font-medium">Curso Preparatório:</span>
                    <span className="text-gray-600">{cursoPreparatorio}</span>
                  </div>
                )}
                
                {!estado && !formacao && !cargoAtual && !areaEstudos && !especialidade && !cursoPreparatorio && (
                  <p className="text-gray-500 italic text-center">Adicione informações sobre você na aba 'Perfil'</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-6">
          <Card className="mb-4 rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <CardHeader>
              <CardTitle className="text-2xl">Meu Perfil</CardTitle>
            </CardHeader>
            
            {rotinaEstudos && (
              <CardContent className="pt-0 pb-4">
                <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-semibold">Rotina de estudos</h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm whitespace-pre-line break-words overflow-wrap-anywhere">{rotinaEstudos}</p>
                  </CardContent>
                </Card>
              </CardContent>
            )}
            
            <Tabs defaultValue="profile">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="rankings">Rankings</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="profile">
                <CardContent className="pt-6">
                  <ProfileInfoTab 
                    name={name}
                    setName={setName}
                    email={user?.email || ''}
                    bio={bio}
                    setBio={setBio}
                    statusConcurseiro={statusConcurseiro}
                    setStatusConcurseiro={setStatusConcurseiro}
                    profileText={profileText}
                    setProfileText={setProfileText}
                    concursosAprovados={concursosAprovados}
                    setConcursosAprovados={setConcursosAprovados}
                    concursosParticipando={concursosParticipando}
                    setConcursosParticipando={setConcursosParticipando}
                    estado={estado}
                    setEstado={setEstado}
                    formacao={formacao}
                    setFormacao={setFormacao}
                    cargoAtual={cargoAtual}
                    setCargoAtual={setCargoAtual}
                    areaEstudos={areaEstudos}
                    setAreaEstudos={setAreaEstudos}
                    especialidade={especialidade}
                    setEspecialidade={setEspecialidade}
                    cursoPreparatorio={cursoPreparatorio}
                    setCursoPreparatorio={setCursoPreparatorio}
                    rotinaEstudos={rotinaEstudos}
                    setRotinaEstudos={setRotinaEstudos}
                  />
                </CardContent>
              </TabsContent>
              
              <TabsContent value="rankings">
                <CardContent className="pt-6">
                  <CombinedRankingsTab 
                    userId={user?.id || ''}
                    isAuthenticated={!!user}
                  />
                </CardContent>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="flex justify-between py-6 border-t">
              <DeleteProfileButton userId={user?.id || ''} />
              
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving} 
                className="relative bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {user && <ProfileStatsColumn userId={user.id} rankings={userRankings} />}
        </div>
      </div>

      <footer className="mt-12 text-center">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <Logo className="h-16 w-auto" />
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Nomeia Aí - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserProfile;
