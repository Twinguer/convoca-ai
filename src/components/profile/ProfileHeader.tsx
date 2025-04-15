
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Upload, Loader2, Pen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ProfileHeaderProps {
  profile: any;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você precisa selecionar uma imagem para upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('users_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(data.publicUrl);
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso!",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Ocorreu um erro ao atualizar sua foto de perfil.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-32 w-32">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={profile?.name} />
        ) : (
          <AvatarFallback className="text-3xl">
            {profile?.name ? getInitials(profile.name) : <User className="h-12 w-12" />}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="text-center">
        <h2 className="text-xl font-bold">{profile?.name || 'Usuário'}</h2>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        
        <div className="mt-2">
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
      
      <Separator />
      
      <div className="w-full space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Pen className="h-4 w-4 mr-2 text-purple-500" />
            <span className="text-sm">Status</span>
          </div>
          <span className="text-sm font-semibold">{profile?.status_concurseiro}</span>
        </div>
        
        {profile?.profile_text && (
          <div className="mt-3 text-sm text-center py-2 px-3 bg-gray-50 rounded-md italic">
            "{profile.profile_text}"
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
