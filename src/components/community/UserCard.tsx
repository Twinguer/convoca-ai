
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  concursos_aprovados?: string | null;
  followerCount: number;
  postCount: number;
  approvalCount: number;
  status_concurseiro?: string | null;
  is_studying?: boolean;
}

interface UserCardProps {
  userProfile: UserProfile;
  onClick?: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  userProfile,
  onClick
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const { user } = useAuth();
  
  // Check if this user is the currently logged in user
  const isCurrentUser = user?.id === userProfile.id;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Generate a fallback avatar URL if none exists or if the original has an error
  const fallbackAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.name || 'user')}`;

  // Use the user's avatar_url if available and not erroring, otherwise use fallback
  const avatarUrl = avatarError || !userProfile.avatar_url ? fallbackAvatarUrl : userProfile.avatar_url;

  const handleCardClick = () => {
    if (onClick) {
      onClick(userProfile.id);
    }
  };

  // Get status badge styling
  const getStatusBadgeClass = (status?: string | null) => {
    switch (status) {
      case 'Aprovado':
        return 'bg-emerald-100 text-emerald-800';
      case 'Estudante':
        return 'bg-blue-100 text-blue-800';
      case 'Nomeado':
        return 'bg-amber-100 text-amber-800';
      case 'Na Ativa':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
      <div className="relative p-4">
        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
          {userProfile.is_studying && (
            <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500 text-white">
              Estudando
            </div>
          )}
          {userProfile.status_concurseiro && (
            <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeClass(userProfile.status_concurseiro)}`}>
              {userProfile.status_concurseiro}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={avatarUrl} alt={userProfile.name} onError={() => setAvatarError(true)} />
              <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-center">{userProfile.name || 'Usuário'}</h3>
          {userProfile.email && (
            <p className="text-xs text-muted-foreground">
              @{userProfile.username || userProfile.email.split('@')[0]}
            </p>
          )}
          <p className="text-xs text-muted-foreground mb-2 text-center break-words mx-2">
            {userProfile.bio || ''}
          </p>
        </div>
        
        <div className="grid grid-cols-3 text-center border-t border-b py-2 mb-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{userProfile.postCount}</span>
            <span className="text-xs text-muted-foreground">Rankings</span>
          </div>
          <div className="flex flex-col border-x">
            <span className="text-sm font-semibold">{userProfile.followerCount}</span>
            <span className="text-xs text-muted-foreground">Seguidores</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{userProfile.approvalCount || 0}</span>
            <span className="text-xs text-muted-foreground">Aprovações</span>
          </div>
        </div>
        
        <Button onClick={handleCardClick} variant="outline" className="w-full">
          <User className="h-4 w-4 mr-2" />
          Ver Perfil
        </Button>
      </div>
    </div>
  );
};
