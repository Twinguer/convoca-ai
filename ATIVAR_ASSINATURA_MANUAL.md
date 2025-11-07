# 🔧 Ativar Assinatura Manualmente (Para Pagamento Já Realizado)

## ⚠️ Situação

Você já fez um pagamento de teste, mas a assinatura não foi ativada porque o webhook ainda não estava configurado.

## ✅ Solução Rápida: Ativar Manualmente

### Opção 1: Via SQL (Recomendado)

Execute esta query no Supabase SQL Editor:

```sql
-- Ativar assinatura Pro para o usuário
INSERT INTO user_subscriptions (user_id, plan, is_active, started_at, expires_at, updated_at)
VALUES (
  '12a8dbca-a222-4711-bbd0-067763c1c84e', -- Seu user_id
  'pro',
  true,
  NOW(),
  NOW() + INTERVAL '1 year', -- 1 ano de validade
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  plan = 'pro',
  is_active = true,
  started_at = COALESCE(user_subscriptions.started_at, NOW()),
  expires_at = NOW() + INTERVAL '1 year',
  updated_at = NOW();
```

### Opção 2: Via MCP

Posso executar essa query via MCP para você. Me avise se quiser que eu faça.

## 🔔 Depois: Configurar Webhook

Após ativar manualmente, configure o webhook para que futuros pagamentos sejam processados automaticamente:

1. Siga o guia: `CONFIGURAR_WEBHOOK_STRIPE.md`
2. Configure o webhook no Stripe Dashboard
3. Configure `STRIPE_WEBHOOK_SECRET` no Supabase

## 🔍 Verificar se Funcionou

Após executar a query, verifique:

```sql
SELECT * FROM user_subscriptions 
WHERE user_id = '12a8dbca-a222-4711-bbd0-067763c1c84e';
```

Você deve ver:
- `plan: 'pro'`
- `is_active: true`
- `expires_at: [data futura]`

