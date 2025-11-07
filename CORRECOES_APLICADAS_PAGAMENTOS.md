# 🔧 Correções Aplicadas no Módulo de Pagamentos

**Data:** 07 de Janeiro de 2025

---

## ✅ Correções Implementadas

### 1. Correção do Nome da Função no config.toml

**Problema:**
- Nome incorreto no `config.toml`: `mercadopago-webhook`
- Nome real da função: `mp-webhook`
- Isso causava problemas de configuração

**Correção:**
```toml
# Antes
[functions.mercadopago-webhook]
verify_jwt = false

# Depois
[functions.mp-webhook]
verify_jwt = false
```

**Também corrigido:**
```toml
# Antes
[functions.create-mercadopago-preference]
verify_jwt = true

# Depois
[functions.create-mp-preference]
verify_jwt = true
```

### 2. Melhorias no Tratamento de Erros

**Problema:**
- Erros eram logados mas não interrompiam o fluxo
- Falhas silenciosas na atualização do banco
- Não havia validação de idempotência

**Correções Aplicadas:**

#### a) Logs Detalhados no Início
```typescript
console.log("[mp-webhook] Webhook chamado:", {
  method: req.method,
  url: req.url,
  hasAuth: !!req.headers.get("authorization"),
  contentType: req.headers.get("content-type")
});
```

#### b) Diagnóstico de Variáveis de Ambiente
```typescript
if (!supabase) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  console.error("[mp-webhook] Falha ao criar cliente Supabase:", {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceRoleKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: serviceRoleKey?.length || 0
  });
  // ...
}
```

#### c) Validação de Atualização do Banco
```typescript
const { data: updatedData, error: updateError } = await supabase
  .from("payment_preferences")
  .update(updateData)
  .eq("external_reference", payment.external_reference)
  .select();

if (updateError) {
  // Retornar erro para que o Mercado Pago tente novamente
  return new Response(
    JSON.stringify({ 
      error: "Database update failed",
      details: updateError.message 
    }),
    { status: 500, ... }
  );
}

if (!updatedData || updatedData.length === 0) {
  // Retornar erro para retry
  return new Response(
    JSON.stringify({ 
      error: "Payment preference not found",
      external_reference: payment.external_reference
    }),
    { status: 404, ... }
  );
}
```

### 3. Validação de Idempotência

**Problema:**
- Mesmo pagamento podia ser processado múltiplas vezes
- Não havia verificação se o pagamento já foi processado

**Correção:**
```typescript
// Verificar se o pagamento já foi processado (idempotência)
const { data: existingPayment } = await supabase
  .from("payment_preferences")
  .select("status, payment_id")
  .eq("external_reference", payment.external_reference)
  .single();

if (existingPayment?.payment_id === paymentId && 
    existingPayment?.status === payment.status) {
  console.log(`[mp-webhook] Pagamento já processado: ${paymentId}`);
  return new Response(
    JSON.stringify({ received: true, message: "Already processed" }),
    { status: 200, ... }
  );
}
```

### 4. Logs Mais Detalhados

**Melhorias:**
- Logs no início da função com informações da requisição
- Logs detalhados de erros com contexto completo
- Logs de sucesso com informações do pagamento processado

---

## 📋 Arquivos Modificados

1. **`supabase/config.toml`**
   - Corrigido nome das funções para corresponder aos nomes reais

2. **`supabase/functions/mp-webhook/index.ts`**
   - Adicionados logs detalhados
   - Melhorado tratamento de erros
   - Adicionada validação de idempotência
   - Melhorada validação de atualização do banco

---

## 🧪 Próximos Passos para Teste

### 1. Fazer Deploy das Correções

```bash
# Fazer login no Supabase CLI
supabase login

# Link com o projeto
supabase link --project-ref ppsymqrdtjyaguftracc

# Deploy da função corrigida
supabase functions deploy mp-webhook
```

### 2. Verificar Variáveis de Ambiente

No Supabase Dashboard:
- Settings > Edge Functions > Secrets
- Verificar se `MERCADOPAGO_ACCESS_TOKEN` está configurado
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurado (deve estar automático)
- Verificar se `SUPABASE_URL` está configurado (deve estar automático)

### 3. Testar Webhook

**Opção 1: Teste Manual via cURL**
```bash
curl -X POST https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/mp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    }
  }'
```

**Opção 2: Usar Painel do Mercado Pago**
- Acessar: https://www.mercadopago.com.br/developers/panel/app
- Ir em Webhooks
- Testar webhook manualmente

### 4. Monitorar Logs

Após o deploy, monitorar os logs:
- Supabase Dashboard > Edge Functions > mp-webhook > Logs
- Procurar por logs que começam com `[mp-webhook]`

---

## 🔍 O Que Esperar Após as Correções

### Comportamento Esperado:

1. **Webhook Recebido:**
   - Log: `[mp-webhook] Webhook chamado: {...}`
   - Log: `[mp-webhook] Webhook recebido: type=payment, id=...`

2. **Pagamento Processado:**
   - Log: `[mp-webhook] Payment preference atualizada: ...`
   - Campo `payment_id` preenchido no banco
   - Campo `status` atualizado
   - Campo `mercado_pago_payment_data` preenchido

3. **Pagamento Aprovado:**
   - Log: `[mp-webhook] Pagamento aprovado processado: userId=..., months=...`
   - Assinatura atualizada na tabela `user_subscriptions`

### Se Ainda Houver Erros:

1. **Erro 500:**
   - Verificar logs detalhados
   - Verificar se variáveis de ambiente estão configuradas
   - Verificar se `SUPABASE_SERVICE_ROLE_KEY` está disponível

2. **Erro 404:**
   - Verificar se `external_reference` está correto
   - Verificar se a preferência existe no banco

3. **Erro 401:**
   - Verificar se `verify_jwt = false` está correto no config.toml
   - Verificar se o deploy foi feito corretamente

---

## 📊 Status das Correções

| Correção | Status | Impacto |
|----------|--------|---------|
| Nome da função no config.toml | ✅ Corrigido | Alto - Resolve problema de configuração |
| Tratamento de erros | ✅ Melhorado | Alto - Erros agora são reportados corretamente |
| Validação de idempotência | ✅ Adicionado | Médio - Previne processamento duplicado |
| Logs detalhados | ✅ Adicionado | Médio - Facilita debug |

---

## ⚠️ Importante

**Antes de fazer deploy:**
1. Verificar se todas as variáveis de ambiente estão configuradas
2. Fazer backup do código atual
3. Testar em ambiente de desenvolvimento primeiro (se possível)

**Após o deploy:**
1. Monitorar logs por pelo menos 24 horas
2. Verificar se novos pagamentos estão sendo processados
3. Considerar sincronizar pagamentos pendentes antigos manualmente

---

## 🔗 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Mercado Pago Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Relatório de Análise](./RELATORIO_ANALISE_PAGAMENTOS.md)

