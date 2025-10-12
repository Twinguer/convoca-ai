import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function implementPartitioning() {
  console.log('🔧 Implementando particionamento de tabelas...');
  
  const partitioningSQL = `
-- =====================================================
-- IMPLEMENTAR PARTICIONAMENTO DE TABELAS
-- OBJETIVO: Otimizar performance para 5.000 usuários
-- =====================================================

-- 1. PARTICIONAMENTO DA TABELA USER_RANKINGS
-- =====================================================

-- Criar tabela particionada por ranking_id
CREATE TABLE IF NOT EXISTS user_rankings_partitioned (
  LIKE user_rankings INCLUDING ALL
) PARTITION BY HASH (ranking_id);

-- Criar partições (4 partições para distribuição uniforme)
CREATE TABLE IF NOT EXISTS user_rankings_p0 PARTITION OF user_rankings_partitioned
  FOR VALUES WITH (modulus 4, remainder 0);

CREATE TABLE IF NOT EXISTS user_rankings_p1 PARTITION OF user_rankings_partitioned
  FOR VALUES WITH (modulus 4, remainder 1);

CREATE TABLE IF NOT EXISTS user_rankings_p2 PARTITION OF user_rankings_partitioned
  FOR VALUES WITH (modulus 4, remainder 2);

CREATE TABLE IF NOT EXISTS user_rankings_p3 PARTITION OF user_rankings_partitioned
  FOR VALUES WITH (modulus 4, remainder 3);

-- 2. PARTICIONAMENTO DA TABELA USER_ANSWERS
-- =====================================================

-- Criar tabela particionada por ranking_id
CREATE TABLE IF NOT EXISTS user_answers_partitioned (
  LIKE user_answers INCLUDING ALL
) PARTITION BY HASH (ranking_id);

-- Criar partições (4 partições para distribuição uniforme)
CREATE TABLE IF NOT EXISTS user_answers_p0 PARTITION OF user_answers_partitioned
  FOR VALUES WITH (modulus 4, remainder 0);

CREATE TABLE IF NOT EXISTS user_answers_p1 PARTITION OF user_answers_partitioned
  FOR VALUES WITH (modulus 4, remainder 1);

CREATE TABLE IF NOT EXISTS user_answers_p2 PARTITION OF user_answers_partitioned
  FOR VALUES WITH (modulus 4, remainder 2);

CREATE TABLE IF NOT EXISTS user_answers_p3 PARTITION OF user_answers_partitioned
  FOR VALUES WITH (modulus 4, remainder 3);

-- 3. ÍNDICES OTIMIZADOS PARA PARTIÇÕES
-- =====================================================

-- Índices para user_rankings_partitioned
CREATE INDEX IF NOT EXISTS idx_user_rankings_partitioned_ranking_score 
  ON user_rankings_partitioned (ranking_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_user_rankings_partitioned_ranking_position 
  ON user_rankings_partitioned (ranking_id, position);

CREATE INDEX IF NOT EXISTS idx_user_rankings_partitioned_user_id 
  ON user_rankings_partitioned (user_id);

-- Índices para user_answers_partitioned
CREATE INDEX IF NOT EXISTS idx_user_answers_partitioned_ranking_user 
  ON user_answers_partitioned (ranking_id, user_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_partitioned_ranking_question 
  ON user_answers_partitioned (ranking_id, booklet_id, question_number);

CREATE INDEX IF NOT EXISTS idx_user_answers_partitioned_user_id 
  ON user_answers_partitioned (user_id);

-- 4. CONFIGURAÇÕES DE PERFORMANCE
-- =====================================================

-- Configurar work_mem para operações de particionamento
SET work_mem = '256MB';

-- Configurar effective_cache_size
SET effective_cache_size = '1GB';

-- Configurar shared_buffers (se possível)
-- SET shared_buffers = '256MB';

-- 5. ANÁLISE DE TABELAS PARA OTIMIZAÇÃO
-- =====================================================

-- Analisar tabelas para otimizar estatísticas
ANALYZE rankings;
ANALYZE user_rankings;
ANALYZE user_answers;
ANALYZE ranking_answers;
ANALYZE ranking_disciplines;
ANALYZE users_profiles;

-- 6. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE user_rankings_partitioned IS 'Tabela particionada de user_rankings para otimizar performance';
COMMENT ON TABLE user_answers_partitioned IS 'Tabela particionada de user_answers para otimizar performance';

COMMENT ON TABLE user_rankings_p0 IS 'Partição 0 de user_rankings (modulus 4, remainder 0)';
COMMENT ON TABLE user_rankings_p1 IS 'Partição 1 de user_rankings (modulus 4, remainder 1)';
COMMENT ON TABLE user_rankings_p2 IS 'Partição 2 de user_rankings (modulus 4, remainder 2)';
COMMENT ON TABLE user_rankings_p3 IS 'Partição 3 de user_rankings (modulus 4, remainder 3)';

COMMENT ON TABLE user_answers_p0 IS 'Partição 0 de user_answers (modulus 4, remainder 0)';
COMMENT ON TABLE user_answers_p1 IS 'Partição 1 de user_answers (modulus 4, remainder 1)';
COMMENT ON TABLE user_answers_p2 IS 'Partição 2 de user_answers (modulus 4, remainder 2)';
COMMENT ON TABLE user_answers_p3 IS 'Partição 3 de user_answers (modulus 4, remainder 3)';
`;

  console.log('📝 SQL para implementar particionamento:');
  console.log('='.repeat(80));
  console.log(partitioningSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run verify:partitioning');
  
  return partitioningSQL;
}

// Executar geração
implementPartitioning().catch(console.error);

