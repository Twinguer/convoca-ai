-- Criar tabela para rastrear preferências de pagamento do Mercado Pago
CREATE TABLE IF NOT EXISTS payment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  preference_id TEXT NOT NULL UNIQUE,
  external_reference TEXT NOT NULL UNIQUE,
  payment_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user_id ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_external_reference ON payment_preferences(external_reference);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_preference_id ON payment_preferences(preference_id);

-- RLS
ALTER TABLE payment_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own payment preferences"
ON payment_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment preferences"
ON payment_preferences FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_preferences_updated_at
  BEFORE UPDATE ON payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_preferences_updated_at();

