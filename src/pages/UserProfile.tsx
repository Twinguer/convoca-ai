
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
import { User, Upload, Check, Loader2 } from 'lucide-react';

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
  
  // Fetch user profile
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
  
  // Update state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setConcursosAprovados(profile.concursos_aprovados || '');
      setConcursosParticipando(profile.concursos_participando || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);
  
  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files.length) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      setUploading(true);
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      // Update avatar_url in the profile
      const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user!.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(data.publicUrl);
      
      toast({
        title: 'Foto de perfil atualizada',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.message || 'Ocorreu um erro ao enviar a imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('users_profiles')
        .update({
          name,
          bio,
          concursos_aprovados: concursosAprovados,
          concursos_participando: concursosParticipando,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);
        
      if (error) throw error;
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-convoca-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    // Usando useEffect para evitar problemas de renderização com Navigate
    useEffect(() => {
      navigate("/auth");
    }, [navigate]);
    
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-convoca-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Meu Perfil</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e preferências
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="profile">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="concursos">Concursos</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="profile">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={name} />
                    ) : (
                      <AvatarFallback className="text-3xl">
                        {name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || <User className="h-12 w-12" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex flex-col items-center">
                    <Label htmlFor="avatar" className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Alterar foto
                        </div>
                      )}
                    </Label>
                    <Input 
                      id="avatar" 
                      type="file" 
                      className="hidden" 
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user.email || ''} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você e sua jornada nos concursos públicos"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="concursos">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="concursos-aprovados">Concursos em que foi aprovado</Label>
                <Textarea 
                  id="concursos-aprovados" 
                  value={concursosAprovados} 
                  onChange={(e) => setConcursosAprovados(e.target.value)}
                  placeholder="Liste os concursos em que você foi aprovado (um por linha)"
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Dica: Liste um por linha, incluindo o nome do concurso, órgão, ano e sua classificação
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="concursos-participando">Concursos em que está participando</Label>
                <Textarea 
                  id="concursos-participando" 
                  value={concursosParticipando} 
                  onChange={(e) => setConcursosParticipando(e.target.value)}
                  placeholder="Liste os concursos em que você está participando atualmente (um por linha)"
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Dica: Liste um por linha, incluindo o nome do concurso, órgão e data da prova
                </p>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-end py-6">
          <Button 
            onClick={handleSaveProfile} 
            disabled={saving}
            className="relative"
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
  );
};

export default UserProfile;
