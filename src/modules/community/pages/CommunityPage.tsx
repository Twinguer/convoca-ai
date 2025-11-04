import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Star, TrendingUp, UserPlus, MessageSquare, Search, UserCheck, BookOpen, Award, UserCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { usePresence } from '@/contexts/PresenceContext';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';
import { UserGrid } from '@/components/community/UserGrid';
import { CommunitySectionHeader } from '@/components/community/CommunitySectionHeader';
import { useSecureUserUrls } from '@/services/userUrlObfuscation';
import { GroupsTab } from '@/components/studyGroups/GroupsTab';
const CommunityPage = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    generateSecureUserUrl
  } = useSecureUserUrls();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleUsers, setVisibleUsers] = useState(18); // 3 linhas x 6 cards (xl:grid-cols-6)
  const {
    users,
    isLoading,
    isError,
    refetch
  } = useCommunityUsers(searchQuery);
  const {
    isOnline
  } = usePresence();

  // Sort users to put online users first, then by name
  const sortedUsers = useMemo(() => {
    if (!users.length) return users;
    return [...users].sort((a, b) => {
      const aOnline = isOnline(a.id);
      const bOnline = isOnline(b.id);

      // Online users first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // If both have same online status, sort alphabetically by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, isOnline]);

  // Limit visible users to 3 rows
  const displayedUsers = sortedUsers.slice(0, visibleUsers);
  const hasMoreUsers = sortedUsers.length > visibleUsers;

  // Reset visible users when search changes
  useEffect(() => {
    setVisibleUsers(18);
  }, [searchQuery]);

  const loadMoreUsers = () => {
    setVisibleUsers(prev => prev + 18); // Load 3 more rows
  };
  const handleUserClick = async (userId: string) => {
    if (!user) {
      navigate('/auth', { state: { from: '/comunidade' } });
      return;
    }
    
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
  
  return (
    <div className="min-h-screen p-6 bg-page-background">
      <Tabs defaultValue="usuarios" className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          {/* Community Stats - moved to the left */}
          <div className="hidden md:grid grid-cols-4 gap-2" style={{ width: '48%' }}>
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-13 flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-3">
                <CardTitle className="text-sm font-semibold">Total</CardTitle>
                <UserCircle className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-0 text-left px-3">
                <div className="text-xl font-black">{users.length}</div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-13 flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-3">
                <CardTitle className="text-sm font-semibold">Online</CardTitle>
                <UserCheck className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-0 text-left px-3">
                <div className="text-xl font-black">
                  {users.filter(u => isOnline(u.id)).length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-13 flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-3">
                <CardTitle className="text-sm font-semibold">Estudando</CardTitle>
                <GraduationCap className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-0 text-left px-3">
                <div className="text-xl font-black">
                  {users.filter(u => u.is_studying).length}
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 h-13 flex flex-col justify-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-3">
                <CardTitle className="text-sm font-semibold">Aprovados</CardTitle>
                <Award className="h-4 w-4" />
              </CardHeader>
              <CardContent className="pt-0 text-left px-3">
                <div className="text-xl font-black">
                  {users.filter(u => u.approvalCount > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search Filter - moved to the right */}
          <div className="relative max-w-md w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar usuários por nome..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </div>

        {/* Tabs */}
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="grupos">
            <BookOpen className="mr-2 h-4 w-4" />
            Grupos
            <Badge variant="default" className="ml-2">Novo</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Usuários */}
        <TabsContent value="usuarios">
          <div className="mb-8">
            {displayedUsers.length > 0 ? (
              <>
                <UserGrid users={displayedUsers} onClick={handleUserClick} />
                {hasMoreUsers && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={loadMoreUsers}
                      variant="outline"
                      className="px-8 py-2"
                    >
                      Carregar mais usuários
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <CommunityEmptyState />
            )}
          </div>
        </TabsContent>

        {/* Tab Content: Grupos */}
        <TabsContent value="grupos">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default CommunityPage;