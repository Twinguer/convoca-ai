import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function implementAutoCleanup() {
  console.log('🧹 Implementando limpeza automática...');
  
  const autoCleanupSQL = `
-- =====================================================
-- IMPLEMENTAR LIMPEZA AUTOMÁTICA
-- OBJETIVO: Manter performance otimizada
-- =====================================================

-- 1. FUNÇÃO DE LIMPEZA DE DADOS ANTIGOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Limpar rankings inativos há mais de 1 ano
  DELETE FROM rankings 
  WHERE status = 'Inativo' 
    AND updated_at < NOW() - INTERVAL '1 year';
  
  -- Limpar user_rankings órfãos (sem ranking válido)
  DELETE FROM user_rankings 
  WHERE ranking_id NOT IN (SELECT id FROM rankings);
  
  -- Limpar user_answers órfãos (sem ranking válido)
  DELETE FROM user_answers 
  WHERE ranking_id NOT IN (SELECT id FROM rankings);
  
  -- Limpar ranking_answers órfãos (sem ranking válido)
  DELETE FROM ranking_answers 
  WHERE ranking_id NOT IN (SELECT id FROM rankings);
  
  -- Limpar ranking_disciplines órfãos (sem ranking válido)
  DELETE FROM ranking_disciplines 
  WHERE ranking_id NOT IN (SELECT id FROM rankings);
  
  -- Log da limpeza
  INSERT INTO system_logs (operation, details, created_at)
  VALUES ('cleanup_old_data', 'Limpeza automática executada', NOW());
  
  RAISE NOTICE 'Limpeza automática executada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- 2. FUNÇÃO DE OTIMIZAÇÃO DE ÍNDICES
-- =====================================================

CREATE OR REPLACE FUNCTION optimize_indexes()
RETURNS void AS $$
BEGIN
  -- Reindexar tabelas principais
  REINDEX TABLE rankings;
  REINDEX TABLE user_rankings;
  REINDEX TABLE user_answers;
  REINDEX TABLE ranking_answers;
  REINDEX TABLE ranking_disciplines;
  REINDEX TABLE users_profiles;
  
  -- Atualizar estatísticas
  ANALYZE rankings;
  ANALYZE user_rankings;
  ANALYZE user_answers;
  ANALYZE ranking_answers;
  ANALYZE ranking_disciplines;
  ANALYZE users_profiles;
  
  -- Log da otimização
  INSERT INTO system_logs (operation, details, created_at)
  VALUES ('optimize_indexes', 'Otimização de índices executada', NOW());
  
  RAISE NOTICE 'Otimização de índices executada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO DE MONITORAMENTO DE PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION monitor_performance()
RETURNS TABLE (
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  last_analyzed timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    last_analyze as last_analyzed
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND tablename IN ('rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. TABELA DE LOGS DO SISTEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para logs
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at 
  ON system_logs (created_at DESC);

-- 5. TRIGGER PARA LIMPEZA AUTOMÁTICA
-- =====================================================

-- Função para trigger de limpeza
CREATE OR REPLACE FUNCTION trigger_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  -- Executar limpeza quando ranking é deletado
  IF TG_OP = 'DELETE' THEN
    -- Limpar dados relacionados
    DELETE FROM user_rankings WHERE ranking_id = OLD.id;
    DELETE FROM user_answers WHERE ranking_id = OLD.id;
    DELETE FROM ranking_answers WHERE ranking_id = OLD.id;
    DELETE FROM ranking_disciplines WHERE ranking_id = OLD.id;
    
    -- Log da operação
    INSERT INTO system_logs (operation, details, created_at)
    VALUES ('ranking_deleted', 'Ranking ' || OLD.id || ' deletado e dados relacionados limpos', NOW());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpeza automática
CREATE TRIGGER cleanup_ranking_data
  AFTER DELETE ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup();

-- 6. JOB DE LIMPEZA AUTOMÁTICA (SIMULADO)
-- =====================================================

-- Função para executar limpeza diária
CREATE OR REPLACE FUNCTION daily_cleanup()
RETURNS void AS $$
BEGIN
  -- Executar limpeza de dados antigos
  PERFORM cleanup_old_data();
  
  -- Executar otimização de índices (apenas se necessário)
  IF (SELECT COUNT(*) FROM system_logs 
      WHERE operation = 'optimize_indexes' 
        AND created_at > NOW() - INTERVAL '7 days') = 0 THEN
    PERFORM optimize_indexes();
  END IF;
  
  -- Log da execução diária
  INSERT INTO system_logs (operation, details, created_at)
  VALUES ('daily_cleanup', 'Limpeza diária executada', NOW());
  
  RAISE NOTICE 'Limpeza diária executada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- 7. CONFIGURAÇÕES DE MANUTENÇÃO
-- =====================================================

-- Configurar autovacuum para tabelas principais
ALTER TABLE rankings SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE user_rankings SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE user_answers SET (autovacuum_vacuum_scale_factor = 0.1);

-- Configurar autovacuum para logs
ALTER TABLE system_logs SET (autovacuum_vacuum_scale_factor = 0.2);

-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION cleanup_old_data() IS 'Limpa dados antigos e órfãos do sistema';
COMMENT ON FUNCTION optimize_indexes() IS 'Otimiza índices e estatísticas das tabelas';
COMMENT ON FUNCTION monitor_performance() IS 'Monitora performance das tabelas principais';
COMMENT ON FUNCTION daily_cleanup() IS 'Executa limpeza diária automática';
COMMENT ON FUNCTION trigger_cleanup() IS 'Trigger para limpeza automática ao deletar ranking';

COMMENT ON TABLE system_logs IS 'Logs de operações do sistema';
`;

  console.log('📝 SQL para implementar limpeza automática:');
  console.log('='.repeat(80));
  console.log(autoCleanupSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run verify:cleanup');
  
  return autoCleanupSQL;
}

// Executar geração
implementAutoCleanup().catch(console.error);



