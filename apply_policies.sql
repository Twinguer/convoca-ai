-- Executar este SQL no Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/sql

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

