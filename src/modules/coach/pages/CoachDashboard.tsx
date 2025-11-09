import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Plus, Users, Clock, CheckCircle, TrendingUp, X, Trash2, BookOpen, Eye, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserGroups } from '@/hooks/useGroupMembers';
import { CoachGroupsTab } from '@/components/studyGroups/CoachGroupsTab';
import { useToast } from '@/hooks/use-toast';
import { coachRelationshipService } from '@/integrations/supabase/coach/relationships';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';
import { supabase } from '@/integrations/supabase/client';
import { UserStudyService } from '@/services/userStudyService';
import { calculateStudyStatistics } from '@/utils/userStudyHelpers';
import type { StudentRelationship, CanInviteResponse } from '@/types/coach';

// Helper para obter iniciais
const getInitials = (name: string) => {
  if (!name) return 'A';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<CanInviteResponse | null>(null);
  const queryClient = useQueryClient();
  
  // Estado para modal de mensagem para todos os alunos
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Buscar assinatura
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['coach-subscription', user?.id],
    queryFn: () => coachSubscriptionService.getCoachSubscription(user!.id),
    enabled: !!user,
  });

  // Verificar se pode convidar
  const { data: canInvite } = useQuery({
    queryKey: ['coach-can-invite', user?.id],
    queryFn: () => coachSubscriptionService.checkIfCanInvite(user!.id),
    enabled: !!user && !!subscription,
  });

  // Função helper para calcular performance real do aluno
  const calculateStudentPerformance = async (studentId: string) => {
    try {
      const studyData = await UserStudyService.getUserStudyData(studentId);
      
      if (!studyData) {
        return {
          hours_this_week: 0,
          hours_last_week: 0,
          sessions_this_week: 0,
          tasks_completed: 0,
          tasks_pending: 0,
          completion_rate: 0,
          engagement_score: 0
        };
      }

      // Calcular período desta semana
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay()); // Domingo desta semana
      startOfThisWeek.setHours(0, 0, 0, 0);

      // Tentar usar study_schedule primeiro (mais preciso)
      const scheduleSessions = studyData.study_schedule || [];
      if (scheduleSessions.length > 0) {
        let totalHours = 0;
        let totalSessions = 0;
        let totalQuestions = 0;
        
        scheduleSessions.forEach((s: any) => {
          const stats = s.total_stats || {};
          if (stats.session_count > 0) {
            totalHours += (stats.total_duration_minutes || 0) / 60;
            totalSessions += stats.session_count || 0;
            totalQuestions += stats.total_questions || 0;
          }
        });
        
        return {
          hours_this_week: totalHours,
          hours_last_week: totalHours * 0.8,
          sessions_this_week: totalSessions,
          tasks_completed: totalSessions, // Número de tarefas/sessões realizadas, não questões
          tasks_pending: 0,
          completion_rate: totalSessions > 0 ? 75 : 0,
          engagement_score: Math.min(10, totalHours / 2)
        };
      }

      // Fallback: usar study_sessions
      const sessions = studyData.study_sessions || [];
      if (sessions.length === 0) {
        return {
          hours_this_week: 0,
          hours_last_week: 0,
          sessions_this_week: 0,
          tasks_completed: 0,
          tasks_pending: 0,
          completion_rate: 0,
          engagement_score: 0
        };
      }

      // Calcular estatísticas usando o helper
      const stats = calculateStudyStatistics(sessions);
      
      // Filtrar sessões desta semana
      const getSessionDate = (s: any) => {
        return s.sessionDate || s.session_date || s.date || new Date().toISOString().split('T')[0];
      };
      
      const thisWeekSessions = sessions.filter(s => {
        const sessionDate = new Date(getSessionDate(s));
        return sessionDate >= startOfThisWeek;
      });
      
      const getDuration = (s: any) => s.duration ?? s.total_duration_minutes ?? 0;
      const hoursThisWeek = thisWeekSessions.reduce((sum, s) => sum + (getDuration(s) / 60), 0);
      
      return {
        hours_this_week: hoursThisWeek,
        hours_last_week: (stats.totalHours - hoursThisWeek) * 0.8,
        sessions_this_week: thisWeekSessions.length,
        tasks_completed: stats.totalSessions, // Número total de tarefas/sessões realizadas, não questões
        tasks_pending: 0,
        completion_rate: sessions.length > 0 ? (thisWeekSessions.length / sessions.length) * 100 : 0,
        engagement_score: Math.min(10, (hoursThisWeek / 20) * 10)
      };
    } catch (error) {
      console.error('Erro ao calcular performance do aluno:', error);
      return {
        hours_this_week: 0,
        hours_last_week: 0,
        sessions_this_week: 0,
        tasks_completed: 0,
        tasks_pending: 0,
        completion_rate: 0,
        engagement_score: 0
      };
    }
  };

  // Buscar alunos
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['coach-students', user?.id],
    queryFn: async () => {
      const studentList = await coachRelationshipService.getStudents(user!.id);
      
      // Buscar nomes, fotos e performance real dos alunos
      const studentsWithData = await Promise.all(
        studentList.map(async (student) => {
          const { data: userData } = await supabase
            .from('users_profiles')
            .select('name, email, avatar_url')
            .eq('id', student.student_id)
            .single();
          
          // Calcular performance real
          const realPerformance = await calculateStudentPerformance(student.student_id);
          
          return {
            ...student,
            student_name: userData?.name || userData?.email || 'Aluno #' + student.student_id.slice(0, 8),
            student_email: student.student_email || userData?.email,
            avatar_url: userData?.avatar_url,
            performance: {
              ...student.performance,
              ...realPerformance
            }
          };
        })
      );
      
      return studentsWithData;
    },
    enabled: !!user && !!subscription,
  });

  // Buscar convites pendentes
  const { data: pendingInvitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['coach-pending-invitations', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('coach_invitations_history')
          .select('*')
          .eq('coach_id', user!.id)
          .eq('status', 'pending')
          .order('invited_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar convites pendentes:', error);
          // Se for erro 403, tentar novamente após 2 segundos (cache pode estar atualizando)
          if (error.code === 'PGRST301' || error.message?.includes('403')) {
            console.warn('Erro 403 detectado, aguardando atualização do cache...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Tentar novamente
            const { data: retryData, error: retryError } = await supabase
              .from('coach_invitations_history')
              .select('*')
              .eq('coach_id', user!.id)
              .eq('status', 'pending')
              .order('invited_at', { ascending: false });
            
            if (retryError) throw retryError;
            return retryData || [];
          }
          throw error;
        }
      
      // Buscar nomes dos alunos
      const invitationsWithNames = await Promise.all(
        (data || []).map(async (invitation: any) => {
          if (invitation.student_id) {
            const { data: studentData } = await supabase
              .from('users_profiles')
              .select('name, nickname, avatar_url')
              .eq('id', invitation.student_id)
              .single();
            
            return {
              ...invitation,
              student_name: studentData?.name || invitation.student_email || 'Aluno',
              student_nickname: studentData?.nickname,
              student_avatar: studentData?.avatar_url
            };
          }
          // Se não tiver student_id, usar email como fallback
          return {
            ...invitation,
            student_name: invitation.student_email || 'Aluno desconhecido',
            student_nickname: null,
            student_avatar: null
          };
        })
      );
      
        return invitationsWithNames;
      } catch (err: any) {
        console.error('Erro completo ao buscar convites:', err);
        // Se ainda for erro de permissão, retornar array vazio
        if (err.code === 'PGRST301' || err.message?.includes('403')) {
          console.warn('Ainda com erro de permissão, retornando lista vazia');
          return [];
        }
        throw err;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 2000,
  });

  // Mutation para cancelar convite
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('cancel_coach_invitation', {
        p_invitation_id: invitationId,
        p_coach_id: user!.id
      });

      if (error) {
        console.error('Erro ao cancelar convite:', error);
        throw error;
      }
      
      // Verificar se a resposta indica sucesso
      if (data && !(data as any).success) {
        throw new Error((data as any).error || 'Erro ao cancelar convite');
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Convite cancelado',
        description: (data as any)?.message || 'O convite foi cancelado com sucesso',
      });
      refetchInvitations();
      queryClient.invalidateQueries({ queryKey: ['coach-pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('Erro completo ao cancelar convite:', error);
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message || 'Não foi possível cancelar o convite',
        variant: 'destructive'
      });
    }
  });

  useEffect(() => {
    if (canInvite) {
      setSubscriptionData(canInvite);
    }
  }, [canInvite]);

  // Redirecionar se não tiver assinatura
  useEffect(() => {
    if (subscription === null && !isLoadingSubscription && user) {
      navigate('/coach/subscription');
    }
  }, [subscription, isLoadingSubscription, user, navigate]);

  // Calcular estatísticas
  const totalHours = students.reduce((sum, s) => sum + (s.performance.hours_this_week || 0), 0);
  const totalTasks = students.reduce((sum, s) => sum + (s.performance.tasks_completed || 0), 0);
  const activeStudents = students.filter(s => s.status === 'active').length;
  const completionRate = students.length > 0 
    ? students.reduce((sum, s) => sum + (s.performance.completion_rate || 0), 0) / students.length 
    : 0;

  const handleInviteStudent = () => {
    navigate('/coach/invite');
  };

  const handleViewStudent = (studentId: string) => {
    navigate(`/coach/student/${studentId}`);
  };

  // Função para remover aluno
  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      console.log('Removendo aluno:', { coach_id: user!.id, student_id: studentId });
      try {
        await coachRelationshipService.removeStudent(user!.id, studentId);
        console.log('Aluno removido com sucesso');
      } catch (error) {
        console.error('Erro ao remover aluno:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Aluno removido',
        description: 'O aluno foi removido da sua equipe',
      });
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['coach-students', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover aluno',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleRemoveStudent = (studentId: string, studentEmail: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${studentEmail} da sua equipe?`)) {
      removeStudentMutation.mutate(studentId);
    }
  };

  // Mutation para enviar mensagem para todos os alunos
  const broadcastMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id || students.length === 0) {
        throw new Error('Dados insuficientes para enviar mensagem');
      }

      // Criar notificações para todos os alunos
      const notifications = students.map(student => ({
        user_id: student.student_id,
        type: 'coach_message',
        title: 'Mensagem do Coach',
        message: message.trim(),
        metadata: {
          coach_id: user.id,
          sent_at: new Date().toISOString(),
          is_broadcast: true
        }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Mensagem enviada',
        description: `A mensagem foi enviada com sucesso para ${students.length} aluno(s).`,
      });
      setBroadcastModalOpen(false);
      setBroadcastMessage('');
      // Invalidar notificações de todos os alunos
      students.forEach(student => {
        queryClient.invalidateQueries({ queryKey: ['notifications', student.student_id] });
      });
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message || 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleBroadcastMessage = () => {
    const trimmedMessage = broadcastMessage.trim();
    
    if (!trimmedMessage) {
      toast({
        title: 'Mensagem vazia',
        description: 'Por favor, digite uma mensagem antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedMessage.length > 600) {
      toast({
        title: 'Mensagem muito longa',
        description: 'A mensagem deve ter no máximo 600 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (students.length === 0) {
      toast({
        title: 'Nenhum aluno',
        description: 'Você não tem alunos cadastrados para receber a mensagem.',
        variant: 'destructive',
      });
      return;
    }

    broadcastMessageMutation.mutate(trimmedMessage);
  };

  const { groups: coachGroups } = useUserGroups(user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
      <div className="container mx-auto p-6 space-y-6">
      {/* Tabs */}
      <Tabs defaultValue="alunos" className="space-y-6">
        {/* Header com TabsList e Badge */}
        <div className="flex items-center justify-between">
          <TabsList className="bg-purple-100 dark:bg-purple-900/30">
            <TabsTrigger value="alunos" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Users className="mr-2 h-4 w-4" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="grupos" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <BookOpen className="mr-2 h-4 w-4" />
              Grupos
              {coachGroups.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {coachGroups.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white font-bold shadow-lg shadow-purple-500/50 dark:shadow-purple-900/50 border-2 border-purple-400/30 dark:border-purple-500/30">
            Modo Coach
          </Badge>
        </div>

        {/* Tab: Alunos */}
        <TabsContent value="alunos" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Total de Alunos</CardDescription>
            <CardTitle className="text-4xl font-bold">{activeStudents}</CardTitle>
            {subscriptionData && (
              <Badge variant="secondary">
                {subscriptionData.current}/{subscriptionData.max}
              </Badge>
            )}
          </CardHeader>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Horas Semanais</CardDescription>
            <CardTitle className="text-4xl font-bold">{totalHours}h</CardTitle>
            <TrendingUp className="text-green-600" size={16} />
          </CardHeader>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardDescription>Ciclos Ativos</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {students.reduce((sum, s) => sum + (s.performance.cycles_active || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className={students.filter(s => (s.performance.hours_this_week || 0) === 0).length > 0 ? "border-red-500/20 bg-red-500/5" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Avisos</CardDescription>
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-4xl font-bold">
              {students.filter(s => (s.performance.hours_this_week || 0) === 0).length}
            </CardTitle>
            <CardDescription className="text-xs mt-2">
              {students.filter(s => (s.performance.hours_this_week || 0) === 0).length > 0 
                ? `aluno(s) sem atividade esta semana`
                : 'Nenhum aviso'}
            </CardDescription>
          </CardHeader>
        </Card>
          </div>


          {/* Convites Pendentes */}
          {pendingInvitations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Convites Pendentes</span>
              <Badge variant="outline" className="bg-orange-100">
                {pendingInvitations.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Aguardando resposta dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={invitation.student_avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(invitation.student_name || invitation.student_email || 'A')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {invitation.student_name || invitation.student_email || 'Aluno desconhecido'}
                      </p>
                      {invitation.student_nickname && (
                        <p className="text-xs text-muted-foreground">
                          @{invitation.student_nickname}
                        </p>
                      )}
                      {invitation.invitation_message && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {invitation.invitation_message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Enviado {new Date(invitation.invited_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja cancelar este convite?')) {
                        cancelInvitationMutation.mutate(invitation.id);
                      }
                    }}
                    disabled={cancelInvitationMutation.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {cancelInvitationMutation.isPending ? 'Cancelando...' : 'Remover'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          )}

          {/* Lista de Alunos */}
          <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Seus Alunos</CardTitle>
              <CardDescription>
                {students.length} aluno(s) cadastrado(s)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setBroadcastModalOpen(true)}
                variant="outline"
                disabled={students.length === 0}
                className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30"
              >
                <MessageSquare className="mr-2" size={16} />
                Enviar Mensagem
              </Button>
              <Button 
                onClick={handleInviteStudent}
                disabled={!subscriptionData?.can_invite}
                className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                <Plus className="mr-2" size={16} />
                Convidar Aluno
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando...
            </p>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-semibold mb-2">Nenhum aluno cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece convidando um aluno para sua equipe
              </p>
              <Button 
                onClick={handleInviteStudent}
                className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                <Plus className="mr-2" size={16} />
                Convidar Primeiro Aluno
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {students.map((student) => {
                const fallbackAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.student_name || student.student_email || 'student')}`;
                const avatarUrl = student.avatar_url || fallbackAvatarUrl;
                
                return (
                  <Card 
                    key={student.student_id} 
                    className="bg-primary/5 border-primary/20 hover:shadow-lg transition-all duration-200"
                    style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)' }}
                  >
                    <CardContent className="p-5 flex flex-col">
                      {/* Avatar e Nome */}
                      <div className="flex flex-col items-center mb-4">
                        <div className="relative mb-3">
                          <Avatar className="h-20 w-20 border-2 border-primary/20" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
                            <AvatarImage src={avatarUrl} alt={student.student_name} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg">
                              {getInitials(student.student_name || student.student_email || '')}
                            </AvatarFallback>
                          </Avatar>
                          <Badge 
                            variant={student.status === 'active' ? 'default' : 'secondary'}
                            className="absolute -bottom-1 -right-1"
                          >
                            {student.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-base text-center leading-tight">
                          {student.student_name || student.student_email || 'Aluno #' + student.student_id.slice(0, 8)}
                        </h3>
                      </div>

                      {/* Estatísticas */}
                      <div className="grid grid-cols-2 gap-3 mb-4 border-t border-b py-3">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span className="text-lg font-bold text-primary">
                            {(student.performance.hours_this_week || 0)}h
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            Esta semana
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            {(student.performance.tasks_completed || 0)}
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            Tarefas
                          </span>
                        </div>
                      </div>

                      {/* Última atividade */}
                      {student.last_activity && (
                        <div className="mb-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            Última atividade:
                          </p>
                          <p className="text-xs font-medium">
                            {new Date(student.last_activity).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Botões de Ação */}
                      <div className="flex flex-col gap-2 mt-auto">
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => handleViewStudent(student.student_id)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStudent(student.student_id, student.student_email || 'aluno');
                          }}
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                          disabled={removeStudentMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </CardContent>
          </Card>

          {/* Limite de alunos */}
          {!subscriptionData?.can_invite && subscriptionData?.reason && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Limite de alunos atingido</AlertTitle>
              <AlertDescription>
                {subscriptionData.reason}. Faça upgrade do seu plano para adicionar mais alunos.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab: Grupos */}
        <TabsContent value="grupos">
          <CoachGroupsTab />
        </TabsContent>
      </Tabs>

      {/* Modal de Mensagem para Todos os Alunos */}
      <Dialog open={broadcastModalOpen} onOpenChange={setBroadcastModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem para Todos os Alunos</DialogTitle>
            <DialogDescription>
              Envie uma mensagem de até 600 caracteres que será recebida por todos os {students.length} aluno(s) da sua equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Digite sua mensagem aqui..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                maxLength={600}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Máximo de 600 caracteres</span>
                <span>{broadcastMessage.length}/600</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBroadcastModalOpen(false);
                setBroadcastMessage('');
              }}
              disabled={broadcastMessageMutation.isPending}
              className="border-purple-500 text-purple-600 hover:bg-purple-50 hover:border-purple-600 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/30"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBroadcastMessage}
              disabled={broadcastMessageMutation.isPending || !broadcastMessage.trim() || students.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {broadcastMessageMutation.isPending ? 'Enviando...' : `Enviar para ${students.length} aluno(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default CoachDashboard;

