import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';
import { Check, ArrowLeft } from 'lucide-react';

const CoachSubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const createSubscription = useMutation({
    mutationFn: async (planType: 'starter' | 'professional' | 'enterprise') => {
      return await coachSubscriptionService.createCoachSubscription(user!.id, planType);
    },
    onSuccess: (data) => {
      toast({
        title: 'Assinatura criada!',
        description: `Você agora tem ${data.max_students} vagas disponíveis`,
      });
      navigate('/coach/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const plans = [
    {
      name: 'Starter',
      price: 49.90,
      max_students: 3,
      features: [
        'Até 3 alunos',
        'Acesso completo ao dashboard',
        'Estatísticas detalhadas',
        'Sistema de tarefas',
        'Suporte por email'
      ]
    },
    {
      name: 'Professional',
      price: 149.90,
      max_students: 25,
      popular: true,
      features: [
        'Até 25 alunos',
        'Acesso completo ao dashboard',
        'Estatísticas detalhadas',
        'Sistema de tarefas avançado',
        'Relatórios semanais',
        'Suporte prioritário'
      ]
    },
    {
      name: 'Enterprise',
      price: 399.90,
      max_students: 100,
      features: [
        'Até 100 alunos',
        'Todos os recursos do Professional',
        'API personalizada',
        'Suporte dedicado',
        'Consultor personalizado'
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/coach/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Escolha seu Plano</h1>
          <p className="text-muted-foreground mt-2">
            Selecione o plano ideal para sua equipe de alunos
          </p>
        </div>
      </div>

      {/* Planos */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={plan.popular ? 'border-primary border-2 relative' : ''}
          >
            {plan.popular && (
              <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                Mais Popular
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Até {plan.max_students} alunos
                </p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => createSubscription.mutate(plan.name.toLowerCase() as any)}
                disabled={createSubscription.isPending}
              >
                {createSubscription.isPending ? 'Processando...' : 'Começar agora'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Como funciona o Modo Coach?</h4>
            <p className="text-sm text-muted-foreground">
              Você convida alunos para sua equipe e acompanha seus estudos, estatísticas e progresso. 
              Os alunos pagam o plano Pro da plataforma (R$ 21,90/mês) e você pode cobrar valores 
              adicionais fora da plataforma.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Que dados você pode ver?</h4>
            <p className="text-sm text-muted-foreground">
              Você terá acesso ao módulo de estudos (horas, sessões, ciclos) e estatísticas gerais. 
              Não terá acesso a rankings, respostas de provas ou dados sensíveis.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Posso trocar de plano depois?</h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas 
              imediatamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachSubscriptionPage;


