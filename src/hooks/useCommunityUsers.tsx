
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

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
          devLog.error('Error fetching profiles:', error);
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

            if (postError) devLog.error('Error counting posts:', postError);

            // Check if user is a coach using RPC function (bypasses RLS issues)
            let isCoach = false;
            try {
              const { data: coachCheck, error: coachError } = await supabase.rpc('is_user_coach', {
                p_user_id: profile.id
              });
              
              // RPC returns boolean directly (but check for truthy value)
              if (!coachError && (coachCheck === true || coachCheck === 1)) {
                isCoach = true;
              } else if (coachError) {
                // If RPC fails, try direct query as fallback
                const { data: coachSubscription, error: subError } = await supabase
                  .from('coach_subscriptions')
                  .select('id, status, expires_at')
                  .eq('coach_id', profile.id)
                  .eq('status', 'active')
                  .maybeSingle();
                
                if (!subError && coachSubscription) {
                  isCoach = !coachSubscription.expires_at || new Date(coachSubscription.expires_at) > new Date();
                }
              }
            } catch (error) {
              // If both fail, try direct query as last resort
              try {
                const { data: coachSubscription } = await supabase
                  .from('coach_subscriptions')
                  .select('id, status, expires_at')
                  .eq('coach_id', profile.id)
                  .eq('status', 'active')
                  .maybeSingle();
                
                if (coachSubscription) {
                  isCoach = !coachSubscription.expires_at || new Date(coachSubscription.expires_at) > new Date();
                }
              } catch (fallbackError) {
                // If all fail, assume not coach
                isCoach = false;
              }
            }
            
            // Check if user is Pro using RPC function
            let isPro = false;
            try {
              const { data: proCheck, error: proError } = await supabase.rpc('is_user_pro', {
                p_user_id: profile.id
              });
              
              // RPC returns boolean directly (but check for truthy value)
              if (!proError && (proCheck === true || proCheck === 1)) {
                isPro = true;
              } else if (proError) {
                // If RPC fails, try direct query as fallback
                const { data: subscription, error: subError } = await supabase
                  .from('user_subscriptions')
                  .select('plan, is_active, expires_at')
                  .eq('user_id', profile.id)
                  .maybeSingle();
                
                if (!subError && subscription) {
                  isPro = subscription.plan === 'pro' 
                    && subscription.is_active === true
                    && (!subscription.expires_at || new Date(subscription.expires_at) > new Date());
                }
              }
            } catch (error) {
              // If both fail, assume not Pro
              isPro = false;
            }

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
              isCoach: isCoach,
              isPro: isPro
            };
          })
        );

        return usersWithCounts;
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
