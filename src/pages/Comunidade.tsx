
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';

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
  const { data: users, isLoading } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      // Get all users without filtering
      const { data: profiles, error } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url, bio, email, concursos_aprovados');
        
      if (error) throw error;
      
      // For each user, get their follower count and post count
      const usersWithCounts = await Promise.all(
        profiles.map(async (profile) => {
          // Get follower count
          const { data: followerCount, error: followerError } = await supabase
            .rpc('count_user_followers', { user_id: profile.id });
            
          if (followerError) console.error('Error fetching follower count:', followerError);
          
          // Get post count (currently a placeholder)
          const { data: postCount, error: postError } = await supabase
            .rpc('count_user_posts', { user_id: profile.id });
            
          if (postError) console.error('Error fetching post count:', postError);
          
          // Get approval count (based on concursos_aprovados field if it exists)
          const approvalCount = profile.concursos_aprovados 
            ? profile.concursos_aprovados.split(',').length 
            : 0;
          
          return {
            ...profile,
            followerCount: followerCount || 0,
            postCount: postCount || 0,
            approvalCount: approvalCount
          };
        })
      );
      
      // Sort users by follower count (most followers first)
      return usersWithCounts.sort((a, b) => b.followerCount - a.followerCount);
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg">Carregando usuários...</p>
    </div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comunidade</h1>
      </div>
      
      {users && users.length > 0 ? (
        <UserGrid>
          {users.map((userProfile: UserProfile) => (
            <UserCard key={userProfile.id} userProfile={userProfile} />
          ))}
        </UserGrid>
      ) : (
        <div className="flex flex-col justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
};

export default Comunidade;
