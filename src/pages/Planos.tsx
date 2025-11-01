import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2, Crown, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { paymentService } from "@/services/paymentService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Planos = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    isPro,
    isFree,
    refetch,
    validateDiscountVoucher,
    applyVoucher
  } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscountVoucher, setAppliedDiscountVoucher] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [subscriptionVoucherCode, setSubscriptionVoucherCode] = useState("");
  const [applyingSubscriptionVoucher, setApplyingSubscriptionVoucher] = useState(false);
  useEffect(() => {
    // Tratar retorno do Mercado Pago
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    
    if (status === "approved" && plan) {
      toast({
        title: "Pagamento aprovado!",
        description: `Seu plano foi ativado com sucesso. Bem-vindo ao premium!`
      });
      refetch();
      navigate("/planos", { replace: true });
    } else if (status === "pending" && plan) {
      toast({
        title: "Pagamento pendente",
        description: "Estamos processando seu pagamento. Você receberá uma confirmação em breve.",
        variant: "default"
      });
      refetch();
      navigate("/planos", { replace: true });
    } else if (status === "rejected" && plan) {
      toast({
        title: "Pagamento não aprovado",
        description: "Não foi possível processar seu pagamento. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
      navigate("/planos", { replace: true });
    }
    
    // Suporte legado para Stripe (se ainda existir)
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    
    if (success === "true" && plan) {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Seu plano foi ativado. Bem-vindo ao premium!`
      });
      refetch();
      navigate("/planos", { replace: true });
    } else if (canceled === "true") {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive"
      });
      navigate("/planos", { replace: true });
    }
  }, [searchParams, navigate, refetch]);
  const planos = [{
    id: "free",
    nome: "Gratuito",
    preco: 0,
    descricao: "Para começar seus estudos",
    periodo: "Livre",
    popular: false,
    features: ["Apenas 1 ranking", "Sem acesso a estatísticas", "Sem ciclo de estudos", "Sem edital verticalizado", "Não pode criar rankings", "Máximo de 5 edições por cartão de respostas", "Com propagandas"]
  }, {
    id: "pro",
    nome: "Pro",
    preco: 21.9,
    descricao: "Acesso completo",
    periodo: "Mês",
    popular: true,
    features: ["Participa de até 5 Rankings simultâneos", "Visualização de todos os Rankings", "Estatísticas completas", "Ciclos de estudos", "Editais verticalizados", "Acesso aos perfis da comunidade", "Criação de Rankings", "Edições ilimitadas nos cartões de respostas", "Suporte prioritário", "Sem propaganda"]
  }];
  const handleSubscribe = async (planoId: string) => {
    if (planoId === "free") {
      toast({
        title: "Você já está no plano gratuito",
        description: "Escolha o plano Pro para desbloquear todos os recursos"
      });
      return;
    }

    setLoadingPlan(planoId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Autenticação necessária",
          description: "Por favor, faça login para continuar",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      // Criar preferência de pagamento com voucher de desconto (se aplicado)
      const preference = await paymentService.createPreference(
        planoId,
        session.user.email,
        session.user.user_metadata?.name,
        appliedDiscountVoucher?.code
      );

      // Redirecionar para o checkout do Mercado Pago
      // Prioriza sandbox_init_point se estiver em desenvolvimento/teste
      const checkoutUrl = preference.sandbox_init_point || preference.init_point;
      
      if (!checkoutUrl) {
        throw new Error("URL de checkout não disponível");
      }

      // Redirecionar para o Mercado Pago
      window.location.href = checkoutUrl;

    } catch (error: any) {
      // Log genérico sem expor detalhes técnicos
      console.error("Erro ao processar pagamento");
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
        setVoucherDialogOpen(false); // Fechar modal após aplicar
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

  const handleApplySubscriptionVoucher = async () => {
    if (!subscriptionVoucherCode.trim()) {
      toast({
        title: "Código inválido",
        description: "Digite um código de voucher válido",
        variant: "destructive"
      });
      return;
    }

    setApplyingSubscriptionVoucher(true);
    try {
      const result = await applyVoucher(subscriptionVoucherCode.trim().toUpperCase()) as {
        success?: boolean;
        error?: string;
        plan?: string;
        expires_at?: string;
      };
      
      if (result?.success) {
        toast({
          title: "Voucher aplicado com sucesso!",
          description: `Seu plano ${result.plan === 'pro' ? 'Pro' : 'Free'} foi ativado. Expira em: ${result.expires_at ? new Date(result.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}`
        });
        setSubscriptionVoucherCode("");
        setVoucherDialogOpen(false);
        await refetch();
      } else {
        toast({
          title: "Erro ao aplicar voucher",
          description: result?.error || "Voucher inválido ou já utilizado",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar voucher",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setApplyingSubscriptionVoucher(false);
    }
  };

  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Potencialize seus estudos e alcance a aprovação com o plano Pro
          </p>
          {isPro && <Badge className="mt-4" variant="default">
              <Crown className="w-4 h-4 mr-1" />
              Você tem o plano Pro
            </Badge>}
        </div>

        {/* Plans Section */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {planos.map(plano => <Card key={plano.id} className={`relative flex flex-col ${plano.popular ? "border-primary shadow-lg" : ""}`}>
              {plano.popular && <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  <Star className="w-3 h-3 mr-1" />
                  Recomendado
                </Badge>}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>

                <div className="mt-4">
                  {appliedDiscountVoucher && plano.id === "pro" ? (() => {
                    const discountAmount = appliedDiscountVoucher.discountType === 'percentage'
                      ? (plano.preco * appliedDiscountVoucher.discountValue) / 100
                      : appliedDiscountVoucher.discountValue;
                    const finalPrice = Math.max(0.01, plano.preco - discountAmount);
                    return (
                      <>
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-2xl line-through text-muted-foreground">
                            R$ {plano.preco.toFixed(2).replace(".", ",")}
                          </div>
                          <div className="text-3xl font-bold text-green-600">
                            R$ {finalPrice.toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          {appliedDiscountVoucher.discountType === 'percentage' 
                            ? `${appliedDiscountVoucher.discountValue}% OFF`
                            : `R$ ${appliedDiscountVoucher.discountValue.toFixed(2)} OFF`}
                        </div>
                        <div className="text-sm text-muted-foreground">por {plano.periodo}</div>
                      </>
                    );
                  })() : (
                    <>
                      <div className="text-3xl font-bold">R$ {plano.preco.toFixed(2).replace(".", ",")}</div>
                      <div className="text-sm text-muted-foreground">por {plano.periodo}</div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-2 flex-grow">
                  {plano.features.map((feature, index) => <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>)}
                </ul>

                <Button className="w-full mt-6" variant={plano.popular ? "default" : "outline"} onClick={() => handleSubscribe(plano.id)} disabled={loadingPlan === plano.id || plano.id === "free" && isFree || plano.id === "pro" && isPro}>
                  {loadingPlan === plano.id ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </> : plano.id === "pro" && isPro ? "Plano Atual" : plano.id === "free" && isFree ? "Plano Atual" : "Assinar"}
                </Button>
              </CardContent>
            </Card>)}
        </div>

        {/* Voucher Section - Botão discreto */}
        <div className="max-w-4xl mx-auto mt-6 flex items-center justify-center">
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
                  <span>Inserir um cupom</span>
                  <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Inserir cupom ou voucher</DialogTitle>
                  <DialogDescription>
                    Aplique um cupom de desconto ou um voucher de assinatura gratuita
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="discount" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="discount">Cupom de Desconto</TabsTrigger>
                    <TabsTrigger value="subscription">Voucher de Assinatura</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="discount" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="voucher-code-modal">
                        Código do cupom
                      </Label>
                      <Input
                        id="voucher-code-modal"
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
                        'Aplicar Cupom'
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="subscription" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscription-voucher-code">
                        Código do voucher
                      </Label>
                      <Input
                        id="subscription-voucher-code"
                        value={subscriptionVoucherCode}
                        onChange={(e) => setSubscriptionVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Digite o código"
                        className="font-mono tracking-wider"
                        disabled={applyingSubscriptionVoucher}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleApplySubscriptionVoucher();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleApplySubscriptionVoucher}
                      disabled={applyingSubscriptionVoucher || !subscriptionVoucherCode.trim()}
                      className="w-full"
                    >
                      {applyingSubscriptionVoucher ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Aplicando...
                        </>
                      ) : (
                        'Aplicar Voucher'
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Footer />
    </div>;
};
export default Planos;