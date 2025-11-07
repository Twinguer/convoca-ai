# Debug: Erro 500 na função create-checkout

## Problema
A função `create-checkout` está retornando erro 500 ao tentar criar uma sessão de checkout no Stripe.

## Correções Aplicadas

### 1. Logs Detalhados Adicionados
- Log ao inicializar o cliente Stripe (mostra os primeiros 12 caracteres da chave)
- Log antes de criar a sessão (mostra priceId, URLs, email mascarado)
- Log detalhado de erros do Stripe (message, type, code, statusCode)
- Log de stack trace completo em caso de erro

### 2. Tratamento de Erros Específico
- Try-catch separado para inicialização do cliente Stripe
- Try-catch separado para criação da sessão no Stripe
- Mensagens de erro mais descritivas

## Próximos Passos

### 1. Fazer Deploy da Função Atualizada
```bash
cd /home/rlima/projetos/convoca-ai
npx supabase functions deploy create-checkout
```

### 2. Testar Novamente
Após o deploy, tente criar um checkout novamente e verifique os logs.

### 3. Verificar Logs Detalhados
Os logs agora mostrarão exatamente onde está falhando:
- Se a chave Stripe não está configurada
- Se há erro ao inicializar o cliente Stripe
- Se há erro ao criar a sessão (com detalhes do erro do Stripe)
- Se a sessão foi criada mas não tem URL

### 4. Possíveis Causas do Erro 500

#### A. STRIPE_SECRET_KEY não configurado ou inválido
- Verificar no Supabase Dashboard > Edge Functions > Secrets
- A chave deve começar com `sk_test_` (test) ou `sk_live_` (produção)

#### B. Price ID inválido
- O `price_1SQtQwRwuherhQlTKYDiUcgF` pode não existir na conta Stripe
- Verificar no Stripe Dashboard > Products > Prices

#### C. Problema com a API do Stripe
- Verificar se a conta Stripe está ativa
- Verificar se há limites de API atingidos
- Verificar se a versão da API está correta

#### D. Problema com a importação do Stripe SDK
- A versão `stripe@14.21.0` pode ter problemas no Deno
- Pode ser necessário atualizar a versão

## Como Verificar os Logs

### Via MCP (Recomendado)
```bash
# Os logs agora mostrarão detalhes específicos do erro
```

### Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/[seu-project-id]/logs/edge-functions
2. Filtre por `create-checkout`
3. Veja os logs detalhados com `[create-checkout]` prefix

## Exemplo de Log Esperado (Sucesso)
```
[create-checkout] User authenticated: [user-id], email: [email]
[create-checkout] Inicializando Stripe com chave: sk_test_1234...
[create-checkout] Criando sessão de checkout com: { priceId: "price_...", ... }
[create-checkout] Checkout session created: cs_test_... for user [user-id]
```

## Exemplo de Log Esperado (Erro)
```
[create-checkout] Erro ao criar sessão no Stripe: {
  message: "No such price: 'price_1SQtQwRwuherhQlTKYDiUcgF'",
  type: "StripeInvalidRequestError",
  code: "resource_missing",
  statusCode: 404
}
```

## Ação Imediata
1. Fazer deploy da função atualizada
2. Testar novamente
3. Verificar os logs detalhados
4. Compartilhar os logs para análise adicional

