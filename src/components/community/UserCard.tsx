
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/profile/OnlineIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  isCoach?: boolean;
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
  
  // Early return if userProfile is not provided
  if (!userProfile) {
    return null;
  }
  
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
        return 'bg-primary/10 text-primary';
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
    <div 
      className="rounded-xl border border-border bg-card text-card-foreground shadow-lg overflow-hidden cursor-pointer" 
      style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}
      onClick={handleCardClick}
    >
      <div className="relative p-5 flex flex-col">
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-3">
            <Avatar className="h-20 w-20" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
              <AvatarImage src={avatarUrl} alt={userProfile.name} onError={() => setAvatarError(true)} />
              <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
            </Avatar>
            <OnlineIndicator userId={userProfile.id} />
          </div>
          
          <h3 className="font-semibold text-base text-center leading-tight">
            {userProfile.name ? 
              userProfile.name.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ').substring(0, 15) 
              : 'Usuário'
            }
          </h3>
          {userProfile.isCoach && (
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 mt-1">
              Coach
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4 border-t border-b py-3">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-primary">{userProfile.postCount}</span>
            <span className="text-xs text-muted-foreground text-center">Rankings</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-600">{userProfile.approvalCount || 0}</span>
            <span className="text-xs text-muted-foreground text-center">Aprovações</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};
