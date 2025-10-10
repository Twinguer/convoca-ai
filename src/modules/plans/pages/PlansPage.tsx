import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap, Users, BookOpen, BarChart3, Trophy, CreditCard } from 'lucide-react';
import Footer from '@/components/Footer';

const PlansPage = () => {
  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Perfeito para começar seus estudos',
      badge: null,
      features: [
        'Até 3 rankings por mês',
        'Estatísticas básicas',
        'Timer de estudos',
        'Acesso à comunidade',
        'Cronograma simples'
      ],
      limitations: [
        'Limitado a 3 rankings',
        'Relatórios básicos',
        'Sem backup na nuvem'
      ],
      popular: false,
      buttonText: 'Plano Atual',
      buttonVariant: 'outline' as const
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 29,90',
      period: '/mês',
      description: 'Para candidatos sérios que querem resultados',
      badge: 'Mais Popular',
      features: [
        'Rankings ilimitados',
        'Estatísticas avançadas',
        'Timer com disciplinas personalizadas',
        'Análise de desempenho completa',
        'Cronograma avançado',
        'Backup automático',
        'Suporte prioritário',
        'Relatórios detalhados',
        'Comparação com outros candidatos'
      ],
      limitations: [],
      popular: true,
      buttonText: 'Assinar Premium',
      buttonVariant: 'default' as const
    },
    {
      id: 'pro',
      name: 'Profissional',
      price: 'R$ 49,90',
      period: '/mês',
      description: 'Para quem busca a excelência nos concursos',
      badge: 'Melhor Valor',
      features: [
        'Tudo do Premium',
        'IA para análise de questões',
        'Simulados personalizados',
        'Mentoria individual (1x/mês)',
        'Acesso antecipado a novos recursos',
        'Dashboard executivo',
        'Integração com calendários externos',
        'API para desenvolvedores',
        'Suporte VIP 24/7'
      ],
      limitations: [],
      popular: false,
      buttonText: 'Assinar Pro',
      buttonVariant: 'default' as const
    }
  ];

  const features = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Rankings Personalizados',
      description: 'Crie quantos rankings quiser e compare seu desempenho'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Estatísticas Detalhadas',
      description: 'Acompanhe seu progresso com relatórios completos'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Cronograma Inteligente',
      description: 'Organize seus estudos de forma eficiente'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Comunidade Ativa',
      description: 'Conecte-se com outros concurseiros'
    }
  ];

  const faqs = [
    {
      question: 'Posso cancelar minha assinatura a qualquer momento?',
      answer: 'Sim, você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.'
    },
    {
      question: 'Os dados ficam salvos se eu cancelar?',
      answer: 'Sim, seus dados ficam salvos por até 90 dias após o cancelamento.'
    },
    {
      question: 'Há desconto para pagamento anual?',
      answer: 'Sim, oferecemos 20% de desconto para pagamentos anuais.'
    },
    {
      question: 'Posso mudar de plano depois?',
      answer: 'Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.'
    }
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Escolha o plano ideal para você
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Acelere sua aprovação com as melhores ferramentas para concurseiros. 
          Cancele quando quiser, sem compromisso.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-16">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  {plan.badge}
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                {plan.id === 'free' && <BookOpen className="h-12 w-12 text-muted-foreground" />}
                {plan.id === 'premium' && <Crown className="h-12 w-12 text-primary" />}
                {plan.id === 'pro' && <Zap className="h-12 w-12 text-yellow-500" />}
              </div>
              
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>
              
              <div className="mt-4">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-center text-muted-foreground">
                    <span className="h-5 w-5 mr-3 flex-shrink-0 text-center">×</span>
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.buttonVariant}
                className="w-full"
                size="lg"
                disabled={plan.id === 'free'}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {plan.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Por que escolher o Nomeia Aí?
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas desenvolvidas especificamente para concurseiros
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h2>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-2">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-muted rounded-lg p-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Pronto para acelerar sua aprovação?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Junte-se a milhares de candidatos que já escolheram o Nomeia Aí para 
          organizar seus estudos e alcançar a aprovação.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="px-8">
            <Crown className="h-5 w-5 mr-2" />
            Começar com Premium
          </Button>
          <Button size="lg" variant="outline" className="px-8">
            Continuar Gratuito
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-success mr-1" />
            Sem compromisso
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-success mr-1" />
            Cancele quando quiser
          </div>
          <div className="flex items-center">
            <Check className="h-4 w-4 text-success mr-1" />
            Dados seguros
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlansPage;