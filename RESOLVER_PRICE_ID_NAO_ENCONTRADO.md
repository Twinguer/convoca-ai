# 🔧 Resolver: Price ID não encontrado no Stripe

## ❌ Erro Atual

```
Price ID não encontrado no Stripe. Verifique se o Price ID existe no modo correto (teste ou live). 
Price usado: price_1SQukZQOI1Sr9J1AGjhIjXur
```

## 🎯 Causa

O Price ID `price_1SQukZQOI1Sr9J1AGjhIjXur` não existe no modo que você está usando:
- Se usar chave de **teste** (`sk_test_`), precisa criar o price no modo **TESTE**
- Se usar chave de **produção** (`sk_live_`), precisa criar o price no modo **LIVE**

## ✅ Solução: Criar Price ID no Modo Correto

### Passo 1: Verificar Qual Modo Você Está Usando

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
2. Veja a `STRIPE_SECRET_KEY`:
   - Se começa com `sk_test_` → Você está em modo **TESTE**
   - Se começa com `sk_live_` → Você está em modo **LIVE**

### Passo 2: Acessar o Stripe Dashboard no Modo Correto

**Se estiver usando chave de TESTE:**
1. Acesse: https://dashboard.stripe.com/test/products
2. Certifique-se de que o toggle no canto superior direito está em **"Test mode"**

**Se estiver usando chave de LIVE:**
1. Acesse: https://dashboard.stripe.com/products
2. Certifique-se de que o toggle no canto superior direito está em **"Live mode"**

### Passo 3: Encontrar ou Criar o Produto "Plano Pro"

1. Procure pelo produto **"Plano Pro"** ou **"Nomeia-Ai Pro"**
2. Se não existir, crie um novo produto:
   - **Nome:** "Plano Pro" ou "Nomeia-Ai Pro"
   - **Descrição:** "Acesso premium ao Nomeia Aí"
   - **Tipo:** Serviço

### Passo 4: Criar o Price

1. No produto "Plano Pro", clique em **"Add price"** ou **"Adicionar preço"**
2. Configure:
   - **Preço:** R$ 21,90
   - **Moeda:** BRL (Real brasileiro)
   - **Tipo de cobrança:** Recorrente
   - **Intervalo:** Mensal
   - **Nome do preço:** "Plano Pro Mensal" (opcional)
3. Clique em **"Add price"** ou **"Adicionar preço"**

### Passo 5: Copiar o Novo Price ID

1. Após criar, você verá o **Price ID** (começa com `price_`)
2. **IMPORTANTE:** O Price ID será diferente dependendo do modo:
   - Modo TESTE: `price_1ABC...` (diferente do de produção)
   - Modo LIVE: `price_1XYZ...` (diferente do de teste)
3. Copie o Price ID completo

### Passo 6: Atualizar o Código

Envie-me o novo Price ID e eu atualizo o código, ou você pode atualizar manualmente:

1. Abra: `supabase/functions/create-checkout/index.ts`
2. Localize a linha 34:
   ```typescript
   pro: "price_1SQukZQOI1Sr9J1AGjhIjXur", // R$ 21,90/mês - Plano Pro
   ```
3. Substitua `price_1SQukZQOI1Sr9J1AGjhIjXur` pelo novo Price ID
4. Salve o arquivo

### Passo 7: Fazer Deploy

Após atualizar, faça o deploy da função (ou me avise que atualizou e eu faço via MCP).

## 🔍 Verificação Rápida

### Checklist

- [ ] Verifiquei qual modo está usando (teste ou live)
- [ ] Acessei o Stripe Dashboard no modo correto
- [ ] Criei o produto "Plano Pro" (se não existia)
- [ ] Criei o price de R$ 21,90/mês no modo correto
- [ ] Copiei o novo Price ID
- [ ] Atualizei o código com o novo Price ID
- [ ] Fiz o deploy da função

## ⚠️ Importante

- **Price IDs de teste são diferentes dos de produção**
- O Price ID que você usar deve corresponder ao modo da chave configurada
- Se mudar de teste para produção (ou vice-versa), precisa criar novos Price IDs

## 🚀 Após Resolver

1. Teste novamente a criação de checkout
2. O erro "Price ID não encontrado" não deve mais aparecer
3. A sessão de checkout deve ser criada com sucesso

## 📝 Exemplo

**Cenário:** Você está usando chave de teste (`sk_test_...`)

1. Acesse: https://dashboard.stripe.com/test/products
2. Crie o produto "Plano Pro" (se não existir)
3. Adicione price de R$ 21,90/mês
4. Copie o Price ID (exemplo: `price_1ABC123DEF456...`)
5. Envie-me o Price ID ou atualize o código
6. Faça o deploy

