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
import { AlertCircle, Plus, Users, Clock, CheckCircle, TrendingUp, X, Trash2, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserGroups } from '@/hooks/useGroupMembers';
import { CoachGroupsTab } from '@/components/studyGroups/CoachGroupsTab';
import { useToast } from '@/hooks/use-toast';
import { coachRelationshipService } from '@/integrations/supabase/coach/relationships';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';
import { supabase } from '@/integrations/supabase/client';
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

  // Buscar alunos
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['coach-students', user?.id],
    queryFn: async () => {
      const studentList = await coachRelationshipService.getStudents(user!.id);
      
      // Buscar nomes e fotos dos alunos na tabela users_profiles
      const studentsWithNames = await Promise.all(
        studentList.map(async (student) => {
          const { data: userData } = await supabase
            .from('users_profiles')
            .select('name, email, avatar_url')
            .eq('id', student.student_id)
            .single();
          
          return {
            ...student,
            student_name: userData?.name || userData?.email || 'Aluno #' + student.student_id.slice(0, 8),
            student_email: student.student_email || userData?.email,
            avatar_url: userData?.avatar_url
          };
        })
      );
      
      return studentsWithNames;
    },
    enabled: !!user && !!subscription,
  });

  // Buscar convites pendentes
  const { data: pendingInvitations = [], refetch: refetchInvitations } = useQuery({
    queryKey: ['coach-pending-invitations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_invitations_history')
        .select('*')
        .eq('coach_id', user!.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Mutation para cancelar convite
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await supabase.rpc('cancel_coach_invitation', {
        p_invitation_id: invitationId,
        p_coach_id: user!.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Convite cancelado',
        description: data.message || 'O convite foi cancelado com sucesso',
      });
      refetchInvitations();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar convite',
        description: error.message,
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
      console.log('Confirmado remoção de:', { studentEmail, studentId });
      removeStudentMutation.mutate(studentId);
    } else {
      console.log('Remoção cancelada');
    }
  };

  const { groups: coachGroups } = useUserGroups(user?.id);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">🎯 Coach Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie sua equipe de alunos e acompanhe o progresso de estudos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            Modo Coach
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="alunos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alunos">
            <Users className="mr-2 h-4 w-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="grupos">
            <BookOpen className="mr-2 h-4 w-4" />
            Grupos
            {coachGroups.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {coachGroups.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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

        <Card>
          <CardHeader>
            <CardDescription>Horas Semanais</CardDescription>
            <CardTitle className="text-4xl font-bold">{totalHours}h</CardTitle>
            <TrendingUp className="text-green-600" size={16} />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Ciclos Ativos</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {students.reduce((sum, s) => sum + (s.performance.cycles_active || 0), 0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Taxa de Conclusão</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {Math.round(completionRate * 100)}%
            </CardTitle>
          </CardHeader>
        </Card>
          </div>

          {/* Alertas */}
          {students.filter(s => (s.performance.hours_this_week || 0) === 0).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção: Alunos sem atividade</AlertTitle>
          <AlertDescription>
            {students.filter(s => (s.performance.hours_this_week || 0) === 0).length} aluno(s) não estudaram esta semana
          </AlertDescription>
          </Alert>
          )}

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
                  <div className="flex-1">
                    <p className="font-medium">
                      {invitation.student_email}
                    </p>
                    {invitation.invitation_message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {invitation.invitation_message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado {new Date(invitation.invited_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                    disabled={cancelInvitationMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          )}

          {/* Lista de Alunos */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sua Equipe</CardTitle>
              <CardDescription>
                {students.length} aluno(s) cadastrado(s)
              </CardDescription>
            </div>
            <Button 
              onClick={handleInviteStudent}
              disabled={!subscriptionData?.can_invite}
            >
              <Plus className="mr-2" size={16} />
              Convidar Aluno
            </Button>
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
              <Button onClick={handleInviteStudent}>
                <Plus className="mr-2" size={16} />
                Convidar Primeiro Aluno
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {students.map((student) => (
                <Card key={student.student_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatar_url} alt={student.student_name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                            {getInitials(student.student_name || student.student_email || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {student.student_name || student.student_email || 'Aluno #' + student.student_id.slice(0, 8)}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              <Clock className="inline mr-1" size={14} />
                              {(student.performance.hours_this_week || 0)}h esta semana
                            </span>
                            <span>
                              <CheckCircle className="inline mr-1" size={14} />
                              {(student.performance.tasks_completed || 0)} tarefas
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStudent(student.student_id)}
                        >
                          Ver Detalhes
                        </Button>
                        
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStudent(student.student_id, student.student_email || 'aluno')}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          disabled={removeStudentMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </div>

                    {/* Última atividade */}
                    {student.last_activity && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Última atividade: {new Date(student.last_activity).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
};

export default CoachDashboard;

