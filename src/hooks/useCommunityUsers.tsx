
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
        // Log removido por segurança
        
        // Fetching users with profile data including approvals
        let query = supabase
          .from('users_profiles')
          .select(`
            id,
            name,
            avatar_url,
            email,
            bio,
            concursos_aprovados,
            status_concurseiro,
            is_studying
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

        // Log removido por segurança
        
        // Add rankings counts for each user
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            // Count user rankings
            const { count: postCount, error: postError } = await supabase
              .from('user_rankings')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            if (postError) console.error('Error counting posts:', postError);

            // Check if user is a coach
            const { data: coachData } = await supabase
              .from('coach_profiles')
              .select('id')
              .eq('coach_id', profile.id)
              .maybeSingle();

            // Generate basic info from available data
            const usernameFromName = profile.name 
              ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '')
              : `user_${profile.id.slice(0, 8)}`;

            // Calculate approval count from concursos_aprovados field
            const approvalCount = profile.concursos_aprovados 
              ? profile.concursos_aprovados.split('\n').filter(line => line.trim().length > 0).length 
              : 0;

            // Store the counts directly in the object to ensure persistence
            return {
              ...profile,
              username: usernameFromName,
              followerCount: 0, // Sistema de seguidores removido
              postCount: postCount || 0,
              approvalCount,
              status_concurseiro: profile.status_concurseiro || "Na Ativa",
              email: profile.email || '',
              bio: profile.bio || '',
              concursos_aprovados: profile.concursos_aprovados,
              concursos_participando: null,
              estado: '',
              formacao: '',
              cargo_atual: '',
              area_estudos: '',
              especialidade: '',
              curso_preparatorio: '',
              rotina_estudos: '',
              is_studying: profile.is_studying || false,
              isCoach: !!coachData
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
