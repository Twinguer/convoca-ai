# 🔍 Diagnóstico: Erro 500 na função create-checkout

## ❌ Problema
A função `create-checkout` está retornando erro 500.

## 🔍 Como Diagnosticar

### 1. Verificar Logs Detalhados no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/create-checkout/logs
2. Procure pelos logs mais recentes com status 500
3. Clique no log para ver os detalhes completos
4. Procure por mensagens que começam com `[create-checkout]`

### 2. Verificar Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. Procure por erros relacionados a `create-checkout`
4. Vá para a aba "Network"
5. Procure pela requisição para `create-checkout`
6. Clique e veja a resposta (Response tab)

### 3. Verificar Configurações

#### A. Verificar STRIPE_SECRET_KEY

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
2. Verifique se `STRIPE_SECRET_KEY` está configurada
3. Verifique se começa com:
   - `sk_test_...` (modo teste) ✅ Recomendado para desenvolvimento
   - `sk_live_...` (modo live) ⚠️ Requer conta verificada

#### B. Verificar Price IDs

Os Price IDs no código devem corresponder ao modo da chave:

- **Se usar `sk_test_`:** Use Price IDs de teste (criados no modo teste)
- **Se usar `sk_live_`:** Use Price IDs de produção (criados no modo live)

Price ID atual no código: `price_1SQukZQOI1Sr9J1AGjhIjXur`

## 🎯 Possíveis Causas e Soluções

### Causa 1: Chave de Live sem conta verificada

**Erro esperado:**
```
Your account cannot currently make live charges.
```

**Solução:**
- Use chave de teste (`sk_test_...`)
- Ou complete a verificação da conta Stripe

### Causa 2: Price ID não existe no modo correto

**Erro esperado:**
```
No such price: 'price_1SQukZQOI1Sr9J1AGjhIjXur'
```

**Solução:**
1. Verifique se está no modo correto no Stripe Dashboard
2. Se usar `sk_test_`, crie o price no modo TESTE
3. Se usar `sk_live_`, crie o price no modo LIVE
4. Atualize o Price ID no código

### Causa 3: Chave Stripe não configurada

**Erro esperado:**
```
Configuração do Stripe não encontrada
```

**Solução:**
1. Configure `STRIPE_SECRET_KEY` no Supabase Dashboard
2. Certifique-se de que a chave está correta

### Causa 4: Chave Stripe inválida

**Erro esperado:**
```
Chave Stripe inválida
```

**Solução:**
- A chave deve começar com `sk_test_` ou `sk_live_`
- Verifique se copiou a chave completa

## 📋 Checklist de Verificação

- [ ] `STRIPE_SECRET_KEY` está configurada no Supabase
- [ ] A chave começa com `sk_test_` ou `sk_live_`
- [ ] Se usar `sk_test_`, o Price ID foi criado no modo TESTE
- [ ] Se usar `sk_live_`, o Price ID foi criado no modo LIVE
- [ ] O Price ID no código corresponde ao modo da chave
- [ ] Verifiquei os logs detalhados no Supabase Dashboard
- [ ] Verifiquei o console do navegador

## 🚀 Próximos Passos

1. **Verifique os logs detalhados** no Supabase Dashboard
2. **Compartilhe a mensagem de erro completa** que aparece nos logs
3. Com base no erro específico, aplicaremos a correção

## 📝 Como Obter a Mensagem de Erro Completa

### Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/create-checkout/logs
2. Procure pelo log mais recente com status 500
3. Clique no log
4. Procure pela seção "Logs" ou "Event Message"
5. Copie a mensagem completa que começa com `[create-checkout]`

### Via Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba "Network"
3. Procure pela requisição `create-checkout`
4. Clique na requisição
5. Vá para a aba "Response"
6. Copie a mensagem de erro completa

## 🔗 Links Úteis

- **Logs da Função:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/create-checkout/logs
- **Secrets do Supabase:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
- **Stripe Dashboard (Teste):** https://dashboard.stripe.com/test/apikeys
- **Stripe Dashboard (Live):** https://dashboard.stripe.com/apikeys

