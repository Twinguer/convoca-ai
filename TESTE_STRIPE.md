# 🧪 Guia de Teste - Integração Stripe

**Data:** 07 de Janeiro de 2025

---

## ✅ Status da Configuração

- [x] Função `create-checkout` deployada (versão 93)
- [x] Frontend atualizado para usar Stripe
- [x] `STRIPE_SECRET_KEY` configurada no Supabase
- [x] Price ID configurado: `price_1SQtQwRwuherhQlTKYDiUcgF` (R$ 21,90/mês)

---

## 🧪 Como Testar

### 1. Teste via Frontend (Recomendado)

1. **Acesse a aplicação:**
   - Produção: https://www.nomeiai.com.br/planos
   - Desenvolvimento: http://localhost:5173/planos

2. **Faça login** (se necessário)

3. **Clique em "Assinar" no plano Pro**

4. **Resultado esperado:**
   - ✅ Deve redirecionar para o Stripe Checkout
   - ✅ URL deve começar com `https://checkout.stripe.com/`
   - ✅ Deve mostrar o produto "Nomeia-Ai Pro" por R$ 21,90/mês

### 2. Teste via API (cURL)

```bash
# Obter token JWT do Supabase (faça login primeiro)
TOKEN="seu_jwt_token_aqui"

# Chamar a função create-checkout
curl -X POST \
  https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.nomeiai.com.br" \
  -d '{"planId": "pro"}'
```

**Resposta esperada:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

### 3. Verificar Logs

**Via Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/create-checkout/logs
2. Procure por logs que começam com `[create-checkout]`

**Logs esperados:**
- `[create-checkout] User authenticated: {user_id}, email: {email}`
- `[create-checkout] Checkout session created: {session_id} for user {user_id}`

---

## 🔍 Verificações

### ✅ Checklist de Teste

- [ ] Função responde com status 200
- [ ] Retorna `url` e `session_id`
- [ ] URL do Stripe é válida
- [ ] Redirecionamento funciona
- [ ] Checkout do Stripe carrega corretamente
- [ ] Produto e preço estão corretos (R$ 21,90/mês)
- [ ] Após pagamento, redireciona para `/planos?status=success&plan=pro`

---

## 🐛 Troubleshooting

### Erro: "STRIPE_SECRET_KEY não configurado"

**Solução:**
1. Verifique se a chave está configurada no Supabase Dashboard
2. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
3. Verifique se o nome está correto: `STRIPE_SECRET_KEY` (exatamente assim)

### Erro: "Unauthorized" (401)

**Solução:**
- Verifique se está fazendo login antes de testar
- Verifique se o token JWT está sendo enviado no header `Authorization`

### Erro: "Price ID não encontrado"

**Solução:**
- Verifique se o price_id está correto no código: `price_1SQtQwRwuherhQlTKYDiUcgF`
- Verifique se o produto/preço existe no Stripe Dashboard

### Erro: "Origem não autorizada" (403)

**Solução:**
- Verifique se o header `Origin` está sendo enviado
- Verifique se a origem está na lista de permitidas:
  - `https://nomeiai.com.br`
  - `https://www.nomeiai.com.br`
  - `http://localhost:3000`
  - `http://localhost:5173`

---

## 📊 Monitoramento

### Logs Importantes

**Sucesso:**
```
[create-checkout] User authenticated: {user_id}, email: {email}
[create-checkout] Checkout session created: {session_id} for user {user_id}
```

**Erros:**
```
[create-checkout] Auth error: {error}
[create-checkout] STRIPE_SECRET_KEY não configurado
[create-checkout] Unhandled error: {error}
```

---

## 🎯 Próximos Passos Após Teste

1. **Se funcionar:**
   - ✅ Integração completa
   - ⚠️ Configurar webhook do Stripe (opcional, para processar pagamentos automaticamente)

2. **Se não funcionar:**
   - Verificar logs detalhados
   - Verificar configuração do STRIPE_SECRET_KEY
   - Verificar se o price_id está correto

---

**Última atualização:** 07/01/2025

