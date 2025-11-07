# ⚠️ Erro: Conta Stripe não habilitada para Live Mode

## ❌ Problema Identificado

```
Your account cannot currently make live charges.
```

O erro ocorre porque:
- A `STRIPE_SECRET_KEY` configurada é uma chave de **produção** (`sk_live_...`)
- Mas a conta Stripe não está **habilitada** para fazer cobranças em modo live

## ✅ Soluções

### Opção 1: Usar Modo Teste (Recomendado para Desenvolvimento)

1. **Obter chave de teste:**
   - Acesse: https://dashboard.stripe.com/test/apikeys
   - Copie a **Secret key** de teste (começa com `sk_test_...`)

2. **Atualizar no Supabase:**
   - Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets
   - Edite a variável `STRIPE_SECRET_KEY`
   - Substitua pela chave de teste (`sk_test_...`)
   - Salve

3. **Criar Price IDs de teste:**
   - No Stripe Dashboard, certifique-se de estar no modo **teste** (toggle no canto superior direito)
   - Crie os preços novamente no modo teste
   - Atualize os Price IDs no código

### Opção 2: Habilitar Conta para Live Mode (Produção)

1. **Acesse o Stripe Dashboard:**
   - https://dashboard.stripe.com/settings/account

2. **Complete a verificação da conta:**
   - Informações da empresa
   - Documentos de identidade
   - Informações bancárias
   - Verificação de identidade

3. **Aguarde aprovação:**
   - O Stripe pode levar alguns dias para aprovar
   - Você receberá um email quando a conta estiver habilitada

## 🔍 Como Verificar o Modo Atual

### No Stripe Dashboard:
- **Modo Teste:** Toggle no canto superior direito mostra "Test mode"
- **Modo Live:** Toggle mostra "Live mode"

### Na Chave API:
- **Teste:** `sk_test_...`
- **Produção:** `sk_live_...`

## 📝 Recomendação

Para desenvolvimento e testes, use o **modo teste**:
- ✅ Não há risco de cobranças reais
- ✅ Pode testar todos os fluxos
- ✅ Cartões de teste disponíveis
- ✅ Não precisa completar verificação da conta

Para produção, complete a verificação da conta Stripe primeiro.

## 🚀 Após Resolver

1. Teste novamente a criação de checkout
2. O erro "cannot currently make live charges" não deve mais aparecer
3. Se usar modo teste, certifique-se de usar Price IDs de teste

