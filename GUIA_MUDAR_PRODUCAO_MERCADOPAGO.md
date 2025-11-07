# 🚀 Guia: Mudar do Modo Teste para Produção - Mercado Pago

**Data:** 07 de Janeiro de 2025

---

## 📋 Resumo

Para mudar do modo **teste (sandbox)** para **produção**, você precisa:

1. ✅ Obter o **Access Token de Produção** no Mercado Pago
2. ✅ Atualizar o secret `MERCADOPAGO_ACCESS_TOKEN` no Supabase
3. ✅ Configurar o webhook de produção no Mercado Pago
4. ✅ Testar com um pagamento real

---

## 🔑 Passo 1: Obter Access Token de Produção

### 1.1 Acessar o Painel do Mercado Pago

**URL:** https://www.mercadopago.com.br/developers/panel/app

**Passos:**
1. Faça login na sua conta do Mercado Pago
2. Selecione sua aplicação
3. Vá em **"Credenciais"** no menu lateral

### 1.2 Identificar Tokens

Você verá duas seções:

**🔵 Credenciais de Teste (Sandbox):**
- Access Token de teste
- Public Key de teste
- Usado para desenvolvimento e testes

**🟢 Credenciais de Produção:**
- Access Token de produção
- Public Key de produção
- Usado para pagamentos reais

### 1.3 Copiar o Access Token de Produção

1. Na seção **"Credenciais de Produção"**
2. Localize o campo **"Access Token"**
3. Clique em **"Revelar"** ou **"Mostrar"**
4. **Copie o token completo**
   - Formato: `APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx`
   - ⚠️ **Mantenha este token seguro!**

---

## 🔧 Passo 2: Atualizar Secret no Supabase

### 2.1 Acessar o Dashboard do Supabase

**URL:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/functions

**Passos:**
1. Acesse o link acima
2. Vá na aba **"Secrets"**
3. Procure por `MERCADOPAGO_ACCESS_TOKEN`

### 2.2 Atualizar o Secret

**Opção A: Se o secret já existe**
1. Clique no secret `MERCADOPAGO_ACCESS_TOKEN`
2. Clique em **"Edit"** ou **"Atualizar"**
3. Cole o **Access Token de Produção** (copiado no Passo 1)
4. Clique em **"Save"** ou **"Salvar"**

**Opção B: Se o secret não existe**
1. Clique em **"Add new secret"** ou **"Adicionar novo secret"**
2. Nome: `MERCADOPAGO_ACCESS_TOKEN`
3. Valor: Cole o **Access Token de Produção**
4. Clique em **"Save"** ou **"Salvar"**

### 2.3 Aguardar Propagação

- ⏱️ Aguarde **2-5 minutos** para o secret ser propagado
- As Edge Functions serão atualizadas automaticamente
- Não é necessário fazer redeploy das funções

---

## 🔔 Passo 3: Configurar Webhook de Produção

### 3.1 Acessar Configuração de Webhooks

**URL:** https://www.mercadopago.com.br/developers/panel/app

**Passos:**
1. Acesse o painel do Mercado Pago
2. Selecione sua aplicação
3. Vá em **"Webhooks"** no menu lateral

### 3.2 Configurar URL do Webhook

**URL do Webhook:**
```
https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/mp-webhook
```

**Configuração:**
1. Se já existe um webhook configurado:
   - Clique em **"Editar"** ou **"Edit"**
   - Verifique se a URL está correta
   - Se estiver usando URL de teste, atualize para a URL acima

2. Se não existe webhook:
   - Clique em **"Adicionar webhook"** ou **"Add webhook"**
   - Cole a URL acima
   - Selecione os eventos:
     - ✅ `payment` (obrigatório)
     - ✅ `merchant_order` (opcional, mas recomendado)

3. Clique em **"Salvar"** ou **"Save"**

### 3.3 Verificar Modo

**Importante:**
- Certifique-se de que está configurando o webhook em **Produção** (não em Teste)
- O webhook de produção receberá notificações de pagamentos reais
- O webhook de teste recebe apenas notificações de pagamentos de teste

---

## 🧪 Passo 4: Testar em Produção

### 4.1 Teste com Pagamento Real (Pequeno Valor)

**⚠️ ATENÇÃO:** Em produção, você estará processando pagamentos reais!

**Recomendação:**
1. Faça um teste com um valor pequeno (ex: R$ 0,01 se possível, ou o valor mínimo)
2. Use um cartão de teste próprio
3. Verifique se o pagamento foi processado corretamente

### 4.2 Verificar Processamento

**No Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/editor
2. Vá na tabela `payment_preferences`
3. Verifique se o pagamento aparece:
   - `payment_id` preenchido
   - `status` = `approved` (se aprovado)
   - `mercado_pago_payment_data` preenchido

**Nos Logs:**
1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/mp-webhook/logs
2. Verifique se aparecem logs:
   - `[mp-webhook] Webhook chamado: {...}`
   - `[mp-webhook] Payment preference atualizada: ...`
   - Status 200 OK

### 4.3 Verificar Assinatura

**No Banco de Dados:**
1. Acesse a tabela `user_subscriptions`
2. Verifique se a assinatura foi criada/atualizada:
   - `is_active` = `true`
   - `expires_at` preenchido corretamente
   - `plan` = `pro`

---

## ⚠️ Diferenças entre Teste e Produção

### Modo Teste (Sandbox)

**Características:**
- ✅ Não processa pagamentos reais
- ✅ Usa cartões de teste
- ✅ Não gera cobranças reais
- ✅ Ideal para desenvolvimento
- ✅ Permite testes sem custo

**Cartões de Teste:**
- Aprovado: `5031 4332 1540 6351`
- CVV: `123`
- Data: Qualquer data futura

**Webhook:**
- Recebe notificações de pagamentos de teste
- `live_mode: false` no payload

### Modo Produção

**Características:**
- ⚠️ Processa pagamentos reais
- ⚠️ Usa cartões reais
- ⚠️ Gera cobranças reais
- ✅ Recebe dinheiro real
- ✅ Usuários reais podem pagar

**Webhook:**
- Recebe notificações de pagamentos reais
- `live_mode: true` no payload

---

## 🔄 Como Voltar para Teste

Se precisar voltar para o modo de teste:

1. **No Supabase:**
   - Atualize o secret `MERCADOPAGO_ACCESS_TOKEN` com o token de teste
   - Aguarde 2-5 minutos

2. **No Mercado Pago:**
   - Configure o webhook na seção de **Teste** (não Produção)

---

## 📋 Checklist de Migração

### Antes de Mudar para Produção

- [ ] Tenho o Access Token de produção copiado
- [ ] Entendo que vou processar pagamentos reais
- [ ] Configurei o webhook de produção
- [ ] Testei o fluxo completo em teste

### Durante a Migração

- [ ] Atualizei o secret `MERCADOPAGO_ACCESS_TOKEN` no Supabase
- [ ] Aguardei 2-5 minutos para propagação
- [ ] Configurei o webhook de produção no Mercado Pago
- [ ] Verifiquei que a URL do webhook está correta

### Após a Migração

- [ ] Fiz um teste com pagamento real (valor pequeno)
- [ ] Verifiquei que o pagamento foi processado
- [ ] Verifiquei que a assinatura foi criada/atualizada
- [ ] Verifiquei os logs do webhook
- [ ] Confirmei que tudo está funcionando

---

## 🔗 Links Úteis

### Supabase
- **Secrets:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/settings/functions
- **Functions:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions
- **Logs:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions/mp-webhook/logs
- **Table Editor:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/editor

### Mercado Pago
- **Dashboard:** https://www.mercadopago.com.br/developers/panel/app
- **Credenciais:** https://www.mercadopago.com.br/developers/panel/app/[SEU_APP_ID]/credentials
- **Webhooks:** https://www.mercadopago.com.br/developers/panel/app/[SEU_APP_ID]/webhooks

---

## 💡 Dicas Importantes

1. **Backup do Token de Teste:**
   - Guarde o token de teste antes de trocar
   - Você pode precisar voltar para testes

2. **Teste Gradual:**
   - Comece com valores pequenos
   - Monitore os logs cuidadosamente
   - Verifique cada etapa do processo

3. **Monitoramento:**
   - Monitore os logs nas primeiras horas
   - Verifique se os pagamentos estão sendo processados
   - Fique atento a erros

4. **Segurança:**
   - Nunca compartilhe o Access Token de produção
   - Não commite tokens no código
   - Use apenas secrets do Supabase

---

## 🚨 Problemas Comuns

### Erro 401 após mudar para produção

**Causa:** Token de produção inválido ou não propagado

**Solução:**
- Verifique se copiou o token completo
- Aguarde mais alguns minutos
- Verifique se está usando o token de produção (não teste)

### Webhook não recebe notificações

**Causa:** Webhook configurado em teste ao invés de produção

**Solução:**
- Verifique se configurou o webhook na seção de Produção
- Verifique se a URL está correta
- Teste o webhook manualmente no painel

### Pagamentos não são processados

**Causa:** Token incorreto ou webhook não configurado

**Solução:**
- Verifique os logs do webhook
- Verifique se o token está correto
- Verifique se o webhook está ativo

---

## ✅ Conclusão

Após seguir todos os passos:

1. ✅ Você estará usando o Access Token de produção
2. ✅ O webhook estará configurado para produção
3. ✅ Pagamentos reais serão processados
4. ✅ Assinaturas serão criadas/atualizadas automaticamente

**Lembre-se:** Em produção, você está processando pagamentos reais. Monitore cuidadosamente e teste antes de liberar para todos os usuários.

