# 🔍 Diagnóstico via MCP - Logs do Webhook

**Data:** 07 de Janeiro de 2025  
**Método:** MCP Supabase

---

## 📊 Resultados da Verificação

### 1. Logs Encontrados

**Últimos logs da função `mp-webhook`:**

1. **Mais Recente (Erro 500):**
   ```
   POST | 500 | /functions/v1/mp-webhook
   Timestamp: 1762518448723000 (há poucos minutos/horas)
   Execution time: 137ms
   Version: 25
   ```

2. **Anteriores (Erro 401):**
   ```
   POST | 401 | /functions/v1/mp-webhook?id=35286605274&topic=merchant_order
   POST | 401 | /functions/v1/mp-webhook?data.id=1325280070&type=payment
   ```

**Análise:**
- ✅ **Webhook está sendo chamado** pelo Mercado Pago
- ✅ **Função está sendo executada** (não é mais erro 401 de autenticação)
- ❌ **Agora está retornando erro 500** (erro interno)
- ⚠️ **Erro 500 significa que a função está executando mas falhando internamente**

### 2. Status da Função

**Função `mp-webhook`:**
- ✅ **Status:** ACTIVE
- ✅ **Versão:** 25 (última versão)
- ✅ **verify_jwt:** false (correto)
- ✅ **Última atualização:** 1762433201609

**Observação Importante:**
- Existe também uma função `mercadopago-webhook` (versão antiga?)
- Pode estar causando confusão na configuração do webhook

### 3. Estado do Banco de Dados

**Pagamentos:**
- **Total:** 24 preferências
- **Com payment_id:** 0 (nenhum processado)
- **Sem payment_id:** 24 (todos pendentes)
- **Último pagamento criado:** 04/11/2025 12:38:11
- **Último pagamento atualizado:** 04/11/2025 12:38:11

**Observação:**
- `created_at = updated_at` em todos os registros
- Isso confirma que **nenhum pagamento foi atualizado pelo webhook**
- Todos os pagamentos têm `payment_id = null`

---

## 🔴 Problema Identificado

### Erro 500 (Internal Server Error)

**O que significa:**
- A função está sendo executada (não é mais erro 401)
- Mas está falhando internamente
- Possíveis causas:
  1. `SUPABASE_SERVICE_ROLE_KEY` não disponível
  2. `MERCADOPAGO_ACCESS_TOKEN` não configurado
  3. Erro ao buscar pagamento no Mercado Pago
  4. Erro ao atualizar banco de dados
  5. Erro de parsing do payload

**Evidências:**
- Log mais recente mostra erro 500
- Nenhum pagamento foi atualizado
- Função está executando mas falhando

---

## 🔧 Próximas Ações

### 1. Verificar Variáveis de Ambiente

**No Supabase Dashboard:**
- Settings > Edge Functions > Secrets
- Verificar se `MERCADOPAGO_ACCESS_TOKEN` está configurado

**Variáveis automáticas (devem estar disponíveis):**
- `SUPABASE_URL` - automático
- `SUPABASE_SERVICE_ROLE_KEY` - automático

### 2. Verificar Logs Detalhados

**No Supabase Dashboard:**
- Functions > mp-webhook > Logs
- Procurar por logs que começam com `[mp-webhook]`
- Verificar mensagens de erro específicas

### 3. Testar Função Manualmente

**Para gerar logs e ver o erro específico:**

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

**Depois verificar os logs no dashboard para ver a mensagem de erro completa.**

### 4. Verificar Função Duplicada

**Observação:**
- Existe `mp-webhook` (versão 25) ✅
- Existe `mercadopago-webhook` (versão 9) ⚠️

**Ação:**
- Verificar qual URL está configurada no Mercado Pago
- Deve ser: `https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/mp-webhook`
- Não deve ser: `.../mercadopago-webhook`

---

## 📋 Checklist de Diagnóstico

### ✅ Verificações Realizadas

- [x] Função `mp-webhook` existe e está ACTIVE
- [x] Função está na versão 25 (mais recente)
- [x] `verify_jwt = false` está correto
- [x] Webhook está sendo chamado pelo Mercado Pago
- [x] Função está executando (não é mais erro 401)
- [x] Erro atual é 500 (erro interno)

### ⚠️ Verificações Pendentes

- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado como secret?
- [ ] Logs detalhados da função (mensagens de erro específicas)
- [ ] Qual URL está configurada no Mercado Pago?
- [ ] Teste manual da função para ver erro completo

---

## 🎯 Conclusão

**Status Atual:**
- ✅ Webhook está sendo chamado
- ✅ Função está deployada e ativa
- ✅ Configuração básica está correta
- ❌ **Função está retornando erro 500**

**Próximo Passo Crítico:**
1. Verificar logs detalhados no dashboard para ver a mensagem de erro específica
2. Verificar se `MERCADOPAGO_ACCESS_TOKEN` está configurado
3. Testar função manualmente para gerar logs e ver erro completo

**O erro 500 indica que:**
- A função está executando
- Mas está falhando em algum ponto interno
- Os logs detalhados vão mostrar exatamente onde está falhando

