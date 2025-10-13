import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function updateUsersProfilesStructure() {
  console.log('🔧 Atualizando estrutura da tabela users_profiles...');
  
  const updateUsersProfilesSQL = `
-- =====================================================
-- ATUALIZAR TABELA USERS_PROFILES COM ESTRUTURA COMPLETA
-- =====================================================

-- 1. Adicionar colunas que estão faltando
ALTER TABLE users_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS concursos_aprovados TEXT,
ADD COLUMN IF NOT EXISTS concursos_participando TEXT,
ADD COLUMN IF NOT EXISTS profile_text TEXT,
ADD COLUMN IF NOT EXISTS estado JSONB,
ADD COLUMN IF NOT EXISTS formacao JSONB,
ADD COLUMN IF NOT EXISTS cargo_atual JSONB,
ADD COLUMN IF NOT EXISTS area_estudos JSONB,
ADD COLUMN IF NOT EXISTS especialidade JSONB,
ADD COLUMN IF NOT EXISTS curso_preparatorio JSONB,
ADD COLUMN IF NOT EXISTS rotina_estudos JSONB,
ADD COLUMN IF NOT EXISTS is_studying BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS study_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_concurseiro TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB;

-- 2. Atualizar comentários
COMMENT ON COLUMN users_profiles.email IS 'Email do usuário';
COMMENT ON COLUMN users_profiles.bio IS 'Biografia do usuário';
COMMENT ON COLUMN users_profiles.concursos_aprovados IS 'Concursos aprovados pelo usuário';
COMMENT ON COLUMN users_profiles.concursos_participando IS 'Concursos que o usuário está participando';
COMMENT ON COLUMN users_profiles.profile_text IS 'Texto do perfil do usuário';
COMMENT ON COLUMN users_profiles.estado IS 'Estado do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.formacao IS 'Formação do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.cargo_atual IS 'Cargo atual do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.area_estudos IS 'Área de estudos do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.especialidade IS 'Especialidade do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.curso_preparatorio IS 'Curso preparatório do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.rotina_estudos IS 'Rotina de estudos do usuário (JSONB)';
COMMENT ON COLUMN users_profiles.is_studying IS 'Se o usuário está estudando atualmente';
COMMENT ON COLUMN users_profiles.study_started_at IS 'Data de início dos estudos';
COMMENT ON COLUMN users_profiles.status_concurseiro IS 'Status do concurseiro';
COMMENT ON COLUMN users_profiles.nickname IS 'Nickname do usuário';
COMMENT ON COLUMN users_profiles.privacy_settings IS 'Configurações de privacidade (JSONB)';

-- 3. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_users_profiles_email 
  ON users_profiles (email);

CREATE INDEX IF NOT EXISTS idx_users_profiles_status_concurseiro 
  ON users_profiles (status_concurseiro);

CREATE INDEX IF NOT EXISTS idx_users_profiles_is_studying 
  ON users_profiles (is_studying);

-- 4. Atualizar política de segurança para incluir email
DROP POLICY IF EXISTS "users_profiles_own_data" ON users_profiles;
CREATE POLICY "users_profiles_own_data" ON users_profiles 
  FOR ALL USING (auth.uid() = id);
`;

  console.log('📝 SQL para atualizar tabela users_profiles:');
  console.log('='.repeat(80));
  console.log(updateUsersProfilesSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run migrate:data');
  
  return updateUsersProfilesSQL;
}

// Executar geração
updateUsersProfilesStructure().catch(console.error);



