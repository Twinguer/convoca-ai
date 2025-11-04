# 🚀 Implementação Mercado Pago - Nomeia Aí

## ✅ Implementação Completa e Segura

Esta implementação segue os padrões de mercado e melhores práticas de segurança para integração com Mercado Pago.

## 📋 Arquivos Criados

### Backend (Edge Functions)
1. **`supabase/functions/create-mp-preference/index.ts`**
   - Cria preferência de pagamento no Mercado Pago
   - Validação completa de autenticação e dados
   - Segurança: CORS, sanitização, tratamento de erros

2. **`supabase/functions/mp-webhook/index.ts`**
   - Processa webhooks do Mercado Pago
   - Atualiza status de pagamentos e assinaturas
   - Segurança: Validação de payload, tratamento idempotente

### Frontend
3. **`src/services/paymentService.ts`**
   - Serviço para integração com pagamentos
   - Tratamento robusto de erros
   - Validação e refresh automático de sessão

### Banco de Dados
4. **`supabase/migrations/20250131000000_create_payment_preferences.sql`**
   - Tabela para rastreamento de pagamentos
   - RLS (Row Level Security) completo
   - Índices otimizados

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente no Supabase

No dashboard do Supabase, vá em **Settings** > **Edge Functions** > **Secrets** e adicione:

```
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_de_teste_aqui
```

⚠️ **Importante:**
- Para desenvolvimento: use o **Access Token de teste (sandbox)**
- Para produção: use o **Access Token de produção**
- O token não deve ser exposto no código frontend

### 2. Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Configure a URL:
   ```
   https://[seu-projeto-id].supabase.co/functions/v1/mp-webhook
   ```
5. Selecione os eventos:
   - ✅ `payment`

## 📊 Planos Configurados

| ID | Nome | Preço | Duração |
|----|------|-------|---------|
| `pro` | Plano Pro - Mensal | R$ 21,90 | 1 mês |
| `trimestral` | Plano Pro - Trimestral | R$ 59,90 | 3 meses |
| `semestral` | Plano Pro - Semestral | R$ 99,90 | 6 meses |
| `anual` | Plano Pro - Anual | R$ 179,90 | 12 meses |

## 🔒 Segurança Implementada

### Backend
- ✅ Validação de origem (CORS)
- ✅ Autenticação JWT obrigatória
- ✅ Sanitização de dados de entrada
- ✅ Validação de tipos e constraints
- ✅ Tratamento robusto de erros
- ✅ Logging detalhado (sem expor tokens)
- ✅ RLS no banco de dados
- ✅ Service role para webhooks

### Frontend
- ✅ Validação de sessão antes de chamadas
- ✅ Refresh automático de token
- ✅ Tratamento de erros específicos
- ✅ Mensagens de erro amigáveis

## 🚀 Deploy

### Edge Functions

```bash
# Fazer login no Supabase CLI
supabase login

# Link com o projeto
supabase link --project-ref ppsymqrdtjyaguftracc

# Deploy das funções
supabase functions deploy create-mp-preference
supabase functions deploy mp-webhook
```

### Migração do Banco

A migração será executada automaticamente ou pode ser aplicada manualmente via dashboard:

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/database/migrations
2. Execute a migração: `20250131000000_create_payment_preferences.sql`

## 🧪 Testando

### Modo Sandbox

1. Use o **Access Token de teste** nas variáveis de ambiente
2. Acesse `/planos` no site
3. Clique em "Assinar" no plano Pro
4. Use os cartões de teste do Mercado Pago:
   - **Aprovado**: `5031 4332 1540 6351`
   - **CVV**: `123`
   - **Data**: Qualquer data futura
   - **Nome**: Qualquer nome

### Verificar Logs

- **Edge Functions**: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions
- Procure por logs que começam com `[create-mp-preference]` ou `[mp-webhook]`

## 📝 Fluxo de Pagamento

1. **Usuário clica em "Assinar"** → `Planos.tsx`
2. **Frontend chama** → `paymentService.createPreference()`
3. **Edge Function cria preferência** → `create-mp-preference`
4. **Mercado Pago retorna URL** → Frontend redireciona
5. **Usuário paga no Mercado Pago** → Checkout externo
6. **Mercado Pago envia webhook** → `mp-webhook`
7. **Webhook atualiza assinatura** → Banco de dados
8. **Usuário retorna para o site** → Página de planos
9. **Frontend mostra status** → Toast de confirmação

## 🔍 Troubleshooting

### Erro 401 (Unauthorized)
- Verificar se o token JWT está válido
- Verificar se o usuário está autenticado
- Verificar logs da Edge Function

### Erro ao criar preferência
- Verificar se `MERCADOPAGO_ACCESS_TOKEN` está configurado
- Verificar se o token está válido
- Verificar logs do Mercado Pago

### Webhook não processa pagamento
- Verificar se a URL do webhook está correta
- Verificar logs da função `mp-webhook`
- Verificar se o `external_reference` está correto

## 📚 Recursos Adicionais

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integration-test/test-cards)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0


