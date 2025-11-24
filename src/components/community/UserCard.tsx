
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from '@/components/profile/OnlineIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card 
      className="bg-primary/5 border-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col" 
      style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}
      onClick={handleCardClick}
    >
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex flex-col items-center mb-4 flex-shrink-0">
          <div className="relative mb-3">
            <Avatar className="h-20 w-20" style={{ boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              <AvatarImage src={avatarUrl} alt={userProfile.name} onError={() => setAvatarError(true)} />
              <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
            </Avatar>
            <OnlineIndicator userId={userProfile.id} />
          </div>
          
          <h3 className="font-semibold text-base text-center leading-tight min-h-[2.5rem] flex items-center justify-center text-balance">
            {userProfile.name?.trim() || 'Usuário'}
          </h3>
          
          {/* Espaço reservado para badge do coach - sempre presente para manter altura consistente */}
          <div className="min-h-[1.5rem] mt-1 flex items-center justify-center">
            {userProfile.isCoach && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200">
                Coach
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 border-t border-b py-3 flex-shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-primary">{userProfile.postCount}</span>
            <span className="text-xs text-muted-foreground text-center">Rankings</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-green-600">{userProfile.approvalCount || 0}</span>
            <span className="text-xs text-muted-foreground text-center">Aprovações</span>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
};
