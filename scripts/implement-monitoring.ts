import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function implementMonitoring() {
  console.log('📊 Implementando monitoramento de performance...');
  
  const monitoringSQL = `
-- =====================================================
-- IMPLEMENTAR MONITORAMENTO DE PERFORMANCE
-- OBJETIVO: Monitorar e otimizar performance
-- =====================================================

-- 1. TABELA DE MÉTRICAS DE PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  table_name TEXT,
  operation_type TEXT,
  execution_time_ms NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name 
  ON performance_metrics (metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at 
  ON performance_metrics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_table 
  ON performance_metrics (table_name);

-- 2. FUNÇÃO PARA REGISTRAR MÉTRICAS
-- =====================================================

CREATE OR REPLACE FUNCTION record_performance_metric(
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metric_unit TEXT DEFAULT NULL,
  p_table_name TEXT DEFAULT NULL,
  p_operation_type TEXT DEFAULT NULL,
  p_execution_time_ms NUMERIC DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO performance_metrics (
    metric_name,
    metric_value,
    metric_unit,
    table_name,
    operation_type,
    execution_time_ms
  ) VALUES (
    p_metric_name,
    p_metric_value,
    p_metric_unit,
    p_table_name,
    p_operation_type,
    p_execution_time_ms
  );
END;
$$ LANGUAGE plpgsql;

-- 3. FUNÇÃO DE MONITORAMENTO DE QUERIES
-- =====================================================

CREATE OR REPLACE FUNCTION monitor_queries()
RETURNS TABLE (
  query_text TEXT,
  calls BIGINT,
  total_time NUMERIC,
  mean_time NUMERIC,
  max_time NUMERIC,
  min_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LEFT(query, 100) as query_text,
    calls,
    ROUND(total_exec_time::NUMERIC, 2) as total_time,
    ROUND(mean_exec_time::NUMERIC, 2) as mean_time,
    ROUND(max_exec_time::NUMERIC, 2) as max_time,
    ROUND(min_exec_time::NUMERIC, 2) as min_time
  FROM pg_stat_statements 
  WHERE query LIKE '%rankings%' 
     OR query LIKE '%user_rankings%'
     OR query LIKE '%user_answers%'
  ORDER BY total_exec_time DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO DE MONITORAMENTO DE TABELAS
-- =====================================================

CREATE OR REPLACE FUNCTION monitor_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  seq_scan BIGINT,
  seq_tup_read BIGINT,
  idx_scan BIGINT,
  idx_tup_fetch BIGINT,
  n_tup_ins BIGINT,
  n_tup_upd BIGINT,
  n_tup_del BIGINT,
  last_analyze TIMESTAMP,
  last_autoanalyze TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    last_analyze,
    last_autoanalyze
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND tablename IN ('rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO DE MONITORAMENTO DE ÍNDICES
-- =====================================================

CREATE OR REPLACE FUNCTION monitor_indexes()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  index_usage BIGINT,
  index_scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_tup_read as index_usage,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
    AND tablename IN ('rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles')
  ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO DE RELATÓRIO DE PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_performance_report()
RETURNS TABLE (
  report_section TEXT,
  metric_name TEXT,
  metric_value TEXT,
  recommendation TEXT
) AS $$
DECLARE
  total_size NUMERIC;
  total_rows BIGINT;
  avg_query_time NUMERIC;
  slow_queries BIGINT;
BEGIN
  -- Calcular tamanho total das tabelas
  SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename)) INTO total_size
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND tablename IN ('rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles');
  
  -- Calcular total de registros
  SELECT SUM(n_tup_ins - n_tup_del) INTO total_rows
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
    AND tablename IN ('rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles');
  
  -- Calcular tempo médio de queries
  SELECT AVG(mean_exec_time) INTO avg_query_time
  FROM pg_stat_statements 
  WHERE query LIKE '%rankings%' OR query LIKE '%user_rankings%';
  
  -- Contar queries lentas
  SELECT COUNT(*) INTO slow_queries
  FROM pg_stat_statements 
  WHERE (query LIKE '%rankings%' OR query LIKE '%user_rankings%')
    AND mean_exec_time > 1000; -- Queries com mais de 1 segundo
  
  -- Retornar relatório
  RETURN QUERY
  SELECT 
    'Database Size'::TEXT as report_section,
    'Total Size'::TEXT as metric_name,
    pg_size_pretty(total_size) as metric_value,
    CASE 
      WHEN total_size > 1073741824 THEN 'Consider partitioning large tables'
      ELSE 'Size is within acceptable limits'
    END as recommendation
  
  UNION ALL
  
  SELECT 
    'Database Size'::TEXT,
    'Total Rows'::TEXT,
    total_rows::TEXT,
    CASE 
      WHEN total_rows > 1000000 THEN 'Consider archiving old data'
      ELSE 'Row count is manageable'
    END
  
  UNION ALL
  
  SELECT 
    'Query Performance'::TEXT,
    'Average Query Time (ms)'::TEXT,
    ROUND(avg_query_time::NUMERIC, 2)::TEXT,
    CASE 
      WHEN avg_query_time > 500 THEN 'Consider optimizing slow queries'
      ELSE 'Query performance is good'
    END
  
  UNION ALL
  
  SELECT 
    'Query Performance'::TEXT,
    'Slow Queries Count'::TEXT,
    slow_queries::TEXT,
    CASE 
      WHEN slow_queries > 10 THEN 'Multiple slow queries detected - review needed'
      ELSE 'Slow query count is acceptable'
    END;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA MONITORAMENTO AUTOMÁTICO
-- =====================================================

-- Função para trigger de monitoramento
CREATE OR REPLACE FUNCTION trigger_performance_monitoring()
RETURNS TRIGGER AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  execution_time NUMERIC;
BEGIN
  start_time := clock_timestamp();
  
  -- Executar operação original
  IF TG_OP = 'INSERT' THEN
    NEW := NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW := NEW;
  ELSIF TG_OP = 'DELETE' THEN
    OLD := OLD;
  END IF;
  
  end_time := clock_timestamp();
  execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  -- Registrar métrica
  PERFORM record_performance_metric(
    'table_' || TG_OP || '_time',
    execution_time,
    'ms',
    TG_TABLE_NAME,
    TG_OP,
    execution_time
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para monitoramento (comentados para não impactar performance)
-- CREATE TRIGGER monitor_rankings_performance
--   AFTER INSERT OR UPDATE OR DELETE ON rankings
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_performance_monitoring();

-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE performance_metrics IS 'Métricas de performance do sistema';
COMMENT ON FUNCTION record_performance_metric(TEXT, NUMERIC, TEXT, TEXT, TEXT, NUMERIC) IS 'Registra métrica de performance';
COMMENT ON FUNCTION monitor_queries() IS 'Monitora performance de queries';
COMMENT ON FUNCTION monitor_tables() IS 'Monitora estatísticas das tabelas';
COMMENT ON FUNCTION monitor_indexes() IS 'Monitora uso de índices';
COMMENT ON FUNCTION generate_performance_report() IS 'Gera relatório de performance';
`;

  console.log('📝 SQL para implementar monitoramento:');
  console.log('='.repeat(80));
  console.log(monitoringSQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run verify:monitoring');
  
  return monitoringSQL;
}

// Executar geração
implementMonitoring().catch(console.error);



