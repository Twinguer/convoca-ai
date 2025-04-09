
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { User, Camera, Award, BookOpen } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [concursosAprovados, setConcursosAprovados] = useState('');
  const [concursosParticipando, setConcursosParticipando] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Fetch user profile data
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
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
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Math.random()}.${fileExt}`;
    
    setUploading(true);
    
    try {
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      setAvatarUrl(data.publicUrl);
      refetch();
      
      toast({
        title: 'Foto de perfil atualizada',
        description: 'Sua foto de perfil foi atualizada com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message || 'Ocorreu um erro ao enviar sua foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({
          name,
          bio,
          concursos_aprovados: concursosAprovados,
          concursos_participando: concursosParticipando,
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar perfil',
        description: error.message || 'Ocorreu um erro ao salvar seu perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da esquerda - Foto e informações básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Foto de perfil" />
                ) : (
                  <AvatarFallback className="text-3xl">
                    {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90"
              >
                <Camera size={20} />
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <div className="text-center">
              <p className="font-medium">{name || 'Nome não definido'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Coluna da direita - Informações detalhadas do perfil */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>
              Atualize suas informações de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <User size={16} />
                  <span>Básico</span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex items-center gap-2">
                  <Award size={16} />
                  <span>Aprovações</span>
                </TabsTrigger>
                <TabsTrigger value="participating" className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span>Participando</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
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
                  <Label htmlFor="bio">Biografia</Label>
                  <Textarea 
                    id="bio" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Conte um pouco sobre você..." 
                    rows={4}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="approved" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="concursos-aprovados">Concursos em que foi aprovado</Label>
                  <Textarea 
                    id="concursos-aprovados" 
                    value={concursosAprovados} 
                    onChange={(e) => setConcursosAprovados(e.target.value)} 
                    placeholder="Liste os concursos em que foi aprovado..." 
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separe os concursos por linha. Inclua o nome do órgão e o ano de aprovação.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="participating" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="concursos-participando">Concursos que está participando</Label>
                  <Textarea 
                    id="concursos-participando" 
                    value={concursosParticipando} 
                    onChange={(e) => setConcursosParticipando(e.target.value)} 
                    placeholder="Liste os concursos que está participando..." 
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separe os concursos por linha. Inclua o nome do órgão e a previsão de resultado.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="ml-auto"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
