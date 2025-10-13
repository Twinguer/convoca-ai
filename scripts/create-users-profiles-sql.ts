import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function generateUsersProfilesSQL() {
  console.log('🔧 Gerando SQL para criar tabela users_profiles...');
  
  const createUsersProfilesSQL = `
-- =====================================================
-- CRIAR TABELA USERS_PROFILES
-- =====================================================

-- 1. Criar tabela users_profiles
CREATE TABLE IF NOT EXISTS users_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de segurança
CREATE POLICY "users_profiles_public_read" ON users_profiles 
  FOR SELECT USING (true);

CREATE POLICY "users_profiles_own_data" ON users_profiles 
  FOR ALL USING (auth.uid() = id);

-- 4. Trigger para updated_at
CREATE TRIGGER update_users_profiles_updated_at
  BEFORE UPDATE ON users_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_profiles_name 
  ON users_profiles (name);

CREATE INDEX IF NOT EXISTS idx_users_profiles_created_at 
  ON users_profiles (created_at DESC);

-- 6. Comentários
COMMENT ON TABLE users_profiles IS 'Perfis dos usuários do sistema';
COMMENT ON COLUMN users_profiles.id IS 'ID do usuário (referência para auth.users)';
COMMENT ON COLUMN users_profiles.name IS 'Nome do usuário';
COMMENT ON COLUMN users_profiles.avatar_url IS 'URL do avatar do usuário';
COMMENT ON COLUMN users_profiles.created_at IS 'Data de criação do perfil';
COMMENT ON COLUMN users_profiles.updated_at IS 'Data da última atualização do perfil';
`;

  console.log('📝 SQL para criar tabela users_profiles:');
  console.log('='.repeat(80));
  console.log(createUsersProfilesSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run verify:new-structure');
  
  return createUsersProfilesSQL;
}

// Executar geração
generateUsersProfilesSQL().catch(console.error);



