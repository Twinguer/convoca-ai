
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateSpecificUsers, generateTestUsers } from '@/integrations/supabase/community';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  concursos_aprovados?: string | null;
  followerCount: number;
  postCount: number;
  approvalCount: number;
  status_concurseiro?: string | null;
}

/**
 * Custom hook for fetching and managing community users
 * Handles loading, error states, and demo users
 */
export const useCommunityUsers = () => {
  const { toast } = useToast();
  const [showDemoUsers, setShowDemoUsers] = useState(false);
  
  // Default demo users to display when no real users are found
  const demoUsers: UserProfile[] = [
    {
      id: '1',
      name: 'Camila Oliveira',
      email: 'camila.oliveira@example.com',
      bio: 'Advogada, estudando para concursos da área jurídica há 3 anos.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Camila`,
      concursos_aprovados: 'TRT,TJ-SP',
      followerCount: 35,
      postCount: 12,
      approvalCount: 2,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '2',
      name: 'João Pereira',
      email: 'joao.pereira@example.com',
      bio: 'Formado em Administração, focado em concursos da área fiscal.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=João`,
      concursos_aprovados: 'Receita Federal',
      followerCount: 28,
      postCount: 8,
      approvalCount: 1,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '3',
      name: 'Mariana Costa',
      email: 'mariana.costa@example.com',
      bio: 'Engenheira, buscando aprovação em concursos de tribunais.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana`,
      concursos_aprovados: 'TCU',
      followerCount: 42,
      postCount: 15,
      approvalCount: 1,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '4',
      name: 'Ana Silva',
      email: 'ana.silva@example.com',
      bio: 'Professora de Português, estudando para o Banco do Brasil.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Ana`,
      concursos_aprovados: 'Banco do Brasil,Caixa',
      followerCount: 31,
      postCount: 10,
      approvalCount: 2,
      status_concurseiro: 'Aposentado'
    },
    {
      id: '5',
      name: 'Rafael Souza',
      email: 'rafael.souza@example.com',
      bio: 'Contador, especializado em contabilidade pública.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Rafael`,
      concursos_aprovados: 'INSS,TCE',
      followerCount: 25,
      postCount: 7,
      approvalCount: 2,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '6',
      name: 'Lucas Santos',
      email: 'lucas.santos@example.com',
      bio: 'Programador, interessado em concursos da área de tecnologia.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas`,
      concursos_aprovados: null,
      followerCount: 18,
      postCount: 5,
      approvalCount: 0,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '7',
      name: 'Maria Clara',
      email: 'maria.clara@example.com',
      bio: 'Psicóloga, buscando concursos na área de saúde.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Maria`,
      concursos_aprovados: 'SES-SP',
      followerCount: 23,
      postCount: 9,
      approvalCount: 1,
      status_concurseiro: 'Na Ativa'
    },
    {
      id: '8',
      name: 'Felipe Mendes',
      email: 'felipe.mendes@example.com',
      bio: 'Estudante de Direito, primeira tentativa em concursos.',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=Felipe`,
      concursos_aprovados: null,
      followerCount: 12,
      postCount: 3,
      approvalCount: 0,
      status_concurseiro: 'Na Ativa'
    }
  ];

  // Fetch users with improved error handling and automatic refresh
  const { 
    data: users, 
    isLoading, 
    isError, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      try {
        console.log('Fetching community users...');
        
        // Get all users without filtering
        const { data: profiles, error } = await supabase
          .from('users_profiles')
          .select('id, name, avatar_url, bio, email, concursos_aprovados, status_concurseiro')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }
        
        console.log('Profiles fetched:', profiles?.length || 0);
        
        if (!profiles || profiles.length === 0) {
          // If no users found, try to generate test users
          console.log('No users found, attempting to generate test users');
          
          try {
            // First try to generate specific users
            const specificResult = await generateSpecificUsers();
            if (specificResult.success) {
              console.log('Generated specific users:', specificResult.message);
              // If specific users were generated, refetch immediately
              const { data: newProfiles } = await supabase
                .from('users_profiles')
                .select('id, name, avatar_url, bio, email, concursos_aprovados, status_concurseiro')
                .order('created_at', { ascending: false });
                
              if (newProfiles && newProfiles.length > 0) {
                console.log('New profiles fetched after generation:', newProfiles.length);
                return await processProfiles(newProfiles);
              }
            }
          } catch (specificError) {
            console.error('Error generating specific users:', specificError);
          }
          
          try {
            // If specific users didn't work, try generating random test users
            const testResult = await generateTestUsers(10);
            if (testResult.success) {
              console.log('Generated test users:', testResult.message);
              
              // Refetch the data immediately after generating test users
              const { data: newProfiles } = await supabase
                .from('users_profiles')
                .select('id, name, avatar_url, bio, email, concursos_aprovados, status_concurseiro')
                .order('created_at', { ascending: false });
                
              if (newProfiles && newProfiles.length > 0) {
                console.log('New profiles fetched after generation:', newProfiles.length);
                return await processProfiles(newProfiles);
              }
            }
          } catch (testError) {
            console.error('Error generating test users:', testError);
          }
          
          // If we still don't have users, show the demo users
          setShowDemoUsers(true);
          return [];
        }
        
        // Process the profiles to add additional data
        return await processProfiles(profiles);
        
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Erro ao carregar usuários',
          description: 'Não foi possível carregar os usuários da comunidade.',
          variant: 'destructive',
        });
        
        // Show demo users on error
        setShowDemoUsers(true);
        return [];
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 2, // Retry twice on failure
  });

  // Process profiles to add follower and post counts
  const processProfiles = async (profiles: any[]) => {
    try {
      // For each user, get their follower count and post count
      const usersWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          // Get follower count
          const { data: followerCount, error: followerError } = await supabase
            .rpc('count_user_followers', { user_id: profile.id });
            
          if (followerError) {
            console.error('Error fetching follower count:', followerError);
          }
          
          // Get post count (currently a placeholder)
          const { data: postCount, error: postError } = await supabase
            .rpc('count_user_posts', { user_id: profile.id });
            
          if (postError) {
            console.error('Error fetching post count:', postError);
          }
          
          // Get approval count (based on concursos_aprovados field if it exists)
          const approvalCount = profile.concursos_aprovados 
            ? profile.concursos_aprovados.split(',').filter(Boolean).length 
            : 0;
          
          return {
            ...profile,
            followerCount: followerCount || 0,
            postCount: postCount || 0,
            approvalCount: approvalCount,
            status_concurseiro: profile.status_concurseiro || 'Na Ativa'
          };
        })
      );
      
      console.log('Users with counts:', usersWithCounts.length);
      
      // Sort users by follower count (most followers first)
      return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
    } catch (error) {
      console.error('Error processing profiles:', error);
      return profiles.map(profile => ({
        ...profile,
        followerCount: 0,
        postCount: 0,
        approvalCount: 0,
        status_concurseiro: profile.status_concurseiro || 'Na Ativa'
      }));
    }
  };

  // Fetch users if we're showing demo users but there are now real users available
  const checkForRealUsers = useCallback(async () => {
    if (showDemoUsers) {
      const { data: profiles } = await supabase
        .from('users_profiles')
        .select('id')
        .limit(1);
        
      if (profiles && profiles.length > 0) {
        console.log('Real users now available, refetching...');
        setShowDemoUsers(false);
        refetch();
      }
    }
  }, [showDemoUsers, refetch]);

  useEffect(() => {
    // Check for real users periodically if showing demo users
    if (showDemoUsers) {
      const interval = setInterval(checkForRealUsers, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [showDemoUsers, checkForRealUsers]);

  useEffect(() => {
    // This debug log helps track when and what users are loaded
    console.log('Current users state:', { 
      count: users?.length || 0, 
      showDemoUsers, 
      isError,
      errorDetails: error
    });
    
    // If no users were found from the database and we're not in an error state, show demo users
    if (users && users.length === 0 && !isError) {
      setShowDemoUsers(true);
    } else if (users && users.length > 0) {
      setShowDemoUsers(false);
    }
  }, [users, isError, error]);

  return {
    users,
    demoUsers,
    isLoading,
    isError,
    showDemoUsers,
    refetch
  };
};
