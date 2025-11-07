import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const CoachSubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Tratar retorno do Stripe
  useEffect(() => {
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    
    if (status === "success" && plan) {
      // Verificar e ativar assinatura imediatamente no Stripe
      const verifyAndActivate = async () => {
        try {
          console.log("[CoachSubscriptionPage] Verificando assinatura Coach no Stripe após pagamento...");
          const result = await paymentService.verifySubscription();
          
          if (result.success) {
            console.log("[CoachSubscriptionPage] Assinatura Coach verificada e ativada com sucesso");
            
            // Invalidar todas as queries relacionadas à assinatura Coach para atualizar o estado
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
            
            toast({
              title: "Pagamento realizado com sucesso!",
              description: `Seu plano Coach foi ativado. Bem-vindo ao Modo Coach!`
            });
            navigate("/coach/dashboard", { replace: true });
          } else {
            console.warn("[CoachSubscriptionPage] Assinatura Coach não encontrada ainda, aguardando webhook...");
            
            // Invalidar queries mesmo se não encontrou ainda (pode ter sido criada pelo webhook)
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
            
            toast({
              title: "Pagamento realizado!",
              description: "Estamos processando sua assinatura Coach. Você receberá acesso em instantes."
            });
            navigate("/coach/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("[CoachSubscriptionPage] Erro ao verificar assinatura Coach:", error);
          
          // Invalidar queries mesmo em caso de erro (webhook pode ter processado)
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
          
          toast({
            title: "Pagamento realizado!",
            description: "Estamos processando sua assinatura Coach. Se o acesso não aparecer em alguns minutos, entre em contato com o suporte."
          });
          navigate("/coach/dashboard", { replace: true });
        }
      };
      
      verifyAndActivate();
    } else if (status === "canceled") {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive"
      });
      navigate("/coach/subscription", { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const handleSubscribe = async (planType: 'starter' | 'professional' | 'enterprise') => {
    if (!user?.id) {
      toast({
        title: "Autenticação necessária",
        description: "Por favor, faça login para continuar",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Mapear planType para planId do Stripe
    const planIdMap: Record<string, string> = {
      'starter': 'coach_starter',
      'professional': 'coach_professional',
      'enterprise': 'coach_enterprise'
    };

    const planId = planIdMap[planType];
    if (!planId) {
      toast({
        title: "Erro",
        description: "Plano inválido",
        variant: "destructive"
      });
      return;
    }

    setLoadingPlan(planType);
    try {
      console.log("[CoachSubscriptionPage] Iniciando checkout Stripe para plano Coach:", planId);
      console.log("[CoachSubscriptionPage] Tipo do planId:", typeof planId);
      console.log("[CoachSubscriptionPage] planId antes de enviar:", JSON.stringify(planId));
      const checkout = await paymentService.createCheckout(planId);

      if (!checkout.url) {
        throw new Error("URL de checkout não disponível");
      }

      console.log("[CoachSubscriptionPage] Redirecionando para Stripe Checkout:", checkout.url.substring(0, 50) + "...");
      window.location.href = checkout.url;

    } catch (error: any) {
      console.error("Erro ao processar pagamento Coach");
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Starter',
      price: 49.90,
      max_students: 5,
      features: [
        'Até 5 alunos',
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
      price: 249.90,
      max_students: 50,
      features: [
        'Até 50 alunos',
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
            className={`flex flex-col ${plan.popular ? 'border-primary border-2 relative' : ''}`}
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
            
            <CardContent className="flex flex-col flex-grow space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Até {plan.max_students} alunos
                </p>
              </div>

              <ul className="space-y-3 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full mt-auto"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.name.toLowerCase() as 'starter' | 'professional' | 'enterprise')}
                disabled={loadingPlan === plan.name.toLowerCase()}
              >
                {loadingPlan === plan.name.toLowerCase() ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Assinar'
                )}
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


