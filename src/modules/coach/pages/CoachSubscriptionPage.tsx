import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/paymentService';
import { Check, ArrowLeft, Loader2, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';
import { logError, logWarn } from '@/utils/secureLogger';
import { isLaunchProPromoActive, LAUNCH_PROMO_COPY } from '@/config/launchPromo';

const CoachSubscriptionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { validateDiscountVoucher } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscountVoucher, setAppliedDiscountVoucher] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);

  // Buscar assinatura ativa do Coach
  const { data: activeSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['coach-subscription', user?.id],
    queryFn: () => coachSubscriptionService.getCoachSubscription(user!.id),
    enabled: !!user,
  });

  // Buscar assinatura Pro para verificar hierarquia de planos
  const { isPro } = useSubscription();

  // Tratar retorno do Stripe
  useEffect(() => {
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    
    if (status === "success" && plan) {
      // Verificar e ativar assinatura imediatamente no Stripe
      const verifyAndActivate = async () => {
        try {
          const result = await paymentService.verifySubscription();
          
          if (result.success) {
            // Invalidar todas as queries relacionadas à assinatura Coach para atualizar o estado
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['community-users'] });
            
            // Redirecionar para dashboard do Coach
            navigate('/coach/dashboard', { replace: true });
          } else {
            logWarn("Assinatura Coach não encontrada ainda, aguardando webhook", {}, "PAYMENT");
            
            // Invalidar queries mesmo se não encontrou ainda (pode ter sido criada pelo webhook)
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['community-users'] });
            
            // Redirecionar para dashboard do Coach
            navigate('/coach/dashboard', { replace: true });
          }
        } catch (error) {
          logError("Erro ao verificar assinatura Coach", error, "PAYMENT");
          
          // Invalidar queries mesmo em caso de erro (webhook pode ter processado)
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription-menu', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-subscription-landing', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['coach-can-invite', user?.id] });
          await queryClient.invalidateQueries({ queryKey: ['community-users'] });
          
          // Redirecionar para dashboard do Coach mesmo com erro
          navigate('/coach/dashboard', { replace: true });
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
      const checkout = await paymentService.createCheckout(
        planId,
        appliedDiscountVoucher?.code
      );

      if (!checkout.url) {
        throw new Error("URL de checkout não disponível");
      }

      window.location.href = checkout.url;

    } catch (error: any) {
      logError("Erro ao processar pagamento Coach", error, "PAYMENT");
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleValidateDiscountVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Código inválido",
        description: "Digite um código de cupom válido",
        variant: "destructive"
      });
      return;
    }

    setValidatingVoucher(true);
    try {
      const result = await validateDiscountVoucher(voucherCode) as {
        valid?: boolean;
        discount_type?: 'percentage' | 'fixed';
        discount_value?: number;
        error?: string;
      };
      
      if (result?.valid) {
        setAppliedDiscountVoucher({
          code: voucherCode.trim().toUpperCase(),
          discountType: result.discount_type || 'percentage',
          discountValue: parseFloat(result.discount_value?.toString() || '0')
        });
        
        const discountText = result.discount_type === 'percentage' 
          ? `${result.discount_value}%`
          : `R$ ${result.discount_value?.toFixed(2)}`;
        
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de ${discountText} será aplicado no pagamento`
        });
        setVoucherCode("");
        setVoucherDialogOpen(false);
      } else {
        toast({
          title: "Cupom inválido",
          description: result?.error || "Cupom de desconto inválido ou expirado",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao validar cupom",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setValidatingVoucher(false);
    }
  };

  const plans = [
    {
      name: 'Coach Inicial',
      price: 49.90,
      max_students: 5,
      features: [
        'Até 5 alunos',
        'Acesso a todos os rankings',
        'Pode criar rankings',
        'Sem limite de edição da cartão',
        'Visualização de todos os Rankings',
        'Criação de grupos de estudos',
        'Estatísticas detalhadas',
        'Criação de cliclos para seus alunos',
        'Sistema de tarefas para seus alunos',
        'Verticaliza edital para seus alunos',
        'Estatísticas dos alunos',
        'Sem propaganda'
      ]
    },
    {
      name: 'Coach Intermediário',
      price: 89.90,
      max_students: 10,
      popular: true,
      features: [
        'Até 10 alunos',
        'Acesso a todos os rankings',
        'Pode criar rankings',
        'Sem limite de edição da cartão',
        'Visualização de todos os Rankings',
        'Criação de grupos de estudos',
        'Estatísticas detalhadas',
        'Criação de cliclos para seus alunos',
        'Sistema de tarefas para seus alunos',
        'Verticaliza edital para seus alunos',
        'Estatísticas dos alunos',
        'Sem propaganda'
      ]
    },
    {
      name: 'Coach Avançado',
      price: 149.90,
      max_students: 25,
      features: [
        'Até 25 alunos',
        'Acesso a todos os rankings',
        'Pode criar rankings',
        'Sem limite de edição da cartão',
        'Visualização de todos os Rankings',
        'Criação de grupos de estudos',
        'Estatísticas detalhadas',
        'Criação de cliclos para seus alunos',
        'Sistema de tarefas para seus alunos',
        'Verticaliza edital para seus alunos',
        'Estatísticas dos alunos',
        'Sem propaganda'
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
          {isLaunchProPromoActive() && (
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              {LAUNCH_PROMO_COPY.coachNote}{' '}
              Preparadores podem solicitar acesso beta via{' '}
              <a href="mailto:contato@nomeiai.com.br" className="text-primary underline-offset-4 hover:underline">
                contato@nomeiai.com.br
              </a>
              .
            </p>
          )}
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
                {appliedDiscountVoucher ? (() => {
                  const discountAmount = appliedDiscountVoucher.discountType === 'percentage'
                    ? (plan.price * appliedDiscountVoucher.discountValue) / 100
                    : appliedDiscountVoucher.discountValue;
                  const finalPrice = Math.max(0.01, plan.price - discountAmount);
                  return (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-2xl line-through text-muted-foreground">
                          R$ {plan.price.toFixed(2)}
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                          R$ {finalPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-1">
                        {appliedDiscountVoucher.discountType === 'percentage' 
                          ? `${appliedDiscountVoucher.discountValue}% OFF`
                          : `R$ ${appliedDiscountVoucher.discountValue.toFixed(2)} OFF`}
                      </div>
                      <div className="text-sm text-muted-foreground">/mês</div>
                    </>
                  );
                })() : (
                  <>
                    <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </>
                )}
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

              {(() => {
                // Hierarquia de planos: free (0) < pro (1) < coach_starter (2) < coach_professional (3) < coach_enterprise (4)
                const planLevels: Record<string, number> = {
                  'free': 0,
                  'pro': 1,
                  'coach_starter': 2,
                  'coach_professional': 3,
                  'coach_enterprise': 4
                };

                const planTypeMap: Record<string, 'starter' | 'professional' | 'enterprise'> = {
                  'Coach Inicial': 'starter',
                  'Coach Intermediário': 'professional',
                  'Coach Avançado': 'enterprise'
                };
                const planType = planTypeMap[plan.name];
                const planId = `coach_${planType}`;
                const currentPlanLevel = planLevels[planId] || 0;

                // Determinar nível máximo do plano ativo
                let maxActiveLevel = 0;
                
                // Verificar Pro
                if (isPro) {
                  maxActiveLevel = Math.max(maxActiveLevel, planLevels['pro']);
                }
                
                // Verificar Coach
                if (activeSubscription?.status === 'active' && 
                    (!activeSubscription?.expires_at || new Date(activeSubscription.expires_at) > new Date())) {
                  const activeCoachPlanId = `coach_${activeSubscription.plan_type}`;
                  maxActiveLevel = Math.max(maxActiveLevel, planLevels[activeCoachPlanId] || 0);
                }

                const isCurrentPlan = activeSubscription?.plan_type === planType 
                  && activeSubscription?.status === 'active'
                  && (!activeSubscription?.expires_at || new Date(activeSubscription.expires_at) > new Date());
                
                const shouldDisable = currentPlanLevel <= maxActiveLevel;
                const isLoading = loadingPlan === planType;
                
                return (
                  <Button 
                    className="w-full mt-auto"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(planType)}
                    disabled={isLoading || shouldDisable}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Seu plano atual'
                    ) : shouldDisable ? (
                      'Plano Atual'
                    ) : (
                      'Assinar'
                    )}
                  </Button>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voucher Section */}
      <div className="max-w-5xl mx-auto mt-6 flex items-center justify-center">
        {appliedDiscountVoucher ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span>
              Cupom {appliedDiscountVoucher.code} aplicado ({appliedDiscountVoucher.discountType === 'percentage' 
                ? `${appliedDiscountVoucher.discountValue}% OFF`
                : `R$ ${appliedDiscountVoucher.discountValue.toFixed(2)} OFF`})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              onClick={() => setAppliedDiscountVoucher(null)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
            <DialogTrigger asChild>
              <button 
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 group"
              >
                <span>Inserir um cupom de desconto</span>
                <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Inserir cupom de desconto</DialogTitle>
                <DialogDescription>
                  Aplique um cupom de desconto no seu plano Modo Coach
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher-code-coach">
                    Código do cupom
                  </Label>
                  <Input
                    id="voucher-code-coach"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código"
                    className="font-mono tracking-wider"
                    disabled={validatingVoucher}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleValidateDiscountVoucher();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleValidateDiscountVoucher}
                  disabled={validatingVoucher || !voucherCode.trim()}
                  className="w-full"
                >
                  {validatingVoucher ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    'Aplicar cupom'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
              Os alunos pagam o plano Pro da plataforma (R$ 14,90/mês) e você pode cobrar valores 
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


