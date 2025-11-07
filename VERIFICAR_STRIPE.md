# 🔍 Como Verificar se Está Usando Stripe

**Data:** 07 de Janeiro de 2025

---

## ✅ Verificações no Código

O código está configurado para usar Stripe:

1. **`src/services/paymentService.ts`**
   - ✅ Método: `createCheckout()`
   - ✅ Função chamada: `create-checkout`
   - ✅ Não chama mais `create-mp-preference`

2. **`src/pages/Planos.tsx`**
   - ✅ Chama: `paymentService.createCheckout(planoId)`
   - ✅ Redireciona para: `checkout.url` (Stripe)

---

## 🔍 Como Verificar no Navegador

### 1. Abrir Console do Navegador (F12)

### 2. Verificar Logs

Ao clicar em "Assinar", você deve ver:

```
[Planos] Iniciando checkout Stripe para plano: pro
[paymentService] Criando checkout no Stripe para plano: pro
[paymentService] Sessão de checkout criada com sucesso
[Planos] Redirecionando para Stripe Checkout: https://checkout.stripe.com/...
```

### 3. Verificar Requisições de Rede

Na aba **Network** do DevTools:

- ✅ Deve aparecer: `POST /functions/v1/create-checkout`
- ❌ NÃO deve aparecer: `POST /functions/v1/create-mp-preference`

### 4. Verificar URL de Redirecionamento

Após clicar em "Assinar", a URL deve ser:
- ✅ `https://checkout.stripe.com/...`
- ❌ NÃO deve ser: `https://www.mercadopago.com.br/...`

---

## 🐛 Se Ainda Estiver Usando Mercado Pago

### Possíveis Causas:

1. **Cache do Navegador**
   - Solução: Limpar cache (Ctrl+Shift+Delete) ou usar modo anônimo

2. **Build Não Atualizado**
   - Solução: Recompilar o frontend
   ```bash
   npm run build
   # ou
   npm run dev
   ```

3. **Código Antigo em Produção**
   - Solução: Fazer deploy do frontend atualizado

---

## ✅ Checklist de Verificação

- [ ] Console mostra logs do Stripe
- [ ] Network mostra requisição para `create-checkout`
- [ ] URL de redirecionamento é do Stripe
- [ ] Não há requisições para `create-mp-preference`

---

**Se ainda estiver usando Mercado Pago após essas verificações, pode ser cache ou build desatualizado.**

