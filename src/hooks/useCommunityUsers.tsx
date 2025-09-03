
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

// Hook to fetch community users
export const useCommunityUsers = (searchQuery: string = '') => {
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  // Fetch real users from Supabase
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-users', debouncedSearchQuery],
    queryFn: async () => {
      try {
        console.log('Fetching community users with query:', debouncedSearchQuery);
        
        // Fetching users with only public metadata (secure approach)
        let query = supabase
          .from('public_profiles')
          .select(`
            id,
            name,
            avatar_url
          `);
          
        // Apply search filter if provided (only on name now)
        if (debouncedSearchQuery) {
          query = query.ilike('name', `%${debouncedSearchQuery}%`);
        }
        
        // Execute the query with pagination
        const { data: profiles, error } = await query.limit(100);

        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }

        console.log(`Fetched ${profiles.length} community profiles`);
        
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

            // Generate basic info from available data
            const usernameFromName = profile.name 
              ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')
              : `user_${profile.id.slice(0, 8)}`;

            // Default status (no private data access)
            const statusConcurseiro = "Na Ativa";

            // Store the counts directly in the object to ensure persistence
            return {
              ...profile,
              username: usernameFromName,
              followerCount: followerCount || 0,
              postCount: postCount || 0,
              approvalCount: 0, // No access to private approval data
              status_concurseiro: statusConcurseiro,
              // Default values for missing private fields
              email: '',
              bio: '',
              concursos_aprovados: null,
              concursos_participando: null,
              estado: '',
              formacao: '',
              cargo_atual: '',
              area_estudos: '',
              especialidade: '',
              curso_preparatorio: '',
              rotina_estudos: '',
              is_studying: false
            };
          })
        );

        return usersWithCounts;
      } catch (error) {
        console.error('Error fetching community users:', error);
        throw error;
      }
    },
    staleTime: 60000 // Cache for 1 minute to reduce repeated fetches
  });

  return {
    users: data || [],
    isLoading,
    isError,
    refetch
  };
};
