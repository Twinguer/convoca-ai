
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
            estado,
            formacao,
            cargo_atual,
            area_estudos,
            especialidade,
            curso_preparatorio,
            rotina_estudos,
            is_studying
          `);
          
        // Apply search filter if provided
        if (debouncedSearchQuery) {
          query = query.or(`name.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`);
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

            // Determine the number of concursos aprovados
            const approvalCount = profile.concursos_aprovados 
              ? profile.concursos_aprovados.split('\n').filter(Boolean).length 
              : 0;
              
            // Gerar um email de usuário com base no email
            const emailParts = profile.email.split('@');
            const usernameFromEmail = emailParts[0].toLowerCase().replace(/[^a-z0-9]/g, '');

            // Generate a status based on approvals or default to "Na Ativa"
            const statusConcurseiro = approvalCount > 0 ? "Aprovado" : "Na Ativa";

            // Store the counts directly in the object to ensure persistence
            return {
              ...profile,
              username: usernameFromEmail, // Criar username como fallback
              followerCount: followerCount || 0,
              postCount: postCount || 0,
              approvalCount,
              status_concurseiro: statusConcurseiro // Fornecer valor dinamicamente, não depender do banco
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
