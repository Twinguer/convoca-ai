# 🔴 Análise do Erro 500 no Webhook

**Data:** 07 de Janeiro de 2025  
**Método:** MCP Supabase + Análise de Código

---

## 📊 Situação Atual

### Logs Encontrados via MCP

**Último log (mais recente):**
```
POST | 500 | /functions/v1/mp-webhook
Execution time: 137ms
Version: 25
Timestamp: 1762518448723000
```

**Logs anteriores:**
```
POST | 401 | /functions/v1/mp-webhook?id=35286605274&topic=merchant_order
POST | 401 | /functions/v1/mp-webhook?data.id=1325280070&type=payment
```

### Estado do Banco de Dados

- **24 pagamentos pendentes**
- **0 pagamentos processados** (nenhum com `payment_id`)
- **Nenhum pagamento atualizado** (`created_at = updated_at`)
- **Nenhum dado do Mercado Pago armazenado**

---

## 🔍 Análise do Erro 500

### O Que Mudou

**Antes:** Erro 401 (Unauthorized) - função não executava
**Agora:** Erro 500 (Internal Server Error) - função executa mas falha

**Isso significa:**
- ✅ Configuração de autenticação está correta agora
- ✅ Função está sendo executada
- ❌ **Função está falhando internamente**

### Possíveis Causas do Erro 500

#### 1. `MERCADOPAGO_ACCESS_TOKEN` não configurado

**Linha 86-90 do código:**
```typescript
const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

if (!accessToken) {
  throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
}
```

**Se o token não estiver configurado:**
- A função lança um erro
- Isso causa erro 500
- **Solução:** Configurar o secret no Supabase Dashboard

#### 2. `SUPABASE_SERVICE_ROLE_KEY` não disponível

**Linha 65-70 do código:**
```typescript
function createServiceRoleClient(): SupabaseClient | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  // ...
}
```

**Se a chave não estiver disponível:**
- Retorna `null`
- Linha 237-257: retorna erro 500 com detalhes
- **Mas isso deveria gerar logs detalhados**

#### 3. Erro ao buscar pagamento no Mercado Pago

**Linha 85-120:**
- Se a API do Mercado Pago retornar erro
- A função retorna `null` (não lança erro)
- Isso não deveria causar erro 500

#### 4. Erro ao parsear JSON do payload

**Linha 261-273:**
```typescript
try {
  payload = await req.json();
} catch (error) {
  console.error("[mp-webhook] Erro ao parsear JSON:", error);
  return new Response(JSON.stringify({ 
    error: "Bad Request", 
    details: "Payload inválido" 
  }), { status: 400, ... });
}
```

**Se houver erro de parsing:**
- Retorna erro 400 (não 500)
- **Não é a causa do erro 500**

#### 5. Erro não tratado no catch final

**Linha 492-505:**
```typescript
} catch (error) {
  console.error("[mp-webhook] Erro não tratado:", error);
  
  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }),
    { status: 500, ... }
  );
}
```

**Este é o catch final que retorna erro 500**

---

## 🎯 Causa Mais Provável

### `MERCADOPAGO_ACCESS_TOKEN` não configurado

**Evidências:**
1. Erro 500 (Internal Server Error)
2. Nenhum log detalhado aparecendo (função falha antes de gerar logs)
3. Linha 89 lança erro se token não estiver configurado
4. Esse erro é capturado pelo catch final e retorna 500

**Como verificar:**
1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/functions
2. Vá em **Secrets**
3. Verifique se `MERCADOPAGO_ACCESS_TOKEN` está listado
4. Se não estiver, adicione o secret

---

## 🔧 Solução

### Passo 1: Verificar/Configurar `MERCADOPAGO_ACCESS_TOKEN`

**No Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/functions
2. Clique em **Secrets**
3. Verifique se existe `MERCADOPAGO_ACCESS_TOKEN`
4. Se não existir:
   - Clique em **Add new secret**
   - Nome: `MERCADOPAGO_ACCESS_TOKEN`
   - Valor: Seu Access Token do Mercado Pago
   - Clique em **Save**

**Onde obter o token:**
- Acesse: https://www.mercadopago.com.br/developers/panel/app
- Selecione sua aplicação
- Vá em **Credenciais**
- Copie o **Access Token** (teste ou produção)

### Passo 2: Verificar Logs Após Configurar

**Após configurar o secret:**
1. Aguarde alguns minutos
2. Verifique logs novamente no dashboard
3. Deve aparecer logs detalhados começando com `[mp-webhook]`

### Passo 3: Testar Manualmente

**Após configurar, teste:**
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

**O que esperar:**
- Se o token estiver configurado: logs detalhados aparecem
- Se ainda houver erro: logs vão mostrar a causa específica

---

## 📋 Checklist de Verificação

### ✅ Verificações Realizadas via MCP

- [x] Função `mp-webhook` existe e está ACTIVE
- [x] Versão 25 (mais recente)
- [x] `verify_jwt = false` (correto)
- [x] Webhook está sendo chamado
- [x] Função está executando (não é mais 401)
- [x] Erro atual é 500 (erro interno)

### ⚠️ Verificações Necessárias (Manual)

- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado como secret?
- [ ] Logs detalhados aparecem após configurar token?
- [ ] Teste manual funciona após configurar token?

---

## 🚨 Ação Imediata Necessária

**Configurar `MERCADOPAGO_ACCESS_TOKEN` no Supabase:**

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/functions
2. Vá em **Secrets**
3. Adicione ou verifique `MERCADOPAGO_ACCESS_TOKEN`
4. Use o Access Token do Mercado Pago (teste ou produção)

**Após configurar:**
- O erro 500 deve ser resolvido
- Logs detalhados devem aparecer
- Webhook deve começar a processar pagamentos

---

## 📊 Resumo

**Status Atual:**
- ✅ Webhook configurado e sendo chamado
- ✅ Função deployada e executando
- ❌ **Erro 500 - provavelmente `MERCADOPAGO_ACCESS_TOKEN` não configurado**

**Próxima Ação:**
1. **Configurar `MERCADOPAGO_ACCESS_TOKEN` no Supabase Dashboard**
2. Verificar logs novamente
3. Testar manualmente

**Após configurar o token, o webhook deve começar a funcionar corretamente.**

