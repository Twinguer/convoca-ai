import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
        </div>
        
        {/* Search Filter - moved to the right */}
        <div className="relative max-w-md w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Buscar usuários por nome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </div>
 
      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-all duration-300 h-20 flex flex-col justify-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4">
            <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-200 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Total de Membros</CardTitle>
            <UserCircle className="h-5 w-5 text-blue-700 dark:text-blue-300 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
          </CardHeader>
          <CardContent className="pt-0 text-center px-4">
            <div className="text-2xl font-black text-blue-900 dark:text-blue-100 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>{users.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/30 shadow-lg hover:shadow-xl transition-all duration-300 h-20 flex flex-col justify-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4">
            <CardTitle className="text-sm font-semibold text-green-800 dark:text-green-200 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Online Agora</CardTitle>
            <UserCheck className="h-5 w-5 text-green-700 dark:text-green-300 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
          </CardHeader>
          <CardContent className="pt-0 text-center px-4">
            <div className="text-2xl font-black text-green-900 dark:text-green-100 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>
              {users.filter(u => isOnline(u.id)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30 shadow-lg hover:shadow-xl transition-all duration-300 h-20 flex flex-col justify-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4">
            <CardTitle className="text-sm font-semibold text-purple-800 dark:text-purple-200 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Estudando</CardTitle>
            <GraduationCap className="h-5 w-5 text-purple-700 dark:text-purple-300 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
          </CardHeader>
          <CardContent className="pt-0 text-center px-4">
            <div className="text-2xl font-black text-purple-900 dark:text-purple-100 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>
              {users.filter(u => u.is_studying).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/30 shadow-lg hover:shadow-xl transition-all duration-300 h-20 flex flex-col justify-center">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-4">
            <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Com Aprovações</CardTitle>
            <Award className="h-5 w-5 text-amber-700 dark:text-amber-300 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))' }} />
          </CardHeader>
          <CardContent className="pt-0 text-center px-4">
            <div className="text-2xl font-black text-amber-900 dark:text-amber-100 drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)' }}>
              {users.filter(u => u.approvalCount > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>
 
      {/* Members Section */}
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
      <Footer />
    </div>;
};
export default CommunityPage;