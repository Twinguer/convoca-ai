import React, { useState, useEffect } from 'react';
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
import { fetchUserRankings } from '@/services/concursoService';
import { UserRankingDisplay } from '@/types/concursos';
import { FollowersColumn } from '@/components/profile/FollowersColumn';
import Logo from '@/assets/logo';
import StatusSelect from '@/components/profile/StatusSelect';
import ProfileInfoTab from '@/components/profile/ProfileInfoTab';
import ProfileHeader from '@/components/profile/ProfileHeader';
import RankingsTab from '@/components/profile/RankingsTab';
import CreatedRankingsTab from '@/components/profile/CreatedRankingsTab';
import DeleteProfileButton from '@/components/profile/DeleteProfileButton';
import CombinedRankingsTab from '@/components/profile/CombinedRankingsTab';

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
  const [followersCount, setFollowersCount] = useState(0);
  const [userRankings, setUserRankings] = useState<UserRankingDisplay[]>([]);
  const [statusConcurseiro, setStatusConcurseiro] = useState('Na Ativa');
  const [profileText, setProfileText] = useState('');

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
              status_concurseiro: 'Na Ativa',
              profile_text: ''
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
          id: item.id,
          concurso_id: item.concurso_id,
          user_id: user.id,
          name: '',
          score: item.score,
          position: 0,
          concurso_title: titulo,
          concurso_orgao: '',
          created_at: new Date().toISOString()
        } as UserRankingDisplay;
      });
    },
    enabled: !!user
  });

  const {
    data: followerData
  } = useQuery({
    queryKey: ['user-followers-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const {
        data,
        error
      } = await supabase.rpc('count_user_followers', {
        user_id: user.id
      });
      if (error) {
        console.error('Error fetching follower count:', error);
        return 0;
      }
      return data || 0;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (followerData !== undefined) {
      setFollowersCount(followerData);
    }
  }, [followerData]);

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
      setProfileText(profile.profile_text || '');
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
        statusConcurseiro,
        profileText
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
        profile_text: profileText,
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

  const concursosAprovadosCount = concursosAprovados ? concursosAprovados.split('\n').filter(Boolean).length : 0;

  if (isLoading) {
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
      </div>;
  }

  if (!user) {
    useEffect(() => {
      navigate("/auth");
    }, [navigate]);
    return <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-600 rounded-full border-t-transparent"></div>
      </div>;
  }

  return (
    <div className="container mx-auto p-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
        <div className="md:col-span-3">
          <Card>
            <CardContent className="pt-6">
              <ProfileHeader 
                name={name} 
                email={user?.email || ''} 
                avatarUrl={avatarUrl} 
                uploading={uploading} 
                handleAvatarUpload={handleAvatarUpload}
                statusConcurseiro={statusConcurseiro}
                profileText={profileText}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Meu Perfil</CardTitle>
            </CardHeader>
            
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
                  />
                </CardContent>
              </TabsContent>
              
              <TabsContent value="rankings">
                <CardContent className="pt-6">
                  <CombinedRankingsTab 
                    userId={user?.id || ''}
                    userRankings={userRankings}
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

        <div className="md:col-span-3">
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
    </div>
  );
};

export default UserProfile;
