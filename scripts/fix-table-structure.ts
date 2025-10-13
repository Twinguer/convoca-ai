import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function generateFixTableStructureSql() {
  console.log('🔧 Corrigindo estrutura das tabelas...');
  
  const sql = `
-- =====================================================
-- CORRIGIR ESTRUTURA DAS TABELAS
-- OBJETIVO: Adicionar colunas ausentes e corrigir estrutura
-- =====================================================

-- 1. ADICIONAR COLUNAS AUSENTES NA TABELA RANKINGS
-- =====================================================

ALTER TABLE rankings 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users_profiles(id);

-- 2. ADICIONAR COLUNAS AUSENTES NA TABELA RANKING_DISCIPLINES
-- =====================================================

ALTER TABLE ranking_disciplines 
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;

-- 3. ATUALIZAR COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN rankings.created_by IS 'ID do usuário que criou o ranking';
COMMENT ON COLUMN ranking_disciplines.total_questions IS 'Número total de questões da disciplina';

-- 4. CRIAR ÍNDICES PARA NOVAS COLUNAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rankings_created_by 
  ON rankings (created_by);

CREATE INDEX IF NOT EXISTS idx_ranking_disciplines_total_questions 
  ON ranking_disciplines (total_questions);

-- 5. VERIFICAR ESTRUTURA ATUAL
-- =====================================================

-- Verificar colunas da tabela rankings
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rankings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar colunas da tabela ranking_disciplines
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ranking_disciplines' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
`;

  console.log('📝 SQL para corrigir estrutura das tabelas:\n================================================================================\n');
  console.log(sql);
  console.log('\n================================================================================\n');
  console.log('🔗 Execute este SQL no Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  console.log('\n📋 Passos para executar:\n1. Acesse o link acima\n2. Cole o SQL na área de texto\n3. Clique em "Run" para executar\n4. Aguarde a confirmação de sucesso\n5. Execute: npm run create:test-data');
}

// Executar geração de SQL
generateFixTableStructureSql().catch(console.error);



