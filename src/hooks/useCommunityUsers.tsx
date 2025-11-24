
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { devLog } from '@/utils/productionLogger';

// Hook to fetch community users
export const useCommunityUsers = (searchQuery: string = '') => {
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms delay

  // Fetch real users from Supabase
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-users', debouncedSearchQuery],
    queryFn: async () => {
      try {
        // Log removido por segurança
        
        const trimmedSearch = debouncedSearchQuery?.trim();
        const searchParam = trimmedSearch ? trimmedSearch : null;

        const { data: profiles, error } = await supabase.rpc('get_public_community_profiles', {
          p_search: searchParam,
          p_limit: 120,
          p_offset: 0
        });

        if (error) {
          devLog.error('Error fetching community profiles via RPC:', error);
          throw error;
        }

        const sanitizedProfiles = (profiles || []).map((profile) => {
          const displayName = profile?.name ?? 'Concurseiro';
          const usernameFromName = displayName
            ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '')
            : `user_${String(profile?.id).slice(0, 8)}`;
          const fallbackEmail = `${usernameFromName || 'usuario'}@privado.convoca`;

          return {
            id: profile?.id,
            name: displayName,
            nickname: profile?.nickname || null,
            publicHandle: profile?.nickname ? `@${profile.nickname}` : null,
            avatar_url: profile?.avatar_url || '',
            username: usernameFromName,
            followerCount: 0,
            postCount: profile?.ranking_count ?? 0,
            approvalCount: profile?.approval_count ?? 0,
            status_concurseiro: profile?.status_concurseiro || 'Na Ativa',
            email: fallbackEmail,
            bio: profile?.bio || '',
            concursos_aprovados: null,
            concursos_participando: null,
            estado: '',
            formacao: '',
            cargo_atual: '',
            area_estudos: '',
            especialidade: '',
            curso_preparatorio: '',
            rotina_estudos: '',
            is_studying: profile?.is_studying || false,
            isCoach: profile?.is_coach ?? false,
            isPro: profile?.is_pro ?? false
          };
        });

        return sanitizedProfiles;
      } catch (error) {
        devLog.error('Error fetching community users:', error);
        throw error;
      }
    },
    staleTime: 0, // Sempre buscar dados frescos para garantir badge Coach atualizado
    cacheTime: 0 // Não cachear dados
  });

  return {
    users: data || [],
    isLoading,
    isError,
    refetch
  };
};
