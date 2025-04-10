
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
}

const Comunidade: React.FC = () => {
  const navigate = useNavigate();
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
      approvalCount: 2
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
      approvalCount: 1
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
      approvalCount: 1
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
      approvalCount: 2
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
      approvalCount: 2
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
      approvalCount: 0
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
      approvalCount: 1
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
      approvalCount: 0
    }
  ];

  const { data: users, isLoading, isError, refetch } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      try {
        console.log('Fetching community users...');
        // Get all users without filtering
        const { data: profiles, error } = await supabase
          .from('users_profiles')
          .select('id, name, avatar_url, bio, email, concursos_aprovados');
          
        if (error) {
          console.error('Error fetching profiles:', error);
          throw error;
        }
        
        console.log('Profiles fetched:', profiles?.length || 0);
        
        if (!profiles || profiles.length === 0) {
          // If no users found, try to generate some test users for display
          console.log('No users found, attempting to generate test users');
          try {
            const specificResult = await generateSpecificUsers();
            if (specificResult.success) {
              console.log('Generated specific users:', specificResult.message);
              // If specific users were generated, refetch the data
              return refetch();
            }
          } catch (specificError) {
            console.error('Error generating specific users:', specificError);
          }
          
          try {
            const testResult = await generateTestUsers(10);
            if (testResult.success) {
              console.log('Generated test users:', testResult.message);
              // If test users were generated, refetch the data
              return refetch();
            }
          } catch (testError) {
            console.error('Error generating test users:', testError);
          }
          
          // If we still don't have users, show the demo users
          setShowDemoUsers(true);
          return [];
        }
        
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
              approvalCount: approvalCount
            };
          })
        );
        
        console.log('Users with counts:', usersWithCounts.length);
        
        // Sort users by follower count (most followers first)
        return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
      } catch (error) {
        console.error('Error fetching users:', error);
        // If there was an error fetching users, show the demo users
        setShowDemoUsers(true);
        return [];
      }
    },
    staleTime: 60000, // 1 minute
    retry: 1, // Don't keep retrying on failure
    refetchOnWindowFocus: false,
  });

  const handleUserClick = (userId: string) => {
    if (showDemoUsers) {
      // For demo users, just show an alert instead of navigating
      toast({
        title: 'Demonstração',
        description: 'Este é um usuário de demonstração. Em uma conta real, você seria redirecionado para o perfil.',
      });
    } else {
      navigate(`/usuario/${userId}`);
    }
  };

  useEffect(() => {
    // This is a debug log to check if users are being loaded
    console.log('Loaded users:', users);
    
    // If no users were found from the database, show demo users
    if (users && users.length === 0) {
      setShowDemoUsers(true);
    } else if (users && users.length > 0) {
      setShowDemoUsers(false);
    }
  }, [users]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p className="text-lg">Carregando usuários...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Comunidade</h1>
          <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-700">
              Ocorreu um erro ao carregar os usuários. Tente novamente mais tarde.
            </p>
          </div>
        </div>
        <UserGrid>
          {demoUsers.map((userProfile) => (
            <UserCard 
              key={userProfile.id} 
              userProfile={userProfile} 
              onClick={handleUserClick} 
            />
          ))}
        </UserGrid>
      </div>
    );
  }

  // Determine which users to display (real or demo)
  const displayUsers = (users && users.length > 0) ? users : (showDemoUsers ? demoUsers : []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-gray-500">Conheça outros candidatos e compartilhe sua jornada</p>
        
        {showDemoUsers && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm">
              <strong>Nota:</strong> Exibindo usuários de demonstração. Estes são exemplos e não refletem contas reais.
            </p>
          </div>
        )}
      </div>
      
      {displayUsers.length > 0 ? (
        <UserGrid>
          {displayUsers.map((userProfile: UserProfile) => (
            <UserCard 
              key={userProfile.id} 
              userProfile={userProfile} 
              onClick={handleUserClick} 
            />
          ))}
        </UserGrid>
      ) : (
        <div className="flex flex-col justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum usuário encontrado.</p>
          <p className="text-sm text-gray-400">Seja o primeiro a se cadastrar!</p>
        </div>
      )}
    </div>
  );
};

export default Comunidade;
