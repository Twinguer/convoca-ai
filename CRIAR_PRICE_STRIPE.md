# 🔧 Como Criar o Price no Stripe

## ❌ Problema Identificado

O Price ID `price_1SQtQwRwuherhQlTKYDiUcgF` não existe na conta Stripe, causando o erro:
```
No such price: 'price_1SQtQwRwuherhQlTKYDiUcgF'
```

## ✅ Solução: Criar o Price no Stripe Dashboard

### Passo 1: Acessar o Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/products
2. Faça login na conta "Nomeia Aí"

### Passo 2: Verificar/Criar o Produto

1. Procure pelo produto "Nomeia-Ai Pro" (ID: `prod_TNekH8MskDfHeL`)
2. Se não existir, crie um novo produto:
   - **Nome:** "Nomeia-Ai Pro"
   - **Descrição:** "Acesso premium ao Nomeia Aí"
   - **Tipo:** Serviço

### Passo 3: Criar o Price

1. No produto "Nomeia-Ai Pro", clique em **"Adicionar preço"** ou **"Add price"**
2. Configure o preço:
   - **Preço:** R$ 21,90
   - **Moeda:** BRL (Real brasileiro)
   - **Tipo de cobrança:** Recorrente
   - **Intervalo:** Mensal
   - **Nome do preço:** "Plano Pro Mensal" (opcional)
3. Clique em **"Adicionar preço"** ou **"Add price"**

### Passo 4: Copiar o Price ID

1. Após criar o price, você verá o **Price ID** (começa com `price_`)
2. Copie o Price ID completo (exemplo: `price_1ABC123...`)

### Passo 5: Atualizar o Código

1. Abra o arquivo: `supabase/functions/create-checkout/index.ts`
2. Localize a linha 34:
   ```typescript
   const STRIPE_PRICES = {
     pro: "price_1SQtQwRwuherhQlTKYDiUcgF", // R$ 21,90/mês
   };
   ```
3. Substitua `price_1SQtQwRwuherhQlTKYDiUcgF` pelo novo Price ID que você copiou
4. Salve o arquivo

### Passo 6: Fazer Deploy

```bash
cd /home/rlima/projetos/convoca-ai
npx supabase functions deploy create-checkout
```

Ou via MCP (já que você pediu para fazer via MCP antes).

## 🔍 Verificação

Após criar o price e atualizar o código:

1. Teste novamente no frontend
2. Verifique os logs da função `create-checkout`
3. O erro "No such price" não deve mais aparecer

## 📝 Nota Importante

- **Price IDs de teste** começam com `price_` e são diferentes dos de produção
- Se estiver usando chave de **teste** (`sk_test_`), crie o price no modo **teste**
- Se estiver usando chave de **produção** (`sk_live_`), crie o price no modo **produção**
- Verifique qual chave está configurada em `STRIPE_SECRET_KEY` no Supabase Dashboard

## 🚀 Alternativa: Criar via API

Se preferir criar via código, posso ajudar a criar uma função temporária para criar o price via API do Stripe.

