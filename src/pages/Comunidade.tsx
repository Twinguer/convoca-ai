
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  followerCount: number;
  postCount: number;
}

const Comunidade: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      // Get all users with their follower counts
      const { data: profiles, error } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url');
        
      if (error) throw error;
      
      // For each user, get their follower count and post count
      const usersWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          // Get follower count
          const { data: followerCount, error: followerError } = await supabase
            .rpc('count_user_followers', { user_id: profile.id });
            
          if (followerError) console.error('Error fetching follower count:', followerError);
          
          // Get post count
          const { data: postCount, error: postError } = await supabase
            .rpc('count_user_posts', { user_id: profile.id });
            
          if (postError) console.error('Error fetching post count:', postError);
          
          return {
            ...profile,
            followerCount: followerCount || 0,
            postCount: postCount || 0
          };
        })
      );
      
      // Sort by follower count (highest first)
      return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
    }
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
    
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();
        
      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Você deixou de seguir este usuário."
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({ follower_id: user.id, following_id: userId });
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Você começou a seguir este usuário."
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao tentar seguir este usuário.",
        variant: "destructive"
      });
    }
  };
  
  const isFollowing = async (userId: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data } = await supabase
      .from('user_followers')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();
      
    return !!data;
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
                <div className="flex items-center gap-3">
                  <Link to={`/perfil/${userProfile.id}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.name} />
                      <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/perfil/${userProfile.id}`} className="font-semibold hover:underline">
                      {userProfile.name}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" /> 
                        {userProfile.followerCount} seguidores
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" /> 
                        {userProfile.postCount} posts
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mt-2 grid grid-cols-3 gap-1 h-24 overflow-hidden">
                  {/* Placeholder for recent posts/images */}
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="bg-gray-100 rounded aspect-square w-full flex items-center justify-center"
                    >
                      <MessageSquare className="h-6 w-6 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => followUser(userProfile.id)}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {user && user.id === userProfile.id ? 'Seu perfil' : 'Seguir'}
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
