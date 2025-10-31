# 🔐 Segurança - Mercado Pago Integration

## ✅ Boas Práticas de Segurança Implementadas

### 1. Access Token no Header (Nunca em Query Params)

**✅ IMPLEMENTADO CORRETAMENTE**

Todas as chamadas à API do Mercado Pago usam o Access Token no header `Authorization`, seguindo o padrão Bearer:

```typescript
// ✅ CORRETO - Token no header
const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`  // ✅ Seguro
  },
  body: JSON.stringify(data)
});

// ❌ ERRADO - Token em query param (NÃO FAZEMOS ISSO)
// const response = await fetch(
//   `https://api.mercadopago.com/checkout/preferences?access_token=${token}`  // ❌ Inseguro
// );
```

### 2. Onde o Token é Usado

#### Edge Function: `create-mercadopago-preference`
**Arquivo:** `supabase/functions/create-mercadopago-preference/index.ts`

```typescript
const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`  // ✅ Seguro
  },
  body: JSON.stringify(preferenceData)
});
```

#### Edge Function: `mercadopago-webhook`
**Arquivo:** `supabase/functions/mercadopago-webhook/index.ts`

```typescript
const paymentResponse = await fetch(
  `https://api.mercadopago.com/v1/payments/${paymentId}`,
  {
    headers: {
      "Authorization": `Bearer ${accessToken}`  // ✅ Seguro
    }
  }
);
```

### 3. Armazenamento Seguro do Token

- ✅ Token armazenado como **Secret** no Supabase (variável de ambiente)
- ✅ Token **nunca** exposto no código do frontend
- ✅ Token **nunca** commitado no Git
- ✅ Token acessado apenas via `Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")`

### 4. Por que usar Header ao invés de Query Param?

1. **Segurança**: Query params podem aparecer em logs de servidor, histórico do navegador, e URLs compartilhadas
2. **Padrão OAuth 2.0**: O formato `Bearer` é o padrão recomendado pela especificação OAuth 2.0
3. **Não exposição**: Headers não aparecem na URL, reduzindo risco de exposição acidental
4. **Melhor prática**: Recomendado pelo Mercado Pago e pela indústria

### 5. Verificação Periódica

Para garantir que nunca usamos query params por engano, podemos verificar:

```bash
# Buscar por padrões inseguros (não deve retornar resultados)
grep -r "api.mercadopago.com.*access_token" .
grep -r "\?access_token" .
grep -r "&access_token" .
```

## 📋 Checklist de Segurança

- ✅ Access Token sempre no header `Authorization: Bearer`
- ✅ Token nunca em query params
- ✅ Token armazenado como Secret no Supabase
- ✅ Token nunca exposto no frontend
- ✅ Token nunca commitado no Git
- ✅ Todas as chamadas API verificadas

## 🔄 Mantendo a Segurança

Sempre que adicionar novas chamadas à API do Mercado Pago:

1. ✅ Use sempre o header `Authorization: Bearer ${token}`
2. ✅ Nunca coloque o token na URL como query param
3. ✅ Sempre busque o token de variáveis de ambiente: `Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")`
4. ✅ Verifique que o token não está sendo logado ou exposto

---

**Última Verificação:** 31/10/2025  
**Status:** ✅ Todos os requisitos de segurança atendidos

