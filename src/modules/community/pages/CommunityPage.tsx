import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Trophy, Star, TrendingUp, UserPlus, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { usePresence } from '@/contexts/PresenceContext';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';
import { UserGrid } from '@/components/community/UserGrid';
import { CommunitySectionHeader } from '@/components/community/CommunitySectionHeader';
import Footer from '@/components/Footer';
import { useSecureUserUrls } from '@/services/userUrlObfuscation';
const CommunityPage = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const { generateSecureUserUrl } = useSecureUserUrls();
  const {
    users,
    isLoading,
    isError,
    refetch
  } = useCommunityUsers();
  const {
    isOnline
  } = usePresence();

  // Sort users to put online users first
  const sortedUsers = useMemo(() => {
    if (!users.length) return users;
    return [...users].sort((a, b) => {
      const aOnline = isOnline(a.id);
      const bOnline = isOnline(b.id);

      // Online users first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // If both have same online status, sort by follower count
      return (b.followerCount || 0) - (a.followerCount || 0);
    });
  }, [users, isOnline]);
  const handleUserClick = async (userId: string) => {
    try {
      const secureUrl = await generateSecureUserUrl(userId, 'profile');
      navigate(secureUrl);
    } catch (error) {
      console.error('Erro ao gerar URL segura de usuário:', error);
      navigate('/comunidade');
    }
  };
  if (isLoading) return <CommunityLoadingState />;
  if (isError) return <CommunityErrorState />;
  return <div className="min-h-screen p-6 bg-page-background">
      

      {/* Community Stats */}
      

      {/* Members Section */}
      <div className="mb-8">
        <CommunitySectionHeader title="👥 Membros da Comunidade" description="Usuários online aparecem no topo" icon={<Users className="h-5 w-5" />} />
        {sortedUsers.length > 0 ? <UserGrid users={sortedUsers} onClick={handleUserClick} /> : <CommunityEmptyState />}
      </div>
      <Footer />
    </div>;
};
export default CommunityPage;