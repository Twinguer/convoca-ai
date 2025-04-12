
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDemoUsers } from '@/integrations/supabase/community';

// Hook para buscar usuários da comunidade
export const useCommunityUsers = (searchQuery: string = '') => {
  // Fetch real users from Supabase
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-users', searchQuery],
    queryFn: async () => {
      try {
        // Buscando usuários reais com metadados adicionais
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
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        
        // Execute the query with pagination
        const { data: profiles, error } = await query.limit(20);

        if (error) throw error;

        // Adicionar contagens de seguidores para cada usuário
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            // Contar seguidores
            const { count: followerCount, error: followerError } = await supabase
              .rpc('count_user_followers', { user_id: profile.id });

            if (followerError) console.error('Error counting followers:', followerError);

            // Contar rankings (posts)
            const { count: postCount, error: postError } = await supabase
              .from('user_rankings')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            if (postError) console.error('Error counting posts:', postError);

            // Determinar o número de concursos aprovados
            const approvalCount = profile.concursos_aprovados 
              ? profile.concursos_aprovados.split(',').filter(Boolean).length 
              : 0;

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
