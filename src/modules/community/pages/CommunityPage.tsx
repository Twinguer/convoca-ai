import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Users, Trophy, Star, TrendingUp, UserPlus, MessageSquare, Search } from 'lucide-react';
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
  const {
    generateSecureUserUrl
  } = useSecureUserUrls();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    users,
    isLoading,
    isError,
    refetch
  } = useCommunityUsers(searchQuery);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comunidade</h1>
        <p className="text-muted-foreground mb-6">Conecte-se com outros concurseiros</p>
        
        {/* Search Filter */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar usuários por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
 
      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Agora</CardTitle>
            <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => isOnline(u.id)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudando</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_studying).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Aprovações</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.approvalCount > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Members Section */}
      <div className="mb-8">
        <CommunitySectionHeader 
          title="Membros da Comunidade"
          subtitle={`${sortedUsers.length} concurseiros conectados`}
        />
        {sortedUsers.length > 0 ? <UserGrid users={sortedUsers} onClick={handleUserClick} /> : <CommunityEmptyState />}
      </div>
      <Footer />
    </div>;
};
export default CommunityPage;