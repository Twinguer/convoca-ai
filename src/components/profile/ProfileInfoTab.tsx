
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StatusSelect from './StatusSelect';
import { Loader2 } from 'lucide-react';

interface ProfileInfoTabProps {
  profile: any;
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({
  profile
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [statusConcurseiro, setStatusConcurseiro] = useState(profile?.status_concurseiro || 'Estudante');
  const [profileText, setProfileText] = useState(profile?.profile_text || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({
          name,
          bio,
          status_concurseiro: statusConcurseiro,
          profile_text: profileText
        })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
          value={profile?.email} 
          disabled 
          className="bg-muted"
        />
      </div>
      
      <StatusSelect 
        value={statusConcurseiro}
        onChange={setStatusConcurseiro}
      />
      
      <div className="space-y-2">
        <Label htmlFor="profileText">Texto de perfil</Label>
        <Textarea 
          id="profileText" 
          value={profileText} 
          onChange={(e) => setProfileText(e.target.value)}
          placeholder="Digite uma frase ou mensagem para mostrar em seu perfil"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Este texto será exibido no seu cartão de perfil para outros usuários
        </p>
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

      <Button 
        onClick={handleSaveProfile} 
        className="w-full" 
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          'Salvar alterações'
        )}
      </Button>
    </div>
  );
};

export default ProfileInfoTab;
