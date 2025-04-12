
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
            follower:follower_id(
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
            followed:followed_id(
              id,
              name,
              avatar_url
            )
          `)
          .eq('follower_id', userId)
          .limit(10);

        if (followingError) throw followingError;

        // Format followers data
        const formattedFollowers = followersData
          .filter(item => item.follower) // Filter out any null followers
          .map(item => ({
            id: item.follower.id,
            name: item.follower.name,
            avatar_url: item.follower.avatar_url
          }));

        // Format following data
        const formattedFollowing = followingData
          .filter(item => item.followed) // Filter out any null followed
          .map(item => ({
            id: item.followed.id,
            name: item.followed.name,
            avatar_url: item.followed.avatar_url
          }));

        setFollowers(formattedFollowers);
        setFollowing(formattedFollowing);
      } catch (error) {
        console.error('Error fetching followers:', error);
        
        // Fallback to fetching directly from users_profiles if the join doesn't work
        try {
          // For followers
          const { data: followerIds, error: followerIdsError } = await supabase
            .from('user_followers')
            .select('follower_id')
            .eq('followed_id', userId)
            .limit(10);
            
          if (followerIdsError) throw followerIdsError;
          
          const followerProfiles: Follower[] = [];
          
          if (followerIds && followerIds.length > 0) {
            const followerIdList = followerIds.map(f => f.follower_id);
            
            const { data: profiles, error: profilesError } = await supabase
              .from('users_profiles')
              .select('id, name, avatar_url')
              .in('id', followerIdList);
              
            if (profilesError) throw profilesError;
            
            if (profiles) {
              followerProfiles.push(...profiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                avatar_url: profile.avatar_url
              })));
            }
          }
          
          // For following
          const { data: followingIds, error: followingIdsError } = await supabase
            .from('user_followers')
            .select('followed_id')
            .eq('follower_id', userId)
            .limit(10);
            
          if (followingIdsError) throw followingIdsError;
          
          const followingProfiles: Follower[] = [];
          
          if (followingIds && followingIds.length > 0) {
            const followingIdList = followingIds.map(f => f.followed_id);
            
            const { data: profiles, error: profilesError } = await supabase
              .from('users_profiles')
              .select('id, name, avatar_url')
              .in('id', followingIdList);
              
            if (profilesError) throw profilesError;
            
            if (profiles) {
              followingProfiles.push(...profiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                avatar_url: profile.avatar_url
              })));
            }
          }
          
          setFollowers(followerProfiles);
          setFollowing(followingProfiles);
        } catch (fallbackError) {
          console.error('Error using fallback method:', fallbackError);
          // Set empty arrays if all else fails
          setFollowers([]);
          setFollowing([]);
        }
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
