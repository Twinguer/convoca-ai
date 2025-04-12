
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDemoUsers } from '@/integrations/supabase/community';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

// Custom hook for debouncing values
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook to fetch community users
export const useCommunityUsers = (searchQuery: string = '') => {
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  // Fetch real users from Supabase
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-users', debouncedSearchQuery],
    queryFn: async () => {
      try {
        // Fetching users with additional metadata
        let query = supabase
          .from('users_profiles')
          .select(`
            id,
            name,
            email,
            bio,
            avatar_url,
            concursos_aprovados,
            concursos_participando,
            status_concurseiro
          `);
          
        // Apply search filter if provided
        if (debouncedSearchQuery) {
          query = query.ilike('name', `%${debouncedSearchQuery}%`);
        }
        
        // Execute the query with pagination
        const { data: profiles, error } = await query.limit(20);

        if (error) throw error;

        // Add follower and rankings counts for each user
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            // Use RPC function to count followers
            const { data: followerCount, error: followerError } = await supabase
              .rpc('count_user_followers', { user_id: profile.id });

            if (followerError) console.error('Error counting followers:', followerError);

            // Count user rankings
            const { count: postCount, error: postError } = await supabase
              .from('user_rankings')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            if (postError) console.error('Error counting posts:', postError);

            // Determine the number of concursos aprovados
            const approvalCount = profile.concursos_aprovados 
              ? profile.concursos_aprovados.split(',').filter(Boolean).length 
              : 0;

            // Store the counts directly in the object to ensure persistence
            return {
              ...profile,
              followerCount: followerCount || 0,
              postCount: postCount || 0,
              approvalCount
            };
          })
        );

        return usersWithCounts;
      } catch (error) {
        console.error('Error fetching community users:', error);
        throw error;
      }
    }
  });

  // Get demo users as fallback
  const demoUsers = getDemoUsers();
  
  // Determine if we should show demo users based on whether real data was fetched
  const showDemoUsers = isError || !data || data.length === 0;

  return {
    users: data || [],
    demoUsers,
    isLoading,
    isError,
    showDemoUsers,
    refetch
  };
};
