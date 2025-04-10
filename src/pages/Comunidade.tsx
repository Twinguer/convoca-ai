
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Heart, Trophy, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  followerCount: number;
  postCount: number;
  approvalCount: number;
}

const Comunidade: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      // Get all users with their follower counts
      const { data: profiles, error } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url, bio, email');
        
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
          
          // Get approval count (a placeholder for approved exams)
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
      
      // Sort by follower count (highest first)
      return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
    }
  });
  
  // Get following status for the current user
  const { data: followingData } = useQuery({
    queryKey: ['following-status', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', user.id);
        
      if (error) {
        console.error('Error fetching following status:', error);
        return {};
      }
      
      const followingMap: Record<string, boolean> = {};
      data.forEach(item => {
        followingMap[item.followed_id] = true;
      });
      
      setFollowingStatus(followingMap);
      return followingMap;
    },
    enabled: !!user
  });
  
  const followUser = async (userId: string) => {
    if (!user) {
      toast({
        title: "Ação necessária",
        description: "Você precisa estar conectado para seguir outros usuários.",
        variant: "destructive"
      });
      return;
    }
    
    if (user.id === userId) {
      toast({
        title: "Aviso",
        description: "Você não pode seguir a si mesmo.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (followingStatus[userId]) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', userId);
          
        if (error) throw error;
        
        setFollowingStatus(prev => ({ ...prev, [userId]: false }));
        
        toast({
          title: "Sucesso",
          description: "Você deixou de seguir este usuário."
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({ follower_id: user.id, followed_id: userId });
          
        if (error) throw error;
        
        setFollowingStatus(prev => ({ ...prev, [userId]: true }));
        
        toast({
          title: "Sucesso",
          description: "Você começou a seguir este usuário."
        });
      }
      
      // Refresh the data to update follower counts
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao tentar seguir este usuário.",
        variant: "destructive"
      });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg">Carregando usuários...</p>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg text-red-500">Erro ao carregar usuários.</p>
    </div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Comunidade</h1>
      
      {users && users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((userProfile) => (
            <Card key={userProfile.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex flex-col items-center text-center">
                  <Link to={`/perfil/${userProfile.id}`}>
                    <Avatar className="h-20 w-20 mb-2">
                      <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name} />
                      <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/perfil/${userProfile.id}`} className="font-semibold hover:underline text-lg">
                      {userProfile.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    {userProfile.bio && (
                      <p className="text-sm mt-2 line-clamp-2">{userProfile.bio}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex justify-center space-x-4 py-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-amber-500">
                      <Trophy className="h-4 w-4 mr-1" />
                      <span className="font-medium">Rankings</span>
                    </div>
                    <span className="text-lg font-bold">{userProfile.postCount}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-blue-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="font-medium">Seguidores</span>
                    </div>
                    <span className="text-lg font-bold">{userProfile.followerCount}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center text-green-500">
                      <BookOpen className="h-4 w-4 mr-1" />
                      <span className="font-medium">Aprovações</span>
                    </div>
                    <span className="text-lg font-bold">{userProfile.approvalCount}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-3 flex justify-between">
                <Button 
                  variant={followingStatus[userProfile.id] ? "default" : "outline"}
                  size="sm" 
                  onClick={() => followUser(userProfile.id)}
                  disabled={user?.id === userProfile.id}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {user?.id === userProfile.id ? 'Seu perfil' : 
                   followingStatus[userProfile.id] ? 'Seguindo' : 'Seguir'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-2 flex-1"
                  asChild
                >
                  <Link to={`/perfil/${userProfile.id}`}>
                    <Heart className="h-4 w-4 mr-2" />
                    Ver perfil
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Comunidade;
