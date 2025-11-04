import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { coachRelationshipService } from '@/integrations/supabase/coach/relationships';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const InviteStudentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [studentEmail, setStudentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Buscar assinatura do coach
  const { data: subscription } = useQuery({
    queryKey: ['coach-subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('coach_subscriptions')
        .select('*')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .single();
      return data;
    },
    enabled: !!user
  });

  const handleInviteStudent = async () => {
    if (!user?.id) return;
    
    if (!studentEmail) {
      toast({
        title: 'Email necessário',
        description: 'Por favor, informe o email do aluno',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Usar a função RPC que cria convite e envia notificação
      const { data, error } = await supabase.rpc('send_coach_invitation', {
        p_coach_id: user.id,
        p_student_email: studentEmail,
        p_invitation_message: message || null
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Convite enviado!',
        description: `${studentEmail} recebeu seu convite por email e notificação`,
      });

      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['coach-students'] });
      queryClient.invalidateQueries({ queryKey: ['coach-can-invite'] });

      // Voltar para dashboard
      navigate('/coach/dashboard');

    } catch (error: any) {
      console.error('Erro ao convidar aluno:', error);
      toast({
        title: 'Erro ao convidar',
        description: error.message || 'Não foi possível convidar o aluno',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/coach/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Convidar Aluno</h1>
          <p className="text-muted-foreground">
            Adicione um aluno à sua equipe para acompanhar seus estudos
          </p>
        </div>
      </div>

      {/* Info sobre assinatura */}
      {subscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seu Plano: {subscription.plan_type}</CardTitle>
            <CardDescription>
              {subscription.current_students} de {subscription.max_students} alunos cadastrados
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Formulário de Convite */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Aluno</CardTitle>
          <CardDescription>
            O aluno precisa estar cadastrado na plataforma Nomeia Aí
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Aluno</Label>
            <Input
              id="email"
              type="email"
              placeholder="aluno@example.com"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              O aluno deve ter uma conta ativa na plataforma
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Olá! Gostaria de te acompanhar na sua preparação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={4}
            />
          </div>

          {/* Alertas de Permissões */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900">O que você terá acesso:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✅ Módulo de estudos (horas, sessões)</li>
              <li>✅ Estatísticas gerais</li>
              <li>✅ Ciclos de estudo ativos</li>
              <li>✅ Progresso nos estudos</li>
            </ul>
            
            <div className="pt-2">
              <h4 className="font-semibold text-red-900">O que você NÃO terá acesso:</h4>
              <ul className="space-y-1 text-sm text-red-800">
                <li>❌ Rankings e respostas</li>
                <li>❌ Dados de provas específicas</li>
                <li>❌ Perfil completo do aluno</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/coach/dashboard')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInviteStudent}
              disabled={isLoading || !studentEmail}
            >
              {isLoading ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Convidar Aluno
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteStudentPage;

