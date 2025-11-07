# 🔑 Guia Completo: Como Encontrar a Chave de Teste no Stripe

## 🎯 Localização Exata

### Link Direto para Chaves de Teste
**https://dashboard.stripe.com/test/apikeys**

## 📋 Passo a Passo Detalhado

### Método 1: Via Link Direto (Mais Rápido)

1. **Acesse diretamente:**
   - https://dashboard.stripe.com/test/apikeys
   - Faça login se necessário

2. **Você verá duas seções:**
   - **Standard keys** (Chaves padrão)
     - **Secret key:** `sk_test_...` ← **ESTA É A QUE VOCÊ PRECISA**
     - **Publishable key:** `pk_test_...` (não é esta)

3. **Para revelar a Secret key:**
   - Clique no botão **"Reveal test key"** ou **"Revelar chave de teste"**
   - A chave será exibida
   - Clique em **"Copy"** para copiar

### Método 2: Via Menu do Dashboard

1. **Acesse o Stripe Dashboard:**
   - https://dashboard.stripe.com
   - Faça login

2. **Verifique o modo:**
   - No canto superior direito, há um toggle
   - Deve estar em **"Test mode"** ou **"Modo teste"**
   - Se estiver em "Live mode", clique para mudar para "Test mode"

3. **Navegue até as chaves:**
   - No menu lateral esquerdo, clique em **"Developers"** (Desenvolvedores)
   - Clique em **"API keys"** (Chaves de API)

4. **Encontre a Secret key:**
   - Na seção **"Standard keys"** ou **"Chaves padrão"**
   - Procure por **"Secret key"** (começa com `sk_test_...`)
   - Clique em **"Reveal test key"** para ver

### Método 3: Via Account Picker (Sandbox)

1. **No canto superior esquerdo do Dashboard:**
   - Clique no nome da conta (dropdown)
   - Selecione **"Switch to sandbox"** ou **"Mudar para sandbox"**

2. **Depois de mudar para sandbox:**
   - Acesse: **Developers** > **API keys**
   - As chaves de teste estarão visíveis

## 🔍 Como Identificar a Chave Correta

### ✅ Chave Correta (Secret Key)
- Começa com: `sk_test_...`
- Exemplo: `sk_test_51ABC123...`
- **Esta é a que você precisa para o Supabase**

### ❌ Chave Errada (Publishable Key)
- Começa com: `pk_test_...`
- Exemplo: `pk_test_51ABC123...`
- **NÃO use esta no Supabase**

## ⚠️ Problemas Comuns

### Problema 1: Não vejo "Reveal test key"
**Solução:**
- Certifique-se de estar no modo **TESTE** (toggle no canto superior direito)
- Se estiver em modo LIVE, mude para TESTE primeiro

### Problema 2: Só vejo chaves que começam com `sk_live_`
**Solução:**
- Você está no modo LIVE
- Mude para modo TESTE usando o toggle no canto superior direito
- Ou acesse diretamente: https://dashboard.stripe.com/test/apikeys

### Problema 3: Não tenho permissão para ver as chaves
**Solução:**
- Peça ao dono da conta Stripe para adicionar você ao time com permissões adequadas
- Ou peça para o dono da conta copiar a chave de teste para você

### Problema 4: A chave não aparece
**Solução:**
- Certifique-se de estar logado na conta correta
- Verifique se está no modo TESTE
- Tente acessar diretamente: https://dashboard.stripe.com/test/apikeys

## 📝 Após Copiar a Chave

1. **Acesse o Supabase:**
   - https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/secrets

2. **Edite a variável:**
   - Nome: `STRIPE_SECRET_KEY`
   - Valor: Cole a chave que começa com `sk_test_...`

3. **Salve as alterações**

## 🎯 Resumo Visual

```
Stripe Dashboard
│
├── [Toggle: Test mode / Live mode] ← Certifique-se de estar em TESTE
│
└── Developers (menu lateral)
    └── API keys
        │
        ├── Test mode keys (se estiver em modo teste)
        │   ├── Standard keys
        │   │   ├── Secret key: sk_test_... ← COPIE ESTA
        │   │   └── Publishable key: pk_test_... (não é esta)
        │   └── Restricted keys (se houver)
        │
        └── Live mode keys (se estiver em modo live)
            └── Secret key: sk_live_... (não use esta agora)
```

## 🔗 Links Úteis

- **Chaves de Teste:** https://dashboard.stripe.com/test/apikeys
- **Chaves de Produção:** https://dashboard.stripe.com/apikeys
- **Documentação:** https://docs.stripe.com/keys

## ✅ Checklist

- [ ] Estou no modo TESTE (toggle no canto superior direito)
- [ ] Acessei: https://dashboard.stripe.com/test/apikeys
- [ ] Encontrei a "Secret key" (começa com `sk_test_...`)
- [ ] Cliquei em "Reveal test key"
- [ ] Copiei a chave completa
- [ ] Atualizei no Supabase Dashboard > Secrets

## 🆘 Ainda Não Encontrou?

Se mesmo seguindo este guia você não conseguir encontrar a chave de teste:

1. **Verifique se você tem acesso à conta:**
   - Você precisa ser membro do time com permissões adequadas

2. **Peça ajuda ao dono da conta:**
   - O dono da conta pode copiar a chave de teste para você
   - Ou adicionar você ao time com permissões

3. **Crie uma nova conta de teste:**
   - Se for apenas para desenvolvimento, você pode criar uma nova conta Stripe de teste
   - Acesse: https://dashboard.stripe.com/register

