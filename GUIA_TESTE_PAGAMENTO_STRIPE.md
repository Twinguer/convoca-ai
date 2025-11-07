# 🧪 Guia Completo: Como Testar Pagamentos no Stripe

## ✅ Status Atual

O checkout do Stripe está funcionando! Agora você pode testar pagamentos usando cartões de teste.

## 🎯 Cartões de Teste do Stripe

### Cartões que Funcionam (Aprovados)

| Número do Cartão | Descrição | CVC | Data de Validade |
|------------------|-----------|-----|------------------|
| `4242 4242 4242 4242` | Cartão Visa de teste (sucesso) | Qualquer 3 dígitos | Qualquer data futura (ex: 12/34) |
| `5555 5555 5555 4444` | Cartão Mastercard de teste (sucesso) | Qualquer 3 dígitos | Qualquer data futura |
| `4000 0566 5566 5556` | Cartão Visa de débito (sucesso) | Qualquer 3 dígitos | Qualquer data futura |

### Cartões que Falham (Para Testar Erros)

| Número do Cartão | Descrição | Resultado |
|------------------|-----------|-----------|
| `4000 0000 0000 0002` | Cartão recusado | Pagamento recusado |
| `4000 0000 0000 9995` | Fundos insuficientes | Erro de fundos |
| `4000 0000 0000 0069` | Cartão expirado | Erro de cartão expirado |
| `4000 0000 0000 0127` | CVC incorreto | Erro de CVC |

## 📋 Passo a Passo para Testar

### 1. Acessar o Checkout

1. No frontend, clique em "Assinar" no plano Pro
2. Você será redirecionado para o Stripe Checkout
3. A URL deve começar com: `https://checkout.stripe.com/...`

### 2. Preencher os Dados do Cartão

1. **Número do Cartão:** Use um dos cartões de teste acima
   - Exemplo: `4242 4242 4242 4242`
2. **Data de Validade:** Qualquer data futura
   - Exemplo: `12/34` (dezembro de 2034)
3. **CVC:** Qualquer 3 dígitos
   - Exemplo: `123`
4. **CEP:** Qualquer CEP válido
   - Exemplo: `01310-100`

### 3. Completar o Pagamento

1. Clique em **"Assinar"** ou **"Pagar"**
2. O Stripe processará o pagamento de teste
3. Você será redirecionado de volta para: `https://www.nomeiai.com.br/planos?status=success&plan=pro`

### 4. Verificar o Resultado

**Se o pagamento for aprovado:**
- Você verá uma mensagem de sucesso
- A assinatura será criada no Stripe
- O plano será ativado no sistema

**Se o pagamento for recusado:**
- Você verá uma mensagem de erro
- Nenhuma cobrança será feita
- Você pode tentar novamente

## 🔍 Verificar no Stripe Dashboard

### Verificar Pagamentos

1. Acesse: https://dashboard.stripe.com/test/payments
2. Você verá todos os pagamentos de teste realizados
3. Clique em um pagamento para ver os detalhes

### Verificar Assinaturas

1. Acesse: https://dashboard.stripe.com/test/subscriptions
2. Você verá todas as assinaturas criadas
3. Cada assinatura mostra:
   - Status (ativa, cancelada, etc.)
   - Valor cobrado
   - Próxima data de cobrança
   - Histórico de pagamentos

### Verificar Customers

1. Acesse: https://dashboard.stripe.com/test/customers
2. Você verá todos os customers criados
3. Cada customer mostra:
   - Email
   - Assinaturas ativas
   - Histórico de pagamentos

## 🧪 Cenários de Teste Recomendados

### Teste 1: Pagamento Aprovado
- **Cartão:** `4242 4242 4242 4242`
- **Resultado esperado:** ✅ Pagamento aprovado, assinatura criada

### Teste 2: Pagamento Recusado
- **Cartão:** `4000 0000 0000 0002`
- **Resultado esperado:** ❌ Pagamento recusado, mensagem de erro

### Teste 3: Fundos Insuficientes
- **Cartão:** `4000 0000 0000 9995`
- **Resultado esperado:** ❌ Erro de fundos insuficientes

### Teste 4: Cartão Expirado
- **Cartão:** `4000 0000 0000 0069`
- **Resultado esperado:** ❌ Erro de cartão expirado

## 📊 Verificar Logs da Função

### Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/create-checkout/logs
2. Procure pelos logs mais recentes
3. Você verá:
   - `[create-checkout] User authenticated`
   - `[create-checkout] Customer existente encontrado` ou `[create-checkout] Novo customer criado`
   - `[create-checkout] Checkout session created`

## ⚠️ Importante

### Modo Teste vs Produção

- **Modo Teste:** Não há cobranças reais, apenas simulações
- **Modo Produção:** Cobranças reais são feitas (use apenas quando estiver pronto)

### Verificar Qual Modo Está Ativo

1. No Stripe Dashboard, verifique o toggle no canto superior direito
2. **"Test mode"** = Modo teste (seguro para testes)
3. **"Live mode"** = Modo produção (cobranças reais)

## 🔗 Links Úteis

- **Pagamentos de Teste:** https://dashboard.stripe.com/test/payments
- **Assinaturas de Teste:** https://dashboard.stripe.com/test/subscriptions
- **Customers de Teste:** https://dashboard.stripe.com/test/customers
- **Documentação de Testes:** https://docs.stripe.com/testing

## ✅ Checklist de Teste

- [ ] Testei pagamento aprovado com cartão `4242 4242 4242 4242`
- [ ] Verifiquei que a assinatura foi criada no Stripe Dashboard
- [ ] Verifiquei que o customer foi criado/encontrado
- [ ] Testei pagamento recusado com cartão `4000 0000 0000 0002`
- [ ] Verifiquei que a mensagem de erro apareceu corretamente
- [ ] Verifiquei os logs da função no Supabase Dashboard
- [ ] Confirmei que o redirecionamento após sucesso funciona

## 🎉 Próximos Passos

Após testar com sucesso:

1. **Configurar Webhook do Stripe** para processar eventos de pagamento
2. **Ativar plano no banco de dados** quando o pagamento for aprovado
3. **Testar em produção** quando estiver pronto (usando cartões reais)

