# 🔍 Como Obter os Price IDs do Stripe

## 📋 Produtos Identificados

Você me forneceu os **Product IDs**, mas preciso dos **Price IDs**:

| Produto | Product ID | Preço |
|---------|-----------|-------|
| Plano Pro | `prod_TNg6ZjGjzmCa2S` | R$ 21,90/mês |
| Modo Coach Starter | `prod_TNg8OUQLkUTUta` | R$ 49,90/mês |
| Modo Coach Professional | `prod_TNg9YKhu88j2dj` | R$ 149,90/mês |
| Modo Coach Enterprise | `prod_TNgAxjI1tx84hO` | R$ 249,90/mês |

## 🔍 Como Encontrar os Price IDs

### Opção 1: Via Stripe Dashboard (Recomendado)

1. Acesse: https://dashboard.stripe.com/products
2. Clique em cada produto
3. Na seção **"Pricing"** ou **"Preços"**, você verá os **Price IDs**
4. Os Price IDs começam com `price_` (exemplo: `price_1ABC123...`)

### Opção 2: Via API do Stripe

Você pode usar este comando cURL (substitua `sk_test_...` pela sua chave):

```bash
# Para o Plano Pro
curl https://api.stripe.com/v1/prices?product=prod_TNg6ZjGjzmCa2S \
  -u sk_test_SEU_TOKEN_AQUI:

# Para Modo Coach Starter
curl https://api.stripe.com/v1/prices?product=prod_TNg8OUQLkUTUta \
  -u sk_test_SEU_TOKEN_AQUI:

# Para Modo Coach Professional
curl https://api.stripe.com/v1/prices?product=prod_TNg9YKhu88j2dj \
  -u sk_test_SEU_TOKEN_AQUI:

# Para Modo Coach Enterprise
curl https://api.stripe.com/v1/prices?product=prod_TNgAxjI1tx84hO \
  -u sk_test_SEU_TOKEN_AQUI:
```

## 📝 O Que Preciso

Envie os **Price IDs** no seguinte formato:

```
Plano Pro: price_XXXXXXXXXXXXX
Modo Coach Starter: price_XXXXXXXXXXXXX
Modo Coach Professional: price_XXXXXXXXXXXXX
Modo Coach Enterprise: price_XXXXXXXXXXXXX
```

## ⚠️ Importante

- **Price IDs de teste** são diferentes dos de **produção**
- Verifique qual modo você está usando (teste ou produção)
- O Price ID que você usar deve corresponder ao modo da `STRIPE_SECRET_KEY` configurada

## 🚀 Após Obter os Price IDs

Assim que você me enviar os Price IDs, vou:
1. Atualizar o código da função `create-checkout`
2. Fazer o deploy via MCP
3. Testar a integração

