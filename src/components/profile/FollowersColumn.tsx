
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck } from 'lucide-react';

interface Follower {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface FollowersColumnProps {
  userId: string;
}

export const FollowersColumn: React.FC<FollowersColumnProps> = ({ userId }) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        // Fetch followers (users who follow this profile)
        const { data: followersData, error: followersError } = await supabase
          .from('user_followers')
          .select(`
            follower_id,
            users_profiles!user_followers_follower_id_fkey(
              id,
              name,
              avatar_url
            )
          `)
          .eq('followed_id', userId)
          .limit(10);

        if (followersError) throw followersError;

        // Fetch users this profile is following
        const { data: followingData, error: followingError } = await supabase
          .from('user_followers')
          .select(`
            followed_id,
            users_profiles!user_followers_followed_id_fkey(
              id,
              name,
              avatar_url
            )
          `)
          .eq('follower_id', userId)
          .limit(10);

        if (followingError) throw followingError;

        // Format followers data
        const formattedFollowers = followersData.map(item => {
          const profile = item.users_profiles;
          return {
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url
          };
        });

        // Format following data
        const formattedFollowing = followingData.map(item => {
          const profile = item.users_profiles;
          return {
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url
          };
        });

        setFollowers(formattedFollowers);
        setFollowing(formattedFollowing);
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchFollowers();
    }
  }, [userId]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleViewProfile = (id: string) => {
    navigate(`/usuario/${id}`);
  };

  return (
    <>
      <Card className="mb-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            Seguidores ({followers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 rounded-full border-t-transparent"></div>
            </div>
          ) : followers.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {followers.map((follower) => (
                <div 
                  key={follower.id} 
                  className="flex flex-col items-center text-center cursor-pointer" 
                  onClick={() => handleViewProfile(follower.id)}
                >
                  <Avatar className="h-12 w-12">
                    {follower.avatar_url ? (
                      <AvatarImage src={follower.avatar_url} alt={follower.name} />
                    ) : (
                      <AvatarFallback>{getInitials(follower.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs mt-1 truncate w-full">{follower.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">
              Nenhum seguidor ainda
            </p>
          )}
          
          {followers.length > 0 && (
            <Button variant="link" size="sm" className="w-full mt-2 text-xs" onClick={() => navigate(`/usuario/${userId}/seguidores`)}>
              Ver todos
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
            Seguindo ({following.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-emerald-600 rounded-full border-t-transparent"></div>
            </div>
          ) : following.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {following.map((follow) => (
                <div 
                  key={follow.id} 
                  className="flex flex-col items-center text-center cursor-pointer" 
                  onClick={() => handleViewProfile(follow.id)}
                >
                  <Avatar className="h-12 w-12">
                    {follow.avatar_url ? (
                      <AvatarImage src={follow.avatar_url} alt={follow.name} />
                    ) : (
                      <AvatarFallback>{getInitials(follow.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xs mt-1 truncate w-full">{follow.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-2">
              Não seguindo ninguém ainda
            </p>
          )}
          
          {following.length > 0 && (
            <Button variant="link" size="sm" className="w-full mt-2 text-xs" onClick={() => navigate(`/usuario/${userId}/seguindo`)}>
              Ver todos
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
};
