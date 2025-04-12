import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Upload, Check, Loader2, Trophy, Users, Calendar, BookOpen, Pen } from 'lucide-react';
import { fetchUserRankings } from '@/services/concursoService';
import { UserRankingDisplay } from '@/types/concursos';
import { FollowersColumn } from '@/components/profile/FollowersColumn';
import Logo from '@/assets/logo';
import StatusSelect from '@/components/profile/StatusSelect';
interface Follower {
  id: string;
  name: string;
  avatar_url?: string | null;
}
const UserProfile = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [concursosAprovados, setConcursosAprovados] = useState('');
  const [concursosParticipando, setConcursosParticipando] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [userRankings, setUserRankings] = useState<UserRankingDisplay[]>([]);
  const [statusConcurseiro, setStatusConcurseiro] = useState('Na Ativa');
  const {
    data: profile,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        console.log('Fetching user profile for ID:', user.id);
        const {
          data,
          error
        } = await supabase.from('users_profiles').select('*').eq('id', user.id).single();
        if (error) {
          console.error('Error fetching profile:', error);
          if (error.code === 'PGRST116') {
            console.log('Profile not found, creating new profile');
            const {
              data: newProfile,
              error: createError
            } = await supabase.from('users_profiles').insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status_concurseiro: 'Na Ativa'
            }).select('*').single();
            if (createError) {
              console.error('Error creating profile:', createError);
              throw createError;
            }
            return newProfile;
          }
          throw error;
        }
        console.log('Profile fetched successfully:', data);
        return data;
      } catch (err) {
        console.error('Error in profile query:', err);
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
  const {
    data: rankings
  } = useQuery({
    queryKey: ['user-rankings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const {
        data,
        error
      } = await supabase.from('user_rankings').select(`
          id,
          concurso_id,
          score,
          concursos(titulo)
        `).eq('user_id', user.id);
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
      }) as UserRankingDisplay[];
    },
    enabled: !!user
  });
  useEffect(() => {
    if (user) {
      setFollowers([{
        id: '1',
        name: 'Ana Silva',
        avatar_url: null
      }, {
        id: '2',
        name: 'João Pereira',
        avatar_url: null
      }, {
        id: '3',
        name: 'Maria Oliveira',
        avatar_url: null
      }, {
        id: '4',
        name: 'Carlos Santos',
        avatar_url: null
      }, {
        id: '5',
        name: 'Juliana Costa',
        avatar_url: null
      }]);
    }
  }, [user]);
  useEffect(() => {
    if (rankings && rankings.length > 0) {
      setUserRankings(rankings);
    }
  }, [rankings]);
  useEffect(() => {
    if (profile) {
      console.log("Setting profile state with data:", profile);
      setName(profile.name || '');
      setBio(profile.bio || '');
      setConcursosAprovados(profile.concursos_aprovados || '');
      setConcursosParticipando(profile.concursos_participando || '');
      setAvatarUrl(profile.avatar_url);
      setStatusConcurseiro(profile.status_concurseiro || 'Na Ativa');
    }
  }, [profile]);
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files.length) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      setUploading(true);
      console.log("Uploading file to path:", filePath);
      const {
        data,
        error: uploadError
      } = await supabase.storage.from('profiles').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      console.log("Upload data:", data);
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('profiles').getPublicUrl(filePath);
      console.log("Generated public URL:", publicUrl);
      const {
        data: profileData,
        error: updateError
      } = await supabase.from('users_profiles').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', user!.id).select().single();
      if (updateError) {
        console.error("Update profile error:", updateError);
        throw updateError;
      }
      console.log("Updated profile data:", profileData);
      setAvatarUrl(publicUrl);
      toast({
        title: 'Foto de perfil atualizada',
        description: 'Sua foto de perfil foi atualizada com sucesso.'
      });
      await refetch();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
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
      console.log("Saving profile with data:", {
        name,
        bio,
        concursosAprovados,
        concursosParticipando,
        avatarUrl,
        statusConcurseiro
      });
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
        updated_at: new Date().toISOString()
      }).eq('id', user!.id).select().single();
      if (error) {
        console.error("Error saving profile:", error);
        throw error;
      }
      console.log("Profile saved successfully:", data);
      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.'
      });
      await refetch();
    } catch (error: any) {
      console.error("Save profile error:", error);
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
  if (isLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-convoca-600 rounded-full border-t-transparent"></div>
      </div>;
  }
  if (!user) {
    useEffect(() => {
      navigate("/auth");
    }, [navigate]);
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-convoca-600 rounded-full border-t-transparent"></div>
      </div>;
  }
  return <div className="container mx-auto p-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
        <div className="md:col-span-9 md:order-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
            <div className="md:col-span-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : <AvatarFallback className="text-3xl">
                          {name ? getInitials(name) : <User className="h-12 w-12" />}
                        </AvatarFallback>}
                    </Avatar>
                    
                    <div className="text-center">
                      <h2 className="text-xl font-bold">{name || 'Usuário'}</h2>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      
                      <div className="mt-2">
                        <Label htmlFor="avatar" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          {uploading ? <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando...
                            </div> : <div className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Alterar foto
                            </div>}
                        </Label>
                        <Input id="avatar" type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" disabled={uploading} />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          <span className="text-sm">Rankings</span>
                        </div>
                        <span className="text-sm font-semibold">{userRankings.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm">Nome de concurseira(o):</span>
                        </div>
                        <span className="text-sm font-semibold">{followers.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm">Aprovações</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {concursosAprovados ? concursosAprovados.split('\n').filter(Boolean).length : 0}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Pen className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm">Status</span>
                        </div>
                        <span className="text-sm font-semibold">{statusConcurseiro}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Meu Perfil</CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais e preferências
                  </CardDescription>
                </CardHeader>
                
                <Tabs defaultValue="profile">
                  <div className="px-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="profile">Perfil</TabsTrigger>
                      <TabsTrigger value="concursos">Concursos</TabsTrigger>
                      <TabsTrigger value="rankings">Rankings</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="profile">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email || ''} disabled className="bg-muted" />
                      </div>
                      
                      <StatusSelect value={statusConcurseiro} onChange={setStatusConcurseiro} />
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografia de concurseira(o):</Label>
                        <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Conte um pouco sobre você e sua jornada nos concursos públicos" rows={4} />
                      </div>
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="concursos">
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="concursos-aprovados">Concursos em que foi aprovado</Label>
                        <Textarea id="concursos-aprovados" value={concursosAprovados} onChange={e => setConcursosAprovados(e.target.value)} placeholder="Liste os concursos em que você foi aprovado (um por linha)" rows={5} />
                        <p className="text-sm text-muted-foreground">
                          Dica: Liste um por linha, incluindo o nome do concurso, órgão, ano e sua classificação
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="concursos-participando">Concursos em que está participando</Label>
                        <Textarea id="concursos-participando" value={concursosParticipando} onChange={e => setConcursosParticipando(e.target.value)} placeholder="Liste os concursos em que você está participando atualmente (um por linha)" rows={5} />
                        <p className="text-sm text-muted-foreground">
                          Dica: Liste um por linha, incluindo o nome do concurso, órgão e data da prova
                        </p>
                      </div>
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="rankings">
                    <CardContent className="pt-6">
                      {userRankings && userRankings.length > 0 ? <div className="space-y-1">
                          {userRankings.map((ranking, index) => <Card key={ranking.concursoId} className="overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium">{ranking.concursoTitle}</h3>
                                  <div className="flex items-center mt-1">
                                    <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="text-sm">
                                      {ranking.position > 0 ? `${ranking.position}º lugar` : 'Posição não definida'}
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
                                  <span className="text-lg font-bold">{ranking.score}</span>
                                  <span className="text-xs ml-1">pts</span>
                                </div>
                              </div>
                              <div className="p-4 bg-white">
                                <Button variant="outline" size="sm" onClick={() => navigate(`/concurso/${ranking.concursoId}/resultados`)}>
                                  Ver ranking completo
                                </Button>
                              </div>
                            </Card>)}
                        </div> : <div className="text-center py-8">
                          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-lg font-medium">Você ainda não tem rankings</h3>
                          <p className="text-muted-foreground">
                            Participe de concursos e simulados para ver sua classificação aqui
                          </p>
                          <Button variant="outline" className="mt-4" onClick={() => navigate('/concursos')}>
                            Ver concursos disponíveis
                          </Button>
                        </div>}
                    </CardContent>
                  </TabsContent>
                </Tabs>
                
                <CardFooter className="flex justify-end py-6">
                  <Button onClick={handleSaveProfile} disabled={saving} className="relative">
                    {saving ? <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </> : <>
                        <Check className="h-4 w-4 mr-2" />
                        Salvar alterações
                      </>}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3 md:order-1">
          {user && <FollowersColumn userId={user.id} />}
        </div>
      </div>

      <footer className="mt-12 text-center">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <Logo className="h-16 w-auto" />
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Convoca Aí - Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default UserProfile;