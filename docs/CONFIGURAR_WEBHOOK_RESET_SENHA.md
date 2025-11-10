# Configurar Webhook para Reset de Senha

## Problema
Os emails de reset de senha não estão sendo enviados porque não há uma Edge Function configurada para processar esse tipo de email.

## Solução
Foi criada a Edge Function `send-password-reset-email` que precisa ser configurada como webhook no Supabase.

## Passo a Passo

### 1. Acessar o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc
2. Navegue até **Database** > **Webhooks**

### 2. Criar Novo Webhook
1. Clique em **"Create a new webhook"** ou **"Add webhook"**
2. Configure:
   - **Name**: `send-password-reset-email` (ou qualquer nome)
   - **Table**: `auth.users` (ou deixe vazio se não houver essa opção)
   - **Events**: Selecione eventos relacionados a password reset
   - **HTTP Request**:
     - **URL**: `https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/send-password-reset-email`
     - **HTTP Method**: `POST`
     - **HTTP Headers**: 
       ```
       Content-Type: application/json
       Authorization: Bearer [SEU_SERVICE_ROLE_KEY]
       ```

### 3. Configurar via Auth Hooks (Recomendado)
O Supabase Auth tem um sistema de hooks específico para emails:

1. Vá para **Authentication** > **Hooks** (ou **Email Templates**)
2. Procure por **"Password Reset"** ou **"Recovery"**
3. Configure o webhook URL:
   - **URL**: `https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/send-password-reset-email`
   - **Secret**: Use o mesmo `SEND_EMAIL_HOOK_SECRET` usado na função de confirmação

### 4. Verificar Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas na Edge Function:
- `RESEND_API_KEY`: Chave da API do Resend
- `SEND_EMAIL_HOOK_SECRET`: Secret para validar o webhook (mesmo da confirmação)
- `SUPABASE_URL`: `https://ppsymqrdtjyaguftracc.supabase.co`
- `SITE_URL`: `https://www.nomeiai.com.br`

### 5. Testar
1. Acesse a página de "Esqueci minha senha"
2. Digite um email cadastrado
3. Verifique se o email foi recebido

## Nota Importante
O Supabase pode usar um sistema de webhooks diferente para emails. Verifique na documentação do Supabase sobre "Custom SMTP" ou "Email Templates" para configurar corretamente.

