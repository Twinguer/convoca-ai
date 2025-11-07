# 🔔 Configurar Webhook do Stripe

## ✅ Status

A função `stripe-webhook` foi criada e deployada! Agora você precisa configurar o webhook no Stripe Dashboard.

## 📋 Passo a Passo

### 1. Obter URL do Webhook

A URL do webhook é:
```
https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/stripe-webhook
```

### 2. Configurar no Stripe Dashboard

#### A. Acessar Webhooks

1. Acesse: https://dashboard.stripe.com/test/webhooks (modo teste)
   - Ou: https://dashboard.stripe.com/webhooks (modo live)
2. Clique em **"Add endpoint"** ou **"Adicionar endpoint"**

#### B. Configurar Endpoint

1. **Endpoint URL:**
   ```
   https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/stripe-webhook
   ```

2. **Events to send (Eventos para enviar):**
   Selecione os seguintes eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

3. Clique em **"Add endpoint"** ou **"Adicionar endpoint"**

#### C. Copiar Webhook Secret

1. Após criar o endpoint, você verá o **"Signing secret"**
2. Copie o secret (começa com `whsec_...`)
3. **IMPORTANTE:** Você só verá o secret uma vez! Copie agora.

### 3. Configurar no Supabase

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
2. Adicione a variável:
   - **Nome:** `STRIPE_WEBHOOK_SECRET`
   - **Valor:** Cole o secret que você copiou (começa com `whsec_...`)
   - **Tipo:** Secret
3. Salve

### 4. Testar o Webhook

#### A. Enviar Evento de Teste

1. No Stripe Dashboard, vá para o webhook que você criou
2. Clique em **"Send test webhook"** ou **"Enviar webhook de teste"**
3. Selecione o evento: `checkout.session.completed`
4. Clique em **"Send test webhook"**

#### B. Verificar Logs

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/stripe-webhook/logs
2. Você deve ver logs do webhook sendo processado
3. Procure por: `[stripe-webhook] Evento recebido`

### 5. Testar Pagamento Completo

1. Faça um pagamento de teste no frontend
2. Complete o checkout no Stripe
3. Verifique se a assinatura foi ativada:
   - No Stripe Dashboard: https://dashboard.stripe.com/test/subscriptions
   - No banco de dados: Verifique a tabela `user_subscriptions`

## 🔍 Verificar se Está Funcionando

### Via Banco de Dados

Execute esta query no Supabase:

```sql
SELECT * FROM user_subscriptions 
WHERE user_id = '12a8dbca-a222-4711-bbd0-067763c1c84e';
```

Você deve ver:
- `plan: 'pro'`
- `is_active: true`
- `expires_at: [data futura]`

### Via Logs

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/stripe-webhook/logs
2. Procure por logs que mostram:
   - `[stripe-webhook] Evento recebido: checkout.session.completed`
   - `[stripe-webhook] Assinatura ativada para userId: ...`

## ⚠️ Importante

### Modo Teste vs Produção

- **Modo Teste:** Configure webhook em: https://dashboard.stripe.com/test/webhooks
- **Modo Produção:** Configure webhook em: https://dashboard.stripe.com/webhooks

### Webhook Secrets Diferentes

- Cada modo (teste/live) tem seu próprio webhook secret
- Configure `STRIPE_WEBHOOK_SECRET` correspondente ao modo que você está usando

## 🎯 Eventos Processados

A função processa os seguintes eventos:

1. **`checkout.session.completed`** → Ativa assinatura quando checkout é concluído
2. **`customer.subscription.created`** → Ativa assinatura quando criada
3. **`customer.subscription.updated`** → Atualiza status da assinatura
4. **`customer.subscription.deleted`** → Cancela assinatura
5. **`invoice.payment_succeeded`** → Renova assinatura quando pagamento é bem-sucedido
6. **`invoice.payment_failed`** → Registra falha (não cancela imediatamente)

## 🔗 Links Úteis

- **Webhooks (Teste):** https://dashboard.stripe.com/test/webhooks
- **Webhooks (Live):** https://dashboard.stripe.com/webhooks
- **Secrets do Supabase:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
- **Logs do Webhook:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/stripe-webhook/logs

## ✅ Checklist

- [ ] Função `stripe-webhook` criada e deployada
- [ ] Webhook configurado no Stripe Dashboard
- [ ] Eventos selecionados corretamente
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] Webhook testado com evento de teste
- [ ] Pagamento de teste realizado
- [ ] Assinatura ativada no banco de dados
- [ ] Usuário tem acesso aos recursos Pro

