# 📊 Análise Completa: Planos e Regras de Acesso

## 🎯 Estrutura Atual de Planos

### Planos de ALUNO (`user_subscriptions`)
1. **Free** (Gratuito)
   - Enum: `'free'`
   - Preço: R$ 0,00
   - Limitações:
     - Apenas 1 ranking
     - Sem acesso a estatísticas
     - Sem ciclo de estudos
     - Sem edital verticalizado
     - Não pode criar rankings
     - Máximo de 5 edições por cartão de respostas
     - Com propagandas

2. **Pro** (Aluno Pro)
   - Enum: `'pro'`
   - Preço: R$ 21,90/mês
   - Recursos:
     - Participa de até 5 Rankings simultâneos
     - Visualização de todos os Rankings
     - Estatísticas completas
     - Ciclos de estudos
     - Editais verticalizados
     - Acesso aos perfis da comunidade
     - Criação de Rankings
     - Edições ilimitadas nos cartões de respostas
     - Suporte prioritário
     - Sem propaganda

### Planos de COACH (`coach_subscriptions`)
3. **Starter** (Modo Coach)
   - Tipo: `'starter'`
   - Preço: R$ 49,90/mês
   - Limite: Até 5 alunos
   - Recursos:
     - Acesso completo ao dashboard
     - Estatísticas detalhadas
     - Sistema de tarefas
     - Suporte por email

4. **Professional** (Modo Coach)
   - Tipo: `'professional'`
   - Preço: R$ 149,90/mês
   - Limite: Até 25 alunos
   - Recursos:
     - Acesso completo ao dashboard
     - Estatísticas detalhadas
     - Sistema de tarefas avançado
     - Relatórios semanais
     - Suporte prioritário

5. **Enterprise** (Modo Coach)
   - Tipo: `'enterprise'`
   - Preço: R$ 249,90/mês
   - Limite: Até 50 alunos
   - Recursos:
     - Todos os recursos do Professional
     - API personalizada
     - Suporte dedicado
     - Consultor personalizado

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Enum `subscription_plan` Limitado**
```sql
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');
```
**Problema:** O enum só aceita `'free'` e `'pro'`, mas os planos Coach são gerenciados em uma tabela separada com campo `plan_type` (texto).

**Impacto:** 
- Não há validação de tipo para planos Coach
- Não há enum para garantir consistência
- Planos Coach não aparecem no enum de planos

### 2. **Separação de Tabelas**
- `user_subscriptions` → Planos de aluno (free, pro)
- `coach_subscriptions` → Planos de coach (starter, professional, enterprise)

**Problema:** 
- Duas tabelas diferentes para gerenciar planos
- Lógica de verificação duplicada
- Não há unificação de verificação de acesso

### 3. **Regras de Acesso Inconsistentes**

#### ✅ **Regras Implementadas Corretamente:**

1. **Rankings:**
   - Free: Apenas 1 ranking, não pode criar
   - Pro: Até 5 rankings, pode criar
   - Coach: Não tem acesso direto a rankings (é para alunos)

2. **Grupos de Estudo:**
   - Free: Não pode participar
   - Pro: Pode participar e criar
   - Coach: Pode participar e criar (via `is_user_pro_or_coach()`)

3. **Ciclos de Estudo:**
   - Free: Não pode criar
   - Pro: Pode criar ilimitado
   - Coach: Pode gerenciar ciclos dos alunos

4. **Edições de Cartão de Respostas:**
   - Free: Máximo 5 edições
   - Pro: Ilimitado
   - Coach: Não aplicável (é para alunos)

#### ⚠️ **Regras que Precisam de Clarificação:**

1. **Acesso ao Modo Coach:**
   - **Requisito atual:** Apenas usuários com plano Pro podem acessar Modo Coach
   - **Pergunta:** Um Coach precisa ter plano Pro + plano Coach? Ou apenas plano Coach?
   - **Código atual:** `only_pro_users_can_access_coach_mode` policy

2. **Verificação de Acesso:**
   - Frontend verifica: `isPro` OU `isCoach`
   - Backend verifica: `is_user_pro()` OU `is_user_coach()`
   - **Inconsistência:** Frontend pode permitir acesso que backend bloqueia

