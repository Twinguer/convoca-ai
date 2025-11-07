# 🔍 Diagnóstico: Erro 400 ao Criar Checkout Coach

## ❌ Problema
As requisições para assinatura do Modo Coach retornam **400 Bad Request** e não chegam no Stripe**.

## 📋 Fluxo Correto Esperado

### 1. Frontend (`CoachSubscriptionPage.tsx`)
```typescript
handleSubscribe('professional') 
  → mapeia para 'coach_professional'
  → paymentService.createCheckout('coach_professional')
```

### 2. Payment Service (`paymentService.ts`)
```typescript
paymentService.createCheckout('coach_professional')
  → supabase.functions.invoke('create-checkout', { body: { planId: 'coach_professional' } })
```

### 3. Edge Function (`create-checkout/index.ts`)
```typescript
// Recebe: { planId: 'coach_professional' }
// Valida: planId está em ["pro", "coach_starter", "coach_professional", "coach_enterprise"]
// Busca: STRIPE_PRICES['coach_professional'] = "price_1SQwMqQOI1Sr9J1Aagx6iQoE"
// Cria: Stripe Checkout Session
// Retorna: { url: "https://checkout.stripe.com/...", session_id: "..." }
```

## 🔍 Possíveis Causas do Erro 400

### 1. **Body Não Está Sendo Enviado Corretamente**
- Verificar se `supabase.functions.invoke` está enviando o body corretamente
- Verificar se o body está sendo parseado corretamente na função

### 2. **planId Não Está no Formato Correto**
- Verificar se está enviando `coach_professional` e não `professional`
- Verificar se há espaços ou caracteres especiais

### 3. **Validação Está Falhando**
- Verificar se `validPlanIds.includes(requestData.planId)` está retornando false
- Verificar se há diferença entre o que é enviado e o que é esperado

### 4. **Função Não Foi Deployada com Últimas Alterações**
- A função pode estar rodando uma versão antiga sem suporte aos planos Coach

## 🔧 Verificações Necessárias

### 1. Verificar Logs da Função
Os logs devem mostrar:
```
[create-checkout] Body recebido: {"planId":"coach_professional"}
[create-checkout] planId validado: coach_professional
[create-checkout] Validando planId: coach_professional contra: pro, coach_starter, coach_professional, coach_enterprise
```

### 2. Verificar Código da Função
- ✅ `validPlanIds` inclui os planos Coach
- ✅ `STRIPE_PRICES` tem os Price IDs corretos
- ✅ Logs estão sendo gerados

### 3. Verificar Frontend
- ✅ `planIdMap` está mapeando corretamente
- ✅ `paymentService.createCheckout()` está sendo chamado com o planId correto

## 🚀 Solução

### Passo 1: Verificar Logs Detalhados
Adicionar mais logs no frontend para ver exatamente o que está sendo enviado:

```typescript
console.log("[CoachSubscriptionPage] planId antes de enviar:", planId);
console.log("[CoachSubscriptionPage] Tipo do planId:", typeof planId);
```

### Passo 2: Verificar Resposta do Erro
O `handleApiError` pode estar mascarando o erro real. Verificar a resposta completa:

```typescript
if (error) {
  console.error("[paymentService] Erro completo:", JSON.stringify(error, null, 2));
  throw handleApiError(error);
}
```

### Passo 3: Fazer Deploy da Função Atualizada
Garantir que a função está com a versão mais recente que suporta planos Coach.

## 📝 Checklist de Diagnóstico

- [ ] Verificar logs do `create-checkout` quando clica em "Assinar"
- [ ] Verificar se o body está sendo enviado corretamente
- [ ] Verificar se o planId está no formato correto (`coach_professional` e não `professional`)
- [ ] Verificar se a função foi deployada com suporte aos planos Coach
- [ ] Verificar se há algum erro de CORS ou autenticação antes do erro 400
- [ ] Verificar se o `STRIPE_SECRET_KEY` está configurado
- [ ] Verificar se os Price IDs estão corretos no código

## 🎯 Próximos Passos

1. **Adicionar logs mais detalhados no frontend** para ver exatamente o que está sendo enviado
2. **Verificar a resposta completa do erro 400** para ver a mensagem de erro específica
3. **Fazer deploy da função atualizada** garantindo que suporta planos Coach
4. **Testar com um plano Pro** para verificar se o problema é específico dos planos Coach

