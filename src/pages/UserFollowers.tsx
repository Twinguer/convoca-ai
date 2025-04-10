
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, User, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FollowerUser {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  isFollowing?: boolean;
}

const UserFollowers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  
  // Fetch the user's followers
  const { data: followers, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['user-followers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get IDs of people following this user
      const { data: followerData, error } = await supabase
        .from('user_followers')
        .select('follower_id')
        .eq('followed_id', user.id);
        
      if (error) {
        console.error('Error fetching followers:', error);
        return [];
      }
      
      if (!followerData || followerData.length === 0) return [];
      
      // Get the profiles of the followers
      const followerIds = followerData.map(f => f.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url, bio, email')
        .in('id', followerIds);
        
      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError);
        return [];
      }
      
      // Get who the current user is following
      const { data: userFollowing, error: followingError } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', user.id);
        
      if (followingError) {
        console.error('Error fetching user following:', followingError);
      } else {
        // Create a map of who the user is following
        const followMap: Record<string, boolean> = {};
        userFollowing?.forEach(f => {
          followMap[f.followed_id] = true;
        });
        setFollowingMap(followMap);
      }
      
      return profiles.map(profile => ({
        ...profile,
        isFollowing: followingMap[profile.id] || false
      }));
    },
    enabled: !!user
  });
  
  // Fetch users that the current user is following
  const { data: following, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['user-following', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get IDs of people this user is following
      const { data: followingData, error } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', user.id);
        
      if (error) {
        console.error('Error fetching following:', error);
        return [];
      }
      
      if (!followingData || followingData.length === 0) return [];
      
      // Get the profiles of the people being followed
      const followingIds = followingData.map(f => f.followed_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url, bio, email')
        .in('id', followingIds);
        
      if (profilesError) {
        console.error('Error fetching following profiles:', profilesError);
        return [];
      }
      
      // All these users are being followed by the current user
      const newFollowingMap = { ...followingMap };
      profiles.forEach(profile => {
        newFollowingMap[profile.id] = true;
      });
      setFollowingMap(newFollowingMap);
      
      return profiles.map(profile => ({
        ...profile,
        isFollowing: true
      }));
    },
    enabled: !!user
  });
  
  const toggleFollow = async (userId: string) => {
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
      if (followingMap[userId]) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', userId);
          
        if (error) throw error;
        
        setFollowingMap(prev => {
          const updated = { ...prev };
          updated[userId] = false;
          return updated;
        });
        
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
        
        setFollowingMap(prev => {
          const updated = { ...prev };
          updated[userId] = true;
          return updated;
        });
        
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
  
  // Generate initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Faça login para ver seus seguidores</h2>
        <p className="text-muted-foreground mb-6">
          Você precisa estar conectado para acessar esta página
        </p>
        <Button onClick={() => navigate('/auth')}>
          Fazer login
        </Button>
      </div>
    );
  }
  
  const renderUserList = (users: FollowerUser[] | undefined, isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!users || users.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(userProfile => (
          <Card key={userProfile.id} className="overflow-hidden">
            <div className="p-4 flex space-x-4">
              <Avatar className="h-16 w-16">
                {userProfile.avatar_url ? (
                  <AvatarImage src={userProfile.avatar_url} alt={userProfile.name} />
                ) : (
                  <AvatarFallback className="text-lg">{getInitials(userProfile.name)}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium">{userProfile.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{userProfile.bio || 'Sem biografia'}</p>
                
                <div className="mt-3 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                  >
                    <a href={`/perfil/${userProfile.id}`}>Ver perfil</a>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="px-3"
                    variant={followingMap[userProfile.id] ? "default" : "outline"}
                    onClick={() => toggleFollow(userProfile.id)}
                    disabled={user.id === userProfile.id}
                  >
                    {user.id === userProfile.id ? (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Seu perfil
                      </>
                    ) : followingMap[userProfile.id] ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rede de Contatos</h1>
      
      <Tabs defaultValue="followers">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
          <TabsTrigger value="followers">
            <Users className="h-4 w-4 mr-2" />
            Seguidores ({followers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="following">
            <UserPlus className="h-4 w-4 mr-2" />
            Seguindo ({following?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="followers">
          <Card>
            <CardHeader>
              <CardTitle>Meus Seguidores</CardTitle>
              <CardDescription>
                Pessoas que seguem sua atividade e resultados em concursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserList(
                followers, 
                isLoadingFollowers, 
                "Você ainda não tem seguidores. Compartilhe seu perfil para aumentar sua rede!"
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="following">
          <Card>
            <CardHeader>
              <CardTitle>Pessoas que você segue</CardTitle>
              <CardDescription>
                Candidatos e profissionais que você acompanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserList(
                following, 
                isLoadingFollowing, 
                "Você ainda não está seguindo ninguém. Encontre outros candidatos para ampliar sua rede!"
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <Button onClick={() => navigate('/perfil')}>
          Voltar ao perfil
        </Button>
      </div>
    </div>
  );
};

export default UserFollowers;
