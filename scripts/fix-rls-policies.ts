import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function fixRLSPolicies() {
  console.log('🔧 Ajustando políticas de RLS para permitir migração...');
  
  const fixRLSSQL = `
-- =====================================================
-- AJUSTAR POLÍTICAS DE RLS PARA MIGRAÇÃO
-- =====================================================

-- 1. Temporariamente desabilitar RLS para migração
ALTER TABLE users_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_disciplines DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS "users_profiles_public_read" ON users_profiles;
DROP POLICY IF EXISTS "users_profiles_own_data" ON users_profiles;
DROP POLICY IF EXISTS "rankings_public_read" ON rankings;
DROP POLICY IF EXISTS "rankings_authenticated_insert" ON rankings;
DROP POLICY IF EXISTS "rankings_owner_update" ON rankings;
DROP POLICY IF EXISTS "user_rankings_public_read" ON user_rankings;
DROP POLICY IF EXISTS "user_rankings_own_data" ON user_rankings;
DROP POLICY IF EXISTS "user_answers_own_data" ON user_answers;
DROP POLICY IF EXISTS "ranking_answers_public_read" ON ranking_answers;
DROP POLICY IF EXISTS "ranking_answers_authenticated_insert" ON ranking_answers;
DROP POLICY IF EXISTS "ranking_disciplines_public_read" ON ranking_disciplines;
DROP POLICY IF EXISTS "ranking_disciplines_authenticated_insert" ON ranking_disciplines;

-- 3. Criar políticas mais permissivas para migração
-- Users profiles - permitir tudo para migração
CREATE POLICY "users_profiles_migration" ON users_profiles 
  FOR ALL USING (true);

-- Rankings - permitir tudo para migração
CREATE POLICY "rankings_migration" ON rankings 
  FOR ALL USING (true);

-- User rankings - permitir tudo para migração
CREATE POLICY "user_rankings_migration" ON user_rankings 
  FOR ALL USING (true);

-- User answers - permitir tudo para migração
CREATE POLICY "user_answers_migration" ON user_answers 
  FOR ALL USING (true);

-- Ranking answers - permitir tudo para migração
CREATE POLICY "ranking_answers_migration" ON ranking_answers 
  FOR ALL USING (true);

-- Ranking disciplines - permitir tudo para migração
CREATE POLICY "ranking_disciplines_migration" ON ranking_disciplines 
  FOR ALL USING (true);

-- 4. Reabilitar RLS
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_disciplines ENABLE ROW LEVEL SECURITY;

-- 5. Comentários
COMMENT ON POLICY "users_profiles_migration" ON users_profiles IS 'Política temporária para migração de dados';
COMMENT ON POLICY "rankings_migration" ON rankings IS 'Política temporária para migração de dados';
COMMENT ON POLICY "user_rankings_migration" ON user_rankings IS 'Política temporária para migração de dados';
COMMENT ON POLICY "user_answers_migration" ON user_answers IS 'Política temporária para migração de dados';
COMMENT ON POLICY "ranking_answers_migration" ON ranking_answers IS 'Política temporária para migração de dados';
COMMENT ON POLICY "ranking_disciplines_migration" ON ranking_disciplines IS 'Política temporária para migração de dados';
`;

  console.log('📝 SQL para ajustar políticas de RLS:');
  console.log('='.repeat(80));
  console.log(fixRLSSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run migrate:data');
  
  return fixRLSSQL;
}

// Executar geração
fixRLSPolicies().catch(console.error);



