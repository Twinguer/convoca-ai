import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function generateAddMissingColumnsSql() {
  console.log('🔧 Adicionando colunas ausentes...');
  
  const sql = `
-- =====================================================
-- ADICIONAR COLUNAS AUSENTES
-- OBJETIVO: Completar estrutura das tabelas
-- =====================================================

-- 1. ADICIONAR COLUNAS AUSENTES NA TABELA RANKINGS
-- =====================================================

ALTER TABLE rankings 
ADD COLUMN IF NOT EXISTS wrong_answer_penalty NUMERIC DEFAULT 0.25;

ALTER TABLE rankings 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 2. ATUALIZAR COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN rankings.wrong_answer_penalty IS 'Penalidade por resposta errada (0.0 a 1.0)';
COMMENT ON COLUMN rankings.descricao IS 'Descrição detalhada do ranking';

-- 3. CRIAR ÍNDICES PARA NOVAS COLUNAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rankings_wrong_answer_penalty 
  ON rankings (wrong_answer_penalty);

CREATE INDEX IF NOT EXISTS idx_rankings_descricao 
  ON rankings (descricao);

-- 4. ATUALIZAR DADOS EXISTENTES
-- =====================================================

UPDATE rankings 
SET wrong_answer_penalty = 0.25 
WHERE wrong_answer_penalty IS NULL;

UPDATE rankings 
SET descricao = 'Simulado para teste da nova estrutura' 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 5. VERIFICAR ESTRUTURA ATUAL
-- =====================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rankings' 
  AND table_schema = 'public'
  AND column_name IN ('wrong_answer_penalty', 'descricao')
ORDER BY ordinal_position;
`;

  console.log('📝 SQL para adicionar colunas ausentes:\n================================================================================\n');
  console.log(sql);
  console.log('\n================================================================================\n');
  console.log('🔗 Execute este SQL no Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  console.log('\n📋 Passos para executar:\n1. Acesse o link acima\n2. Cole o SQL na área de texto\n3. Clique em "Run" para executar\n4. Aguarde a confirmação de sucesso\n5. Execute: npm run test:compatibility');
}

// Executar geração de SQL
generateAddMissingColumnsSql().catch(console.error);



