# ⚡ Executar Migration - payment_preferences INSERT Policies

## 📋 SQL para Executar

Execute este SQL no **Supabase Dashboard > SQL Editor**:

```sql
-- Corrigir políticas RLS da tabela payment_preferences para permitir INSERT e UPDATE

CREATE POLICY IF NOT EXISTS "Users can insert their own payment preferences"
ON payment_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can insert payment preferences"
ON payment_preferences FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update their own payment preferences"
ON payment_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can update payment preferences"
ON payment_preferences FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
```

## 🚀 Passos para Executar

1. **Acesse:** https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/sql
2. **Cole o SQL acima** no editor
3. **Clique em "Run"** ou pressione Ctrl+Enter
4. **Verifique** se não houve erros

## ⚠️ Nota Importante

**Esta migration é necessária**, mas **NÃO resolve o erro 401**. O erro 401 está acontecendo na validação de autenticação da Edge Function, ANTES de tentar inserir no banco.

Para resolver o 401, precisamos verificar os logs da Edge Function para ver se o header Authorization está chegando corretamente.

