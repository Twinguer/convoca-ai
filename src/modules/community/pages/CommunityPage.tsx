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

const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { users, isLoading, isError, refetch } = useCommunityUsers();
  const { isOnline } = usePresence();

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

  const handleUserClick = (userId: string) => {
    navigate(`/usuario/${userId}`);
  };

  if (isLoading) return <CommunityLoadingState />;
  if (isError) return <CommunityErrorState />;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comunidade ConvocAI</h1>
        <p className="text-muted-foreground">
          Conecte-se com outros concurseiros, compartilhe experiências e acompanhe o desempenho da comunidade
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.postCount > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              Com pontuação registrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((sum, user) => sum + (user.postCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de rankings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Membros</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return true; // Simplified for now
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Última semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Section */}
      <div className="mb-8">
        <CommunitySectionHeader
          title="👥 Membros da Comunidade"
          description="Usuários online aparecem no topo"
          icon={<Users className="h-5 w-5" />}
        />
        {sortedUsers.length > 0 ? (
          <UserGrid users={sortedUsers} onClick={handleUserClick} />
        ) : (
          <CommunityEmptyState />
        )}
      </div>
    </div>
  );
};

export default CommunityPage;