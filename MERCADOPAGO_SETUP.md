# 🚀 Configuração do Mercado Pago - Nomeia Aí

## ✅ Implementação Concluída

A integração com Mercado Pago foi implementada com sucesso! Todos os arquivos foram criados e configurados.

### ✅ Webhook Configurado via MCP

**Application ID:** `4773501385843869`  
**Webhook URL (Sandbox):** `https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/mercadopago-webhook`  
**Status:** ✅ Configurado e ativo

📖 **Veja detalhes completos em:** `MERCADOPAGO_CONFIG_COMPLETA.md`

## 📋 Arquivos Criados/Modificados

### Edge Functions
- ✅ `supabase/functions/create-mercadopago-preference/index.ts` - Cria preferência de pagamento
- ✅ `supabase/functions/mercadopago-webhook/index.ts` - Processa webhooks do Mercado Pago

### Frontend
- ✅ `src/services/paymentService.ts` - Serviço de integração com pagamentos
- ✅ `src/pages/Planos.tsx` - Atualizado para usar Mercado Pago

### Banco de Dados
- ✅ `supabase/migrations/20251031140639_create_payment_preferences.sql` - Tabela de rastreamento

### Correções
- ✅ Removidas todas as referências ao Lovable
- ✅ Domínio atualizado para `nomeiai.com.br`

## 🔧 Configuração Necessária

### 1. Criar Conta no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma conta (se não tiver)
3. Crie uma aplicação no painel de desenvolvedores
4. Copie o **Access Token**:
   - **Teste (Sandbox)**: Para desenvolvimento
   - **Produção**: Para quando estiver em produção

### 2. Configurar Variáveis de Ambiente no Supabase

No dashboard do Supabase:
1. Vá em **Settings** > **Edge Functions** > **Secrets**
2. Adicione as seguintes variáveis:

```
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
```

⚠️ **Importante**: 
- Para desenvolvimento, use o token de **teste (sandbox)**
- Para produção, use o token de **produção**
- Você pode ter ambos configurados e alternar conforme necessário

### 3. Configurar Webhook no Mercado Pago

1. No painel do Mercado Pago, vá em **Webhooks**
2. Configure a URL do webhook:
   ```
   https://[seu-projeto-id].supabase.co/functions/v1/mercadopago-webhook
   ```
3. Selecione os eventos:
   - ✅ `payment`
   - ✅ `merchant_order` (opcional)

### 4. Deploy das Edge Functions

Execute os seguintes comandos:

```bash
# Fazer login no Supabase CLI (se necessário)
supabase login

# Fazer link com o projeto
supabase link --project-ref [seu-project-ref]

# Deploy das funções
supabase functions deploy create-mercadopago-preference
supabase functions deploy mercadopago-webhook
```

### 5. Executar Migração do Banco

```bash
# Aplicar migração localmente (se estiver usando Supabase local)
supabase migration up

# Ou aplique via dashboard do Supabase:
# Database > Migrations > Run migration
```

## 🧪 Testando a Integração

### Modo Sandbox (Teste)

1. Use o **Access Token de teste** nas variáveis de ambiente
2. Acesse `/planos` no seu site
3. Clique em "Assinar" no plano Pro
4. Será redirecionado para o checkout do Mercado Pago
5. Use os cartões de teste do Mercado Pago:
   - **Aprovado**: 5031 4332 1540 6351
   - **CVV**: 123
   - **Data**: Qualquer data futura
   - **Nome**: Qualquer nome

### Modo Produção

1. Use o **Access Token de produção**
2. Configure o webhook para a URL de produção
3. Teste com cartões reais

## 📊 Estrutura de Planos

Os seguintes planos estão configurados:

| ID | Nome | Preço | Duração |
|----|------|-------|---------|
| `pro` | Plano Pro - Mensal | R$ 21,90 | 1 mês |
| `trimestral` | Plano Pro - Trimestral | R$ 59,90 | 3 meses |
| `semestral` | Plano Pro - Semestral | R$ 99,90 | 6 meses |
| `anual` | Plano Pro - Anual | R$ 179,90 | 12 meses |

## 🔄 Fluxo de Pagamento

1. **Usuário clica em "Assinar"** no plano
2. **Frontend** chama `paymentService.createPreference()`
3. **Edge Function** cria preferência no Mercado Pago
4. **Usuário é redirecionado** para checkout do Mercado Pago
5. **Usuário completa o pagamento**
6. **Mercado Pago envia webhook** para `mercadopago-webhook`
7. **Webhook processa** e atualiza assinatura no banco
8. **Usuário é redirecionado** de volta com status

## 🔍 Verificando Status

### Ver Preferências Criadas

```sql
SELECT * FROM payment_preferences 
ORDER BY created_at DESC 
LIMIT 10;
```

### Ver Assinaturas Ativas

```sql
SELECT * FROM user_subscriptions 
WHERE is_active = true 
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Erro: "MERCADOPAGO_ACCESS_TOKEN não configurado"

**Solução**: Verifique se a variável de ambiente foi configurada no Supabase.

### Erro: "Unauthorized origin"

**Solução**: Verifique se o domínio está na lista de `allowedOrigins` nas Edge Functions.

### Webhook não está sendo recebido

**Soluções**:
1. Verifique se a URL do webhook está correta no painel do Mercado Pago
2. Verifique os logs da Edge Function no Supabase
3. Teste manualmente enviando um webhook via `ngrok` ou similar

### Pagamento aprovado mas assinatura não ativada

**Soluções**:
1. Verifique os logs do webhook
2. Verifique se o `external_reference` está no formato correto
3. Execute manualmente a atualização da assinatura se necessário

## 📝 Notas Importantes

- ⚠️ **Nunca exponha o Access Token** no código do frontend
- ✅ Todos os tokens devem estar apenas nas variáveis de ambiente do Supabase
- ✅ O webhook precisa ser acessível publicamente (Supabase Edge Functions já são)
- ✅ Sempre teste em sandbox antes de ir para produção
- ✅ Mantenha logs de todas as transações para auditoria

## 🎉 Próximos Passos

1. ✅ Configurar Access Token no Supabase
2. ✅ Configurar Webhook no Mercado Pago
3. ✅ Deploy das Edge Functions
4. ✅ Executar migração do banco
5. ✅ Testar em sandbox
6. ✅ Testar em produção (quando estiver pronto)

---

**Desenvolvido para Nomeia Aí** 🚀

