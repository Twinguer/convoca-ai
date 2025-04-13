
import { supabase } from '@/integrations/supabase/client';

export interface Follower {
  id: string;
  name: string;
  avatar_url?: string | null;
}

export const getFollowers = async (userId: string): Promise<Follower[]> => {
  try {
    // Get the IDs of users following the specified user
    const { data: followerData, error: followerError } = await supabase
      .from('user_followers')
      .select('follower_id')
      .eq('followed_id', userId);

    if (followerError) {
      throw followerError;
    }

    if (!followerData || followerData.length === 0) {
      return [];
    }

    // Get the follower IDs
    const followerIds = followerData.map(item => item.follower_id);

    // Get the user profile information for each follower
    const { data: followers, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', followerIds);

    if (profileError) {
      throw profileError;
    }

    // Map the data to our Follower interface
    return followers.map(follower => ({
      id: follower.id,
      name: follower.name,
      avatar_url: follower.avatar_url
    }));
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
};

export const getRandomUsers = async (count: number = 10, excludeUserId?: string): Promise<Follower[]> => {
  try {
    let query = supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .limit(count);

    // If we need to exclude a user (e.g. the current user)
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching random users:', error);
    return [];
  }
};

export const getFollowing = async (userId: string): Promise<Follower[]> => {
  try {
    // Get the IDs of users that the specified user is following
    const { data: followingData, error: followingError } = await supabase
      .from('user_followers')
      .select('followed_id')
      .eq('follower_id', userId);

    if (followingError) {
      throw followingError;
    }

    if (!followingData || followingData.length === 0) {
      return [];
    }

    // Get the following IDs
    const followingIds = followingData.map(item => item.followed_id);

    // Get the user profile information for each following
    const { data: following, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', followingIds);

    if (profileError) {
      throw profileError;
    }

    // Map the data to our Follower interface
    return following.map(user => ({
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url
    }));
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
};

export const followUser = async (followerId: string, followedId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_followers')
      .insert({
        follower_id: followerId,
        followed_id: followedId
      });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
};

export const unfollowUser = async (followerId: string, followedId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followedId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
};
