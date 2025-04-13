
import { supabase } from '@/integrations/supabase/client';

export interface FollowerProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FollowerData {
  id: string;
  follower: {
    id: string;
    users_profiles: Array<{
      id: string;
      name: string;
      avatar_url: string | null;
    }>;
  } | null;
}

interface FollowingData {
  id: string;
  followed: {
    id: string;
    users_profiles: Array<{
      id: string;
      name: string;
      avatar_url: string | null;
    }>;
  } | null;
}

export const FollowersService = {
  // Fetch user's followers
  async getUserFollowers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_followers')
        .select(`
          id,
          follower: follower_id (
            id,
            users_profiles (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('followed_id', userId);

      if (error) {
        throw error;
      }

      return (data as FollowerData[]).map(item => {
        // Correctly accessing the nested properties
        const followerProfile = item.follower && 
          Array.isArray(item.follower.users_profiles) && 
          item.follower.users_profiles.length > 0
            ? item.follower.users_profiles[0]
            : null;
        
        return {
          id: item.follower?.id || '',
          name: followerProfile?.name || 'Usuário',
          avatar_url: followerProfile?.avatar_url || null,
        };
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  // Fetch users being followed by the user
  async getUserFollowing(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_followers')
        .select(`
          id,
          followed: followed_id (
            id,
            users_profiles (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('follower_id', userId);

      if (error) {
        throw error;
      }

      return (data as FollowingData[]).map(item => {
        // Correctly accessing the nested properties
        const followedProfile = item.followed && 
          Array.isArray(item.followed.users_profiles) && 
          item.followed.users_profiles.length > 0
            ? item.followed.users_profiles[0]
            : null;

        return {
          id: item.followed?.id || '',
          name: followedProfile?.name || 'Usuário',
          avatar_url: followedProfile?.avatar_url || null,
        };
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  // Check if one user follows another
  async checkIfFollowing(followerId: string, followedId: string) {
    try {
      const { count, error } = await supabase
        .from('user_followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', followerId)
        .eq('followed_id', followedId);

      if (error) {
        throw error;
      }

      return count > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  // Toggle follow status
  async toggleFollow(followerId: string, followedId: string) {
    try {
      const isFollowing = await this.checkIfFollowing(followerId, followedId);

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', followerId)
          .eq('followed_id', followedId);

        if (error) throw error;
        return false; // Not following anymore
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: followerId,
            followed_id: followedId
          });

        if (error) throw error;
        return true; // Now following
      }
    } catch (error) {
      console.error('Error toggling follow status:', error);
      throw error;
    }
  }
};
