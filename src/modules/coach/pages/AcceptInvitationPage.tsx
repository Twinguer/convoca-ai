import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AcceptInvitationPage = () => {
  const navigate = useNavigate();
  const { invitationId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [consentData, setConsentData] = useState({
    study_data: true,
    statistics: true,
    profile_basic: false
  });

  const [isLoading, setIsLoading] = useState(false);

  // Buscar detalhes do convite
  const { data: invitation, isLoading: isLoadingInvitation } = useQuery({
    queryKey: ['coach-invitation', invitationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_invitations_history')
        .select(`
          *,
          coach:users_profiles!coach_invitations_history_coach_id_fkey(id, name, email)
        `)
        .eq('id', invitationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invitationId,
  });

  // Aceitar convite
  const acceptInvitation = async () => {
    if (!user?.id || !invitationId) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('accept_coach_invitation', {
        p_invitation_id: invitationId,
        p_consent_data: consentData
      });

      if (error) throw error;

      toast({
        title: 'Convite aceito!',
        description: 'Você agora faz parte da equipe do coach',
      });

      navigate('/coach/dashboard');
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeitar convite
  const rejectInvitation = async () => {
    if (!invitationId) return;

    setIsLoading(true);

    try {
      // Deletar o convite em vez de apenas atualizar status
      const { error: deleteError } = await supabase
        .from('coach_invitations_history')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      // Remover notificação associada
      const { error: notificationError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'coach_invitation')
        .eq('metadata->>invitation_id', invitationId);

      // Não falhar se não encontrar notificação
      if (notificationError && notificationError.code !== 'PGRST116') {
        // Log mas não falha a operação
      }

      toast({
        title: 'Convite recusado',
        description: 'Você pode aceitar outro convite depois se quiser',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingInvitation) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Carregando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Convite não encontrado</AlertTitle>
          <AlertDescription>
            Este convite não existe ou já foi respondido.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Convite já foi respondido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Você já respondeu a este convite anteriormente.
            </p>
            <Button onClick={() => navigate('/')}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coachName = invitation.coach?.name || 'Coach';

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Convite para Equipe de Estudos</CardTitle>
          <CardDescription>
            Você foi convidado(a) por {coachName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mensagem do coach */}
          {invitation.invitation_message && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{coachName} diz:</strong> {invitation.invitation_message}
              </p>
            </div>
          )}

          {/* O que o coach terá acesso */}
          <div>
            <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              O que {coachName} terá acesso:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Módulo de estudos (horas, sessões, ciclos)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Estatísticas gerais de estudos
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Seu progresso nos estudos
              </li>
            </ul>
          </div>

          {/* O que o coach NÃO terá acesso */}
          <div>
            <h3 className="font-semibold mb-3 text-red-700 flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              O que {coachName} NÃO terá acesso:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                Rankings e respostas de provas
              </li>
              <li className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                Dados de concursos específicos
              </li>
              <li className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-600" />
                Seu perfil completo
              </li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={acceptInvitation}
              disabled={isLoading}
              className="flex-1"
            >
              Aceitar Convite
            </Button>
            <Button
              variant="outline"
              onClick={rejectInvitation}
              disabled={isLoading}
            >
              Recusar
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Você pode sair da equipe a qualquer momento nas configurações
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;


