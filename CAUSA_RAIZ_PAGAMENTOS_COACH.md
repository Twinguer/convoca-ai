# 🔍 Causa Raiz: Pagamentos do Modo Coach Não Passam pelo Stripe

## ❓ Pergunta do Usuário
"O nome do produto pode estar diferente na função ou tem que ser o mesmo?"

## ✅ Resposta Direta
**O nome do produto NÃO precisa ser o mesmo!** O que importa é o **Price ID**.

## 🔑 Como o Stripe Identifica os Planos

### 1. **Price ID é o Identificador Principal**
- O Stripe identifica planos pelo **Price ID** (ex: `price_1SQwLwQOI1Sr9J1AnLYAo0JD`)
- O nome do produto no Stripe Dashboard é apenas para organização
- O código usa o Price ID para criar checkout sessions

### 2. **Metadata é o Backup**
- Se o Price ID não estiver no mapeamento, o código tenta usar `metadata.plan_id`
- O `create-checkout` envia `plan_id` no metadata da subscription
- O `verify-stripe-subscription` e `stripe-webhook` leem esse metadata

## 🔍 Fluxo de Identificação do Plano

### Quando o Checkout é Criado (`create-checkout`):
```typescript
// 1. Frontend envia: planId = "coach_starter"
// 2. Código busca Price ID:
const priceId = STRIPE_PRICES["coach_starter"]; // "price_1SQwLwQOI1Sr9J1AnLYAo0JD"
// 3. Cria checkout com metadata:
subscription_data: {
  metadata: {
    user_id: user.id,
    plan_id: "coach_starter"  // ← Este é o importante!
  }
}
```

### Quando Verifica Assinatura (`verify-stripe-subscription`):
```typescript
// 1. Busca subscription no Stripe
// 2. Tenta ler metadata.plan_id primeiro
let planId = subscription.metadata?.plan_id; // "coach_starter"
// 3. Se não encontrar, usa price_id como fallback
if (!planId) {
  const priceId = subscription.items.data[0]?.price?.id;
  planId = priceToPlan[priceId] || "pro";
}
```

## ⚠️ Possíveis Causas do Problema

### 1. **Metadata Não Está Sendo Passado Corretamente**
- ✅ Verificado: `create-checkout` está passando `subscription_data.metadata`
- ⚠️ Verificar: Se o Stripe está preservando esse metadata

### 2. **Price ID Incorreto ou Inexistente**
- ⚠️ Verificar: Se os Price IDs no código correspondem aos Price IDs reais no Stripe
- ⚠️ Verificar: Se está usando Price IDs de teste vs produção

### 3. **Customer Existente Sem Metadata**
- ⚠️ Se o customer já existe no Stripe, o metadata pode não estar sendo atualizado
- ✅ Código atualiza metadata do customer quando cria novo, mas não atualiza existente

### 4. **Webhook Não Está Processando Corretamente**
- ⚠️ Verificar: Se o webhook está recebendo eventos
- ⚠️ Verificar: Se o webhook está identificando corretamente planos Coach

## 🔧 Correções Necessárias

### 1. **Atualizar Metadata do Customer Existente**
```typescript
// Em create-checkout, quando encontrar customer existente:
if (existingCustomers.data.length > 0) {
  customerId = existingCustomers.data[0].id;
  // ATUALIZAR metadata do customer existente
  await stripe.customers.update(customerId, {
    metadata: {
      user_id: user.id,
      plan_id: requestData.planId,
    },
  });
}
```

### 2. **Adicionar Logs Detalhados**
- Logar o `planId` recebido no frontend
- Logar o `priceId` usado no checkout
- Logar o `metadata` enviado ao Stripe
- Logar o `metadata` recebido na verificação

### 3. **Verificar Price IDs no Stripe Dashboard**
- Confirmar que os Price IDs no código existem no Stripe
- Verificar se está usando modo teste ou produção
- Confirmar que os Price IDs correspondem ao modo da `STRIPE_SECRET_KEY`

## 📋 Checklist de Diagnóstico

- [ ] Verificar logs do `create-checkout` quando clica em "Assinar" no Coach
- [ ] Verificar se o `planId` está sendo enviado corretamente: `coach_starter`, `coach_professional`, `coach_enterprise`
- [ ] Verificar se o `priceId` está correto no código
- [ ] Verificar se o checkout session está sendo criado com sucesso
- [ ] Verificar se o metadata está sendo passado no `subscription_data`
- [ ] Verificar se o `verify-stripe-subscription` está encontrando a subscription
- [ ] Verificar se o `planId` está sendo identificado corretamente (metadata ou price_id)
- [ ] Verificar se o `updateCoachSubscription` está sendo chamado
- [ ] Verificar se as queries estão sendo invalidadas após verificação

## 🎯 Próximos Passos

1. **Adicionar atualização de metadata do customer existente**
2. **Adicionar logs detalhados em todos os pontos críticos**
3. **Testar o fluxo completo e verificar logs**
4. **Verificar se os Price IDs estão corretos no Stripe Dashboard**

