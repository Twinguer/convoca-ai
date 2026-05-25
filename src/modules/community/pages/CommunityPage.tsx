import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, MessageSquare, Search, UserCheck, BookOpen, UserCircle, GraduationCap } from 'lucide-react';
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
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { useToast } from '@/hooks/use-toast';

const CommunityPage = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    generateSecureUserUrl
  } = useSecureUserUrls();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleUsers, setVisibleUsers] = useState(12); // 2 linhas x 6 cards (lg:grid-cols-6)
  const {
    users,
    isLoading,
    isError,
    refetch
  } = useCommunityUsers(searchQuery);
  const {
    isOnline
  } = usePresence();

  // Sort users by priority: Coach > Pro > Free, then by online status
  const sortedUsers = useMemo(() => {
    if (!users.length) return users;
    return [...users].sort((a, b) => {
      const aOnline = isOnline(a.id);
      const bOnline = isOnline(b.id);
      const aIsCoach = a.isCoach || false;
      const bIsCoach = b.isCoach || false;
      const aIsPro = a.isPro || false;
      const bIsPro = b.isPro || false;

      // Priority order:
      // 1. Coach online
      // 2. Coach offline
      // 3. Pro online
      // 4. Pro offline
      // 5. Free online
      // 6. Free offline

      // Calculate priority score (higher = better position)
      const getPriority = (isCoach: boolean, isPro: boolean, isOnline: boolean) => {
        if (isCoach && isOnline) return 6; // Coach online
        if (isCoach && !isOnline) return 5; // Coach offline
        if (isPro && isOnline) return 4; // Pro online
        if (isPro && !isOnline) return 3; // Pro offline
        if (!isCoach && !isPro && isOnline) return 2; // Free online
        return 1; // Free offline
      };

      const aPriority = getPriority(aIsCoach, aIsPro, aOnline);
      const bPriority = getPriority(bIsCoach, bIsPro, bOnline);

      // Sort by priority (descending)
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // If same priority, sort alphabetically by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, isOnline]);

  // Limit visible users (starts with 2 rows = 12 cards)
  const displayedUsers = sortedUsers.slice(0, visibleUsers);
  const hasMoreUsers = sortedUsers.length > visibleUsers;

  // Reset visible users when search changes
  useEffect(() => {
    setVisibleUsers(12); // Reset to 2 rows (12 cards)
  }, [searchQuery]);

  const loadMoreUsers = () => {
    setVisibleUsers(prev => prev + 12); // Load 1 more page (2 more rows = 12 cards)
  };
  const handleUserClick = async (userId: string) => {
    if (!user) {
      navigate('/auth', { state: { from: '/comunidade' } });
      return;
    }
    
    try {
      const secureUrl = await generateSecureUserUrl(userId, 'profile');
      navigate(secureUrl);
    } catch (error: any) {
      devLog.error('Erro ao gerar URL segura de usuário:', error);
      // Em produção, se variáveis não estiverem configuradas, mostrar erro
      if (import.meta.env.PROD && error?.message?.includes('não configurada')) {
        toast({
          title: 'Erro de configuração',
          description: 'O sistema não está configurado corretamente. Entre em contato com o suporte.',
          variant: 'destructive'
        });
        return;
      }
      // ✅ SEGURANÇA: Nunca usar fallback com UUID direto
      // Em desenvolvimento, redirecionar para comunidade (não expor UUID)
      navigate('/comunidade');
    }
  };
  if (isLoading) return <CommunityLoadingState />;
  if (isError) return <CommunityErrorState />;
  
  return (
    <div className="min-h-screen bg-page-background">
      <div className="page-content-container">
        <Tabs defaultValue="usuarios" className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          {/* Community Stats - moved to the left */}
          <div className="hidden md:grid grid-cols-3 gap-2" style={{ width: '48%' }}>
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
            Concurseiros
          </TabsTrigger>
          <TabsTrigger value="grupos">
            <BookOpen className="mr-2 h-4 w-4" />
            Grupos de Estudos
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
                      Carregar mais
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
    </div>
  );
};
export default CommunityPage;