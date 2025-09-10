import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';

const Planos = () => {
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/cancel parameters
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const plan = searchParams.get('plan');

    if (success === 'true' && plan) {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Seu plano ${plan} foi ativado. Bem-vindo ao premium!`,
      });
    } else if (canceled === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, [searchParams]);
  const planos = [
    {
      id: 'mensal',
      nome: 'Mensal',
      preco: 34.90,
      descricao: 'Ideal para começar',
      periodo: 'mês',
      popular: false,
      features: [
        'Acesso completo aos rankings',
        'Estatísticas detalhadas',
        'Comunidade',
        'Suporte por email'
      ]
    },
    {
      id: 'trimestral',
      nome: 'Trimestral',
      preco: 299.90,
      precoMensal: 99.97,
      descricao: 'Melhor custo-benefício',
      periodo: '3 meses',
      popular: true,
      features: [
        'Tudo do plano mensal',
        'Desconto de 10%',
        'Acesso prioritário',
        'Relatórios avançados'
      ]
    },
    {
      id: 'semestral',
      nome: 'Semestral',
      preco: 279.90,
      precoMensal: 46.65,
      descricao: 'Para estudos longos',
      periodo: '6 meses',
      popular: false,
      features: [
        'Tudo do plano trimestral',
        'Desconto de 33%',
        'Mentoria mensal',
        'Acesso antecipado'
      ]
    },
    {
      id: 'anual',
      nome: 'Anual',
      preco: 239.90,
      precoMensal: 19.99,
      descricao: 'Máximo desconto',
      periodo: '12 meses',
      popular: false,
      features: [
        'Tudo do plano semestral',
        'Desconto de 43%',
        'Consultoria personalizada',
        'Acesso vitalício a atualizações'
      ]
    }
  ];

  const handleSubscribe = async (planoId: string) => {
    setLoadingPlan(planoId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId: planoId }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in the same tab
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Potencialize seus estudos com nossos planos premium. Tenha acesso a recursos exclusivos
            e acelere sua aprovação.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {planos.map((plano) => (
            <Card 
              key={plano.id} 
              className={`relative ${plano.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plano.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  <Star className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    R$ {plano.preco.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    por {plano.periodo}
                  </div>
                  {plano.precoMensal && (
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {plano.precoMensal.toFixed(2).replace('.', ',')} por mês
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plano.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full mt-6"
                  variant={plano.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plano.id)}
                  disabled={loadingPlan === plano.id}
                >
                  {loadingPlan === plano.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem 7 dias de garantia. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Planos;