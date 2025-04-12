
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Upload, Loader2, Trophy, Users, BookOpen, Pen } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  uploading: boolean;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  userRankingsCount: number;
  followersCount: number;
  concursosAprovadosCount: number;
  statusConcurseiro: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  avatarUrl,
  uploading,
  handleAvatarUpload,
  userRankingsCount,
  followersCount,
  concursosAprovadosCount,
  statusConcurseiro
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar className="h-32 w-32">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} />
        ) : (
          <AvatarFallback className="text-3xl">
            {name ? getInitials(name) : <User className="h-12 w-12" />}
          </AvatarFallback>
        )}
      </Avatar>
      
      <div className="text-center">
        <h2 className="text-xl font-bold">{name || 'Usuário'}</h2>
        <p className="text-sm text-muted-foreground">{email}</p>
        
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
            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm">Rankings</span>
          </div>
          <span className="text-sm font-semibold">{userRankingsCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm">Seguidores</span>
          </div>
          <span className="text-sm font-semibold">{followersCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-sm">Aprovações</span>
          </div>
          <span className="text-sm font-semibold">{concursosAprovadosCount}</span>
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
  );
};

export default ProfileHeader;
