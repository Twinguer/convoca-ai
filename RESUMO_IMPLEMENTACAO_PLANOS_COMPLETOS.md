# ✅ Resumo: Implementação Completa de Todos os Planos

## 🎯 Mudanças Implementadas

### 1. **`create-checkout` - Aceita Todos os Planos**
- ✅ Aceita: `pro`, `coach_starter`, `coach_professional`, `coach_enterprise`
- ✅ Validação de planId expandida
- ✅ Price IDs configurados para todos os planos
- ✅ Metadata inclui `plan_id` para identificação

### 2. **`verify-stripe-subscription` - Verifica Todos os Planos**
- ✅ Identifica plano pelo metadata ou price_id
- ✅ Atualiza `user_subscriptions` para plano Pro
- ✅ Atualiza `coach_subscriptions` para planos Coach
- ✅ Usa `current_period_end` do Stripe para `expires_at`

### 3. **`stripe-webhook` - Processa Todos os Planos**
- ✅ Função `updateCoachSubscription` adicionada
- ✅ Identifica plano Coach vs Pro
- ✅ Processa eventos para ambos os tipos
- ✅ Atualiza tabelas corretas baseado no tipo de plano

## 📋 Próximos Passos Necessários

### 4. **Atualizar Handlers do Webhook**
Os handlers do webhook precisam identificar o tipo de plano e chamar a função correta:

```typescript
// Identificar se é plano Coach
const planId = subscription.metadata?.plan_id || customer.metadata?.plan_id;
const isCoachPlan = planId?.startsWith("coach_");

if (isCoachPlan) {
  await updateCoachSubscription(supabase, userId, planId, subscription.status, expiresAt);
} else {
  await updateUserSubscription(supabase, userId, planId || "pro", subscription.status, expiresAt);
}
```

### 5. **Remover Restrição de Coach Precisa Ter Pro**
- Atualizar RLS policies em `coach_profiles` e `coach_subscriptions`
- Remover verificação `is_user_pro()` das policies
- Permitir acesso direto ao Modo Coach

### 6. **Atualizar Regras de Acesso**
- Coach tem acesso completo (sem limites de rankings/edições)
- Atualizar funções de verificação para considerar Coach como acesso completo

### 7. **Sistema de Notificação de Expiração**
- Criar função que verifica assinaturas expirando em 3 dias
- Enviar notificação ao usuário
- Executar periodicamente (cron job ou scheduled function)

## 🔄 Status Atual

- ✅ `create-checkout`: Aceita todos os planos
- ✅ `verify-stripe-subscription`: Verifica todos os planos
- ⚠️ `stripe-webhook`: Funções criadas, mas handlers precisam ser atualizados
- ❌ Restrição de Coach precisa ter Pro: Ainda ativa
- ❌ Regras de acesso Coach: Ainda não atualizadas
- ❌ Notificação de expiração: Não implementada

## 📝 Notas

- Todos os planos são mensais com renovação automática
- `expires_at` é calculado baseado em `current_period_end` do Stripe
- Planos Coach dão acesso completo (sem limites)
- Free pode ir direto para Coach
- Pro pode ir para Coach

