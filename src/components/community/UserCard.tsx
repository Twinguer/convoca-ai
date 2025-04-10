
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trophy, Users, BookOpen } from 'lucide-react';

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
}

interface UserCardProps {
  userProfile: UserProfile;
}

export const UserCard: React.FC<UserCardProps> = ({ userProfile }) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Generate a placeholder avatar URL if none exists
  const avatarUrl = userProfile.avatar_url || 
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.name || 'user')}`;

  return (
    <Card key={userProfile.id} className="overflow-hidden hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={avatarUrl} alt={userProfile.name} />
          <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-semibold text-sm">{userProfile.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {userProfile.email}
          </p>
          {userProfile.bio && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {userProfile.bio}
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center text-amber-500">
              <Trophy className="h-3 w-3 mr-1" />
              <span className="text-xs">Rankings</span>
            </div>
            <span className="text-sm font-bold">{userProfile.postCount}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center text-blue-500">
              <Users className="h-3 w-3 mr-1" />
              <span className="text-xs">Seguidores</span>
            </div>
            <span className="text-sm font-bold">{userProfile.followerCount}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center text-green-500">
              <BookOpen className="h-3 w-3 mr-1" />
              <span className="text-xs">Aprovações</span>
            </div>
            <span className="text-sm font-bold">{userProfile.approvalCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
