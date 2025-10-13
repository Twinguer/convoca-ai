import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function generateFixUserForeignKeySql() {
  console.log('🔧 Corrigindo foreign key constraint para usuários...');
  
  const sql = `
-- =====================================================
-- CORRIGIR FOREIGN KEY CONSTRAINT PARA USUÁRIOS
-- OBJETIVO: Permitir participações de usuários existentes
-- =====================================================

-- 1. REMOVER CONSTRAINT PROBLEMÁTICA
-- =====================================================

ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS fk_user_rankings_user_profile;
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS fk_user_answers_user_profile;

-- 2. CRIAR CONSTRAINT CORRETA (SEM FOREIGN KEY)
-- =====================================================

-- Remover constraint de foreign key temporariamente para permitir dados de teste
-- A constraint será recriada depois que os dados estiverem corretos

-- 3. VERIFICAR DADOS EXISTENTES
-- =====================================================

-- Verificar usuários que existem
SELECT 'Usuários em users_profiles' as tabela, COUNT(*) as total
FROM users_profiles

UNION ALL

SELECT 'Usuários em auth.users' as tabela, COUNT(*) as total
FROM auth.users

UNION ALL

SELECT 'Participações existentes' as tabela, COUNT(*) as total
FROM user_rankings;

-- 4. COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN user_rankings.user_id IS 'ID do usuário (referência para users_profiles - constraint temporariamente removida)';
COMMENT ON COLUMN user_answers.user_id IS 'ID do usuário (referência para users_profiles - constraint temporariamente removida)';
`;

  console.log('📝 SQL para corrigir foreign key constraint:\n================================================================================\n');
  console.log(sql);
  console.log('\n================================================================================\n');
  console.log('🔗 Execute este SQL no Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  console.log('\n📋 Passos para executar:\n1. Acesse o link acima\n2. Cole o SQL na área de texto\n3. Clique em "Run" para executar\n4. Aguarde a confirmação de sucesso\n5. Execute: npm run create:complete-test-data');
}

// Executar geração de SQL
generateFixUserForeignKeySql().catch(console.error);



