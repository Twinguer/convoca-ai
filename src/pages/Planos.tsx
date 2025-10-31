import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Loader2, Crown, Sparkles, Target, TrendingUp, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { paymentService } from "@/services/paymentService";
const Planos = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    subscription,
    isPro,
    isFree,
    applyVoucher,
    refetch
  } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  useEffect(() => {
    // Check for Mercado Pago payment status
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    
    if (status === "approved" && plan) {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Seu plano ${plan} foi ativado. Bem-vindo ao premium!`
      });
      // Recarregar assinatura
      refetch();
      // Limpar parâmetros da URL
      navigate("/planos", { replace: true });
    } else if (status === "pending" && plan) {
      toast({
        title: "Pagamento pendente",
        description: "Estamos processando seu pagamento. Você será notificado quando for aprovado."
      });
      navigate("/planos", { replace: true });
    } else if (status === "rejected" && plan) {
      toast({
        title: "Pagamento rejeitado",
        description: "Não foi possível processar seu pagamento. Tente novamente.",
        variant: "destructive"
      });
      navigate("/planos", { replace: true });
    }
    
    // Suporte legado para parâmetros antigos (Stripe)
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "true" && plan) {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: `Seu plano ${plan} foi ativado. Bem-vindo ao premium!`
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
    features: ["Apenas 1 ranking", "Sem acesso a estatísticas", "Sem ciclo de estudos", "Sem edital verticalizado", "Não pode criar rankings", "Com propagandas"]
  }, {
    id: "pro",
    nome: "Pro",
    preco: 21.9,
    descricao: "Acesso completo",
    periodo: "Mês",
    popular: true,
    features: ["5 Rankings", "Estatísticas completas", "Ciclos de estudos", "Editais verticalizados", "Acesso aos perfis da comunidade", "Criação de Rankings", "Suporte prioritário", "Sem propaganda"]
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

      // Criar preferência de pagamento
      const preference = await paymentService.createPreference(
        planoId,
        session.user.email,
        session.user.user_metadata?.name
      );

      // Redirecionar para o checkout do Mercado Pago
      // Usa sandbox_init_point se estiver em desenvolvimento
      const checkoutUrl = preference.sandbox_init_point || preference.init_point;
      window.location.href = checkoutUrl;

    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoadingPlan(null);
    }
  };
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast({
        title: "Código inválido",
        description: "Digite um código de voucher válido",
        variant: "destructive"
      });
      return;
    }
    setApplyingVoucher(true);
    try {
      const result = await applyVoucher(voucherCode) as {
        success?: boolean;
        plan?: string;
        expires_at?: string;
        error?: string;
      };
      
      if (result?.success) {
        toast({
          title: "Voucher aplicado!",
          description: result.plan && result.expires_at 
            ? `Plano ${result.plan} ativado até ${new Date(result.expires_at).toLocaleDateString()}`
            : "Voucher aplicado com sucesso!"
        });
        setVoucherCode("");
        navigate("/");
      } else {
        toast({
          title: "Erro",
          description: result?.error || "Voucher inválido",
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
      setApplyingVoucher(false);
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

        {/* Features Section */}

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
                  <div className="text-3xl font-bold">R$ {plano.preco.toFixed(2).replace(".", ",")}</div>
                  <div className="text-sm text-muted-foreground">por {plano.periodo}</div>
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

        {/* Voucher Section */}
        

        <div className="text-center mt-12"></div>
      </div>
      <Footer />
    </div>;
};
export default Planos;