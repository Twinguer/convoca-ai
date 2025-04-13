
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trophy, Users, BookOpen, Pen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  concursos_aprovados?: string | null;
  followerCount: number;
  postCount: number;
  approvalCount: number;
  status_concurseiro?: string | null;
}

interface UserCardProps {
  userProfile: UserProfile;
  onClick?: (userId: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ userProfile, onClick }) => {
  const [avatarError, setAvatarError] = useState(false);
  const navigate = useNavigate();
  
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
    } else {
      navigate(`/usuario/${userProfile.id}`);
    }
  };

  // Get the number of approvals from concursos_aprovados (if it's a string with newlines)
  const approvalCount = userProfile.concursos_aprovados 
    ? userProfile.concursos_aprovados.split('\n').filter(Boolean).length 
    : userProfile.approvalCount || 0;

  return (
    <Card 
      key={userProfile.id} 
      className="overflow-hidden hover:shadow-md transition-shadow h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2 flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 mb-2">
          <AvatarImage 
            src={avatarUrl} 
            alt={userProfile.name} 
            onError={() => setAvatarError(true)}
          />
          <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-semibold text-sm">{userProfile.name || 'Usuário'}</p>
          {userProfile.bio && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {userProfile.bio}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-1 text-center">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center text-amber-500">
              <Trophy className="h-4 w-4 mr-1" />
              <span className="text-xs">Rankings</span>
            </div>
            <span className="text-sm font-bold">{userProfile.postCount}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center text-blue-500">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs">Seguidores</span>
            </div>
            <span className="text-sm font-bold">{userProfile.followerCount}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center text-green-500">
              <BookOpen className="h-4 w-4 mr-1" />
              <span className="text-xs">Aprovações</span>
            </div>
            <span className="text-sm font-bold">{approvalCount}</span>
          </div>
          
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center text-purple-500">
              <Pen className="h-4 w-4 mr-1" />
              <span className="text-xs">Status</span>
            </div>
            <span className="text-sm font-bold">{userProfile.status_concurseiro || 'Na Ativa'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