3. **Pagamento de Planos Coach:**
   - **Problema:** A função `create-checkout` só aceita `planId: "pro"`
   - **Falta:** Integração para pagar planos Coach via Stripe
   - **Price IDs existem no Stripe:**
     - `coach_starter: "price_1SQwLwQOI1Sr9J1AnLYAo0JD"`
     - `coach_professional: "price_1SQwMqQOI1Sr9J1Aagx6iQoE"`
     - `coach_enterprise: "price_1SQwNTQOI1Sr9J1AOTPomBNh"`

### 4. **Função `verify-stripe-subscription` Limitada**
```typescript
// Atual: Só verifica e ativa plano "pro"
await updateUserSubscription(serviceRoleSupabase, userId, "pro", true);
```
**Problema:** Não verifica planos Coach, apenas planos de aluno.

### 5. **Webhook Stripe Incompleto**
```typescript
// Atual: Só processa planos de aluno
await updateUserSubscription(supabase, userId, planId, subscription.status, ...);
```
**Problema:** Não processa eventos de planos Coach.

## 📋 RECOMENDAÇÕES

### 1. **Clarificar Regras de Acesso ao Modo Coach**

**Opção A:** Coach precisa ter plano Pro + plano Coach
- ✅ Mais seguro
- ✅ Garante que Coach também é aluno Pro
- ❌ Mais caro para o Coach

**Opção B:** Coach só precisa de plano Coach
- ✅ Mais simples
- ✅ Mais barato
- ❌ Coach não teria acesso a recursos Pro

**Recomendação:** Manter Opção A (requer Pro + Coach) para garantir que Coach tenha acesso completo.

### 2. **Expandir `create-checkout` para Planos Coach**

```typescript
// Adicionar suporte para planos Coach
if (requestData.planId.startsWith("coach_")) {
  // Processar pagamento de plano Coach
  // Criar/atualizar coach_subscriptions
}
```

### 3. **Unificar Verificação de Acesso**

Criar função unificada:
```sql
CREATE OR REPLACE FUNCTION get_user_access_level(p_user_id UUID)
RETURNS JSONB AS $$
  -- Retorna: { "is_pro": true, "is_coach": true, "coach_plan": "professional" }
$$;
```

### 4. **Atualizar Webhook para Planos Coach**

```typescript
// Verificar se é plano Coach pelo price_id
if (priceId.startsWith("price_coach_")) {
  // Processar como plano Coach
  await updateCoachSubscription(...);
} else {
  // Processar como plano aluno
  await updateUserSubscription(...);
}
```

### 5. **Documentar Regras de Acesso**

Criar documento claro com:
- Quais recursos cada plano tem acesso
- Como verificar acesso no frontend
- Como verificar acesso no backend
- Exemplos de uso

## ✅ O QUE ESTÁ FUNCIONANDO

1. ✅ Planos Free e Pro funcionam corretamente
2. ✅ Regras de acesso para rankings estão implementadas
3. ✅ Regras de acesso para grupos estão implementadas
4. ✅ Regras de acesso para ciclos estão implementadas
5. ✅ Regras de acesso para edições estão implementadas
6. ✅ Verificação de Coach está implementada
7. ✅ Price IDs do Stripe estão configurados para todos os planos

## ❌ O QUE PRECISA SER CORRIGIDO

1. ❌ `create-checkout` só aceita plano "pro"
2. ❌ `verify-stripe-subscription` só verifica plano "pro"
3. ❌ Webhook não processa planos Coach
4. ❌ Falta documentação clara das regras
5. ❌ Enum `subscription_plan` não inclui planos Coach (mas isso pode ser intencional)

## 🎯 PRÓXIMOS PASSOS

1. **Clarificar com o usuário:**
   - Coach precisa de plano Pro + Coach, ou só Coach?
   - Quais são as regras exatas de acesso para cada plano?

2. **Implementar suporte completo para planos Coach:**
   - Atualizar `create-checkout` para aceitar planos Coach
   - Atualizar `verify-stripe-subscription` para verificar planos Coach
   - Atualizar webhook para processar planos Coach

3. **Criar documentação:**
   - Tabela de recursos por plano
   - Fluxo de verificação de acesso
   - Exemplos de código

