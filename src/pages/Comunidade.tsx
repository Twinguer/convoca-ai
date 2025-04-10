
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, generateSpecificUsers } from '../integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trophy, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

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

const Comunidade: React.FC = () => {
  const { user } = useAuth();
  
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      // Get all users without filtering
      const { data: profiles, error } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url, bio, email, concursos_aprovados');
        
      if (error) throw error;
      
      // For each user, get their follower count and post count
      const usersWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          // Get follower count
          const { data: followerCount, error: followerError } = await supabase
            .rpc('count_user_followers', { user_id: profile.id });
            
          if (followerError) console.error('Error fetching follower count:', followerError);
          
          // Get post count (currently a placeholder)
          const { data: postCount, error: postError } = await supabase
            .rpc('count_user_posts', { user_id: profile.id });
            
          if (postError) console.error('Error fetching post count:', postError);
          
          // Get approval count (based on concursos_aprovados field if it exists)
          const approvalCount = profile.concursos_aprovados 
            ? profile.concursos_aprovados.split(',').length 
            : 0;
          
          return {
            ...profile,
            followerCount: followerCount || 0,
            postCount: postCount || 0,
            approvalCount: approvalCount
          };
        })
      );
      
      // Sort users by follower count (most followers first)
      return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
    }
  });
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleCreateUsers = async () => {
    const result = await generateSpecificUsers();
    if (result.success) {
      refetch();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg">Carregando usuários...</p>
    </div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Comunidade</h1>
        
        {/* Admin button - hidden in production but available for this exercise */}
        <Button 
          onClick={handleCreateUsers} 
          variant="outline"
          className="hidden" // Hide the button as requested
        >
          Gerar 10 usuários específicos
        </Button>
      </div>
      
      {users && users.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map((userProfile: UserProfile) => (
            <Card key={userProfile.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name} />
                  <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{userProfile.name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{userProfile.bio}</p>
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
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Comunidade;
