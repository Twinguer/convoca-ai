
import { supabase } from '@/integrations/supabase/client';
import { User } from './UsersList';

export const fetchFollowers = async (userId: string): Promise<User[]> => {
  try {
    // First try the joined approach
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

    const formattedFollowers = followersData
      .filter(item => item.follower) // Filter out any null followers
      .map(item => ({
        id: item.follower.id,
        name: item.follower.name,
        avatar_url: item.follower.avatar_url
      }));

    return formattedFollowers;
  } catch (error) {
    console.error('Error fetching followers with join:', error);
    
    // Fallback to fetching in two steps
    try {
      const { data: followerIds, error: followerIdsError } = await supabase
        .from('user_followers')
        .select('follower_id')
        .eq('followed_id', userId)
        .limit(10);
        
      if (followerIdsError) throw followerIdsError;
      
      const followerProfiles: User[] = [];
      
      if (followerIds && followerIds.length > 0) {
        const followerIdList = followerIds.map(f => f.follower_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('users_profiles')
          .select('id, name, avatar_url')
          .in('id', followerIdList);
          
        if (profilesError) throw profilesError;
        
        if (profiles) {
          return profiles.map(profile => ({
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url
          }));
        }
      }
      
      return followerProfiles;
    } catch (fallbackError) {
      console.error('Error using fallback method for followers:', fallbackError);
      return [];
    }
  }
};

export const fetchFollowing = async (userId: string): Promise<User[]> => {
  try {
    // First try the joined approach
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

    const formattedFollowing = followingData
      .filter(item => item.followed) // Filter out any null followed
      .map(item => ({
        id: item.followed.id,
        name: item.followed.name,
        avatar_url: item.followed.avatar_url
      }));

    return formattedFollowing;
  } catch (error) {
    console.error('Error fetching following with join:', error);
    
    // Fallback to fetching in two steps
    try {
      const { data: followingIds, error: followingIdsError } = await supabase
        .from('user_followers')
        .select('followed_id')
        .eq('follower_id', userId)
        .limit(10);
        
      if (followingIdsError) throw followingIdsError;
      
      const followingProfiles: User[] = [];
      
      if (followingIds && followingIds.length > 0) {
        const followingIdList = followingIds.map(f => f.followed_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('users_profiles')
          .select('id, name, avatar_url')
          .in('id', followingIdList);
          
        if (profilesError) throw profilesError;
        
        if (profiles) {
          return profiles.map(profile => ({
            id: profile.id,
            name: profile.name,
            avatar_url: profile.avatar_url
          }));
        }
      }
      
      return followingProfiles;
    } catch (fallbackError) {
      console.error('Error using fallback method for following:', fallbackError);
      return [];
    }
  }
};
