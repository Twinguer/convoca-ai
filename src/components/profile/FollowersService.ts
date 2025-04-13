
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
}

// Updated interfaces to match the shape of the data returned by Supabase
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
  async getUserFollowers(userId: string): Promise<User[]> {
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

      if (!data || data.length === 0) {
        return [];
      }

      // Process the data to extract follower information
      return (data as unknown as FollowerData[]).map(item => {
        const follower = item.follower;
        
        if (!follower) {
          return { id: '', name: 'Usuário', avatar_url: null };
        }

        // Access the first item from the users_profiles array if it exists
        const profile = follower.users_profiles && follower.users_profiles.length > 0 
          ? follower.users_profiles[0] 
          : null;

        return {
          id: follower.id,
          name: profile?.name || 'Usuário',
          avatar_url: profile?.avatar_url || null
        };
      });
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  },

  // Fetch users being followed by the user
  async getUserFollowing(userId: string): Promise<User[]> {
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
      
      if (!data || data.length === 0) {
        return [];
      }

      // Process the data to extract followed user information
      return (data as unknown as FollowingData[]).map(item => {
        const followed = item.followed;
        
        if (!followed) {
          return { id: '', name: 'Usuário', avatar_url: null };
        }

        // Access the first item from the users_profiles array if it exists
        const profile = followed.users_profiles && followed.users_profiles.length > 0 
          ? followed.users_profiles[0] 
          : null;

        return {
          id: followed.id,
          name: profile?.name || 'Usuário',
          avatar_url: profile?.avatar_url || null
        };
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  },

  // Check if one user follows another
  async checkIfFollowing(followerId: string, followedId: string): Promise<boolean> {
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
  async toggleFollow(followerId: string, followedId: string): Promise<boolean> {
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
