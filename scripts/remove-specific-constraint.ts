import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function generateRemoveSpecificConstraintSql() {
  console.log('🔧 Removendo constraint específica user_rankings_user_id_fkey...');
  
  const sql = `
-- =====================================================
-- REMOVER CONSTRAINT ESPECÍFICA user_rankings_user_id_fkey
-- OBJETIVO: Permitir participações de usuários existentes
-- =====================================================

-- 1. REMOVER CONSTRAINT ESPECÍFICA
-- =====================================================

-- Remover constraint que está causando problema
ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS user_rankings_user_id_fkey;
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS user_answers_user_id_fkey;

-- 2. VERIFICAR SE CONSTRAINTS FORAM REMOVIDAS
-- =====================================================

-- Verificar constraints restantes
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('user_rankings', 'user_answers')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 3. TESTAR INSERÇÃO APÓS REMOÇÃO
-- =====================================================

-- Testar inserção de participação
INSERT INTO user_rankings (
    ranking_id,
    user_id,
    score,
    position,
    reservation_type
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '50d2ba4b-67e5-486c-9a0f-eea78c5b0f1d',
    800,
    1,
    'Ampla Concorrência'
);

-- 4. COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN user_rankings.user_id IS 'ID do usuário (constraint removida temporariamente)';
COMMENT ON COLUMN user_answers.user_id IS 'ID do usuário (constraint removida temporariamente)';
`;

  console.log('📝 SQL para remover constraint específica:\n================================================================================\n');
  console.log(sql);
  console.log('\n================================================================================\n');
  console.log('🔗 Execute este SQL no Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  console.log('\n📋 Passos para executar:\n1. Acesse o link acima\n2. Cole o SQL na área de texto\n3. Clique em "Run" para executar\n4. Aguarde a confirmação de sucesso\n5. Execute: npm run create:complete-test-data');
}

// Executar geração de SQL
generateRemoveSpecificConstraintSql().catch(console.error);

