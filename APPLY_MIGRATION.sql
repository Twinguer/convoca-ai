-- Migration: Fix payment_preferences INSERT policies
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Corrigir políticas RLS da tabela payment_preferences para permitir INSERT e UPDATE

-- Adicionar política para usuários inserirem suas próprias preferências
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_preferences' 
    AND policyname = 'Users can insert their own payment preferences'
  ) THEN
    CREATE POLICY "Users can insert their own payment preferences"
    ON payment_preferences FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Adicionar política para service_role inserir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_preferences' 
    AND policyname = 'Service role can insert payment preferences'
  ) THEN
    CREATE POLICY "Service role can insert payment preferences"
    ON payment_preferences FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- Adicionar política para atualizar (UPDATE)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_preferences' 
    AND policyname = 'Users can update their own payment preferences'
  ) THEN
    CREATE POLICY "Users can update their own payment preferences"
    ON payment_preferences FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role pode atualizar também
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payment_preferences' 
    AND policyname = 'Service role can update payment preferences'
  ) THEN
    CREATE POLICY "Service role can update payment preferences"
    ON payment_preferences FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

