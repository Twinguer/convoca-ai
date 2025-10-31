-- Corrigir políticas RLS da tabela payment_preferences para permitir INSERT e UPDATE

-- Adicionar política para usuários inserirem suas próprias preferências
CREATE POLICY IF NOT EXISTS "Users can insert their own payment preferences"
ON payment_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Adicionar política para service_role inserir (para Edge Functions se necessário)
CREATE POLICY IF NOT EXISTS "Service role can insert payment preferences"
ON payment_preferences FOR INSERT
TO service_role
WITH CHECK (true);

-- Adicionar política para atualizar (UPDATE)
CREATE POLICY IF NOT EXISTS "Users can update their own payment preferences"
ON payment_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role pode atualizar também
CREATE POLICY IF NOT EXISTS "Service role can update payment preferences"
ON payment_preferences FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

