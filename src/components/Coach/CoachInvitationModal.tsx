import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Check, X, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CoachInvitationModalProps {
  invitation: {
    id: string;
    type: string;
    title: string;
    message: string;
    metadata: {
      coach_id: string;
      coach_name: string;
      invitation_id: string;
      action_url: string;
    };
    created_at: string;
  };
  onClose: () => void;
}

const CoachInvitationModal = ({ invitation, onClose }: CoachInvitationModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [consentData, setConsentData] = useState({
    study_data: true,
    statistics: true,
    profile_basic: false
  });

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      // Usar invitation_id do metadata ou ID da notificação como fallback
      const invitationId = invitation.metadata.invitation_id || invitation.id;
      
      console.log('Aceitando convite:', {
        invitation_id: invitationId,
        consent_data: consentData,
        notification_id: invitation.id,
        full_metadata: invitation.metadata
      });

      const { data, error } = await supabase.rpc('accept_coach_invitation', {
        p_invitation_id: invitationId,
        p_consent_data: consentData
      });

      if (error) {
        console.error('Erro ao aceitar convite:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Convite aceito!',
        description: 'Você agora faz parte da equipe do coach',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aceitar convite',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const rejectInvitation = useMutation({
    mutationFn: async () => {
      const invitationId = invitation.metadata.invitation_id || invitation.id;
      
      const { error } = await supabase
        .from('coach_invitations_history')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Convite recusado',
        description: 'Você pode aceitar outro convite depois se quiser',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Convite para Equipe de Estudos
          </DialogTitle>
          <DialogDescription>
            Você foi convidado(a) por <strong>{invitation.metadata.coach_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mensagem do coach */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900">
                <strong>{invitation.metadata.coach_name} diz:</strong> 
                <br />
                {invitation.message}
              </p>
            </CardContent>
          </Card>

          {/* Termos LGPD */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div className="text-sm">
              <strong className="font-semibold text-orange-900">Importante - Lei LGPD:</strong>
              <br />
              Ao aceitar este convite, você autoriza que <strong>{invitation.metadata.coach_name}</strong> 
              {' '}tenha acesso apenas aos seus dados de estudos e estatísticas da plataforma Nomeia Aí.
            </div>
          </Alert>

          {/* O que o coach terá acesso */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-700 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              O que o coach terá acesso:
            </h4>
            <ul className="space-y-2 text-sm ml-7">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Dados de estudos: horas de estudo, sessões realizadas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Ciclos de estudo ativos e concluídos</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Estatísticas gerais de desempenho</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Progresso semanal e mensal</span>
              </li>
            </ul>
          </div>

          {/* O que o coach NÃO terá acesso */}
          <div className="space-y-3">
            <h4 className="font-semibold text-red-700 flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              O que o coach NÃO terá acesso:
            </h4>
            <ul className="space-y-2 text-sm ml-7">
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Seu perfil completo (foto, bio, dados pessoais)</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Rankings e respostas de provas</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Dados de concursos específicos</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>Interações sociais (mensagens, comentários)</span>
              </li>
            </ul>
          </div>

          {/* Checkboxes de consentimento */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Consentimento - Lei LGPD</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="study_data"
                  checked={consentData.study_data}
                  onCheckedChange={(checked) => 
                    setConsentData({ ...consentData, study_data: checked as boolean })
                  }
                  className="mt-1"
                />
                <Label htmlFor="study_data" className="text-sm cursor-pointer">
                  Autorizo o acesso aos meus dados de estudos (horas, sessões, ciclos de estudo)
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="statistics"
                  checked={consentData.statistics}
                  onCheckedChange={(checked) => 
                    setConsentData({ ...consentData, statistics: checked as boolean })
                  }
                  className="mt-1"
                />
                <Label htmlFor="statistics" className="text-sm cursor-pointer">
                  Autorizo o acesso às minhas estatísticas gerais de desempenho
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="profile_basic"
                  checked={consentData.profile_basic}
                  onCheckedChange={(checked) => 
                    setConsentData({ ...consentData, profile_basic: checked as boolean })
                  }
                  className="mt-1"
                />
                <Label htmlFor="profile_basic" className="text-sm cursor-pointer">
                  Autorizo o acesso ao meu nome público (opcional)
                </Label>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-700">
              <p className="font-semibold mb-1">⚠️ Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Você pode revogar este acesso a qualquer momento nas configurações</li>
                <li>Seus dados pessoais privados nunca serão compartilhados</li>
                <li>O coach não terá acesso a rankings, respostas ou dados sensíveis</li>
                <li>Esta autorização é específica para fins educacionais</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => rejectInvitation.mutate()}
            disabled={acceptInvitation.isPending || rejectInvitation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Recusar
          </Button>
          <Button
            onClick={() => acceptInvitation.mutate()}
            disabled={
              acceptInvitation.isPending || 
              rejectInvitation.isPending ||
              !consentData.study_data ||
              !consentData.statistics
            }
          >
            <Check className="mr-2 h-4 w-4" />
            Aceitar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoachInvitationModal;

