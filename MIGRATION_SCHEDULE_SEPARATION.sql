-- ============================================
-- MIGRATION: Separação de study_cycles e study_schedule
-- ============================================
-- 
-- Este arquivo contém as migrations SQL necessárias para implementar
-- a separação entre study_cycles e study_schedule na tabela user_study_v2.
--
-- IMPORTANTE: Execute manualmente no Supabase SQL Editor
--
-- Ordem de execução:
-- 1. extract_sessions_to_schedule() - Fase 1: Extração
-- 2. Testar aplicação frontend
-- 3. cleanup_cycle_weekly_schedule() - Fase 3: Limpeza (apenas após confirmação)
-- 4. Validar com validate_schedule_migration()
-- ============================================

-- ============================================
-- FASE 1: Extração de Sessões
-- ============================================

CREATE OR REPLACE FUNCTION extract_sessions_to_schedule()
RETURNS TABLE (
  users_migrated INTEGER,
  total_sessions_extracted INTEGER,
  errors_count INTEGER
) AS $$
DECLARE
  v_user_record RECORD;
  v_cycle JSONB;
  v_weekly_schedule JSONB;
  v_new_schedule JSONB := '[]'::jsonb;
  v_session JSONB;
  v_day JSONB;
  v_users_count INTEGER := 0;
  v_sessions_count INTEGER := 0;
  v_errors_count INTEGER := 0;
BEGIN
  -- Para cada usuário
  FOR v_user_record IN 
    SELECT user_id, study_cycles, study_schedule 
    FROM user_study_v2
    WHERE study_cycles IS NOT NULL 
      AND jsonb_array_length(study_cycles) > 0
  LOOP
    BEGIN
      v_new_schedule := COALESCE(v_user_record.study_schedule, '[]'::jsonb);
      
      -- Para cada ciclo do usuário
      FOR v_cycle IN 
        SELECT * FROM jsonb_array_elements(v_user_record.study_cycles)
      LOOP
        -- Extrair weekly_schedule do ciclo
        v_weekly_schedule := v_cycle->'schedule_data'->'weekly_schedule';
        
        IF v_weekly_schedule IS NOT NULL AND jsonb_array_length(v_weekly_schedule) > 0 THEN
          -- Para cada dia da semana
          FOR v_day IN 
            SELECT * FROM jsonb_array_elements(v_weekly_schedule)
          LOOP
            -- Para cada sessão do dia, adicionar cycle_id
            IF v_day->'sessions' IS NOT NULL THEN
              FOR v_session IN 
                SELECT * FROM jsonb_array_elements(v_day->'sessions')
              LOOP
                -- Adicionar cycle_id e day_of_week à sessão
                v_session := jsonb_set(
                  v_session,
                  '{cycle_id}',
                  to_jsonb(v_cycle->>'id')
                );
                
                v_session := jsonb_set(
                  v_session,
                  '{day_of_week}',
                  v_day->'day'
                );
                
                -- Adicionar à nova estrutura de schedule
                v_new_schedule := v_new_schedule || jsonb_build_array(v_session);
                v_sessions_count := v_sessions_count + 1;
              END LOOP;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
      
      -- Atualizar study_schedule (sem remover de study_cycles ainda)
      UPDATE user_study_v2
      SET study_schedule = v_new_schedule,
          updated_at = now()
      WHERE user_id = v_user_record.user_id;
      
      v_users_count := v_users_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors_count := v_errors_count + 1;
      RAISE NOTICE 'Error migrating user %: %', v_user_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_users_count, v_sessions_count, v_errors_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION extract_sessions_to_schedule() IS 
  'Phase 1: Extract weekly_schedule from study_cycles to study_schedule with cycle_id reference';

-- Executar Fase 1
SELECT * FROM extract_sessions_to_schedule();

-- ============================================
-- FASE 3: Limpeza (Executar APENAS após testes!)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_cycle_weekly_schedule()
RETURNS TABLE (
  users_cleaned INTEGER,
  cycles_updated INTEGER
) AS $$
DECLARE
  v_user_record RECORD;
  v_updated_cycles JSONB;
  v_users_count INTEGER := 0;
  v_cycles_count INTEGER := 0;
BEGIN
  FOR v_user_record IN 
    SELECT user_id, study_cycles 
    FROM user_study_v2
    WHERE study_cycles IS NOT NULL
      AND EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(study_cycles) AS cycle
        WHERE cycle->'schedule_data'->'weekly_schedule' IS NOT NULL
      )
  LOOP
    -- Remover weekly_schedule de cada ciclo
    v_updated_cycles := (
      SELECT jsonb_agg(
        jsonb_set(
          cycle,
          '{schedule_data}',
          (cycle->'schedule_data') - 'weekly_schedule'
        )
      )
      FROM jsonb_array_elements(v_user_record.study_cycles) AS cycle
    );
    
    -- Contar ciclos atualizados
    v_cycles_count := v_cycles_count + jsonb_array_length(v_updated_cycles);
    
    UPDATE user_study_v2
    SET study_cycles = v_updated_cycles,
        updated_at = now()
    WHERE user_id = v_user_record.user_id;
    
    v_users_count := v_users_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT v_users_count, v_cycles_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_cycle_weekly_schedule() IS 
  'Phase 3: Remove weekly_schedule from study_cycles.schedule_data after successful migration to study_schedule';

-- NÃO executar automaticamente - esperar confirmação após testes
-- SELECT * FROM cleanup_cycle_weekly_schedule();

-- ============================================
-- FASE 4: Otimizações
-- ============================================

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_study_v2_study_schedule 
ON user_study_v2 USING GIN (study_schedule);

CREATE INDEX IF NOT EXISTS idx_user_study_v2_study_cycles 
ON user_study_v2 USING GIN (study_cycles);

CREATE INDEX IF NOT EXISTS idx_user_study_v2_study_sessions 
ON user_study_v2 USING GIN (study_sessions);

-- Função otimizada para buscar sessões do cronograma
CREATE OR REPLACE FUNCTION get_schedule_sessions(
  p_user_id UUID,
  p_cycle_id TEXT DEFAULT NULL,
  p_day_of_week INTEGER DEFAULT NULL
)
RETURNS TABLE (
  session_id TEXT,
  schedule_session_id TEXT,
  cycle_id TEXT,
  day_of_week INTEGER,
  start_time TEXT,
  end_time TEXT,
  discipline_name TEXT,
  block_name TEXT,
  session_link TEXT,
  study_plan_id TEXT,
  subject_id TEXT,
  total_stats JSONB,
  created_at TEXT,
  updated_at TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s->>'id' AS session_id,
    s->>'schedule_session_id' AS schedule_session_id,
    s->>'cycle_id' AS cycle_id,
    (s->>'day_of_week')::INTEGER AS day_of_week,
    s->>'start_time' AS start_time,
    s->>'end_time' AS end_time,
    s->>'discipline_name' AS discipline_name,
    s->>'block_name' AS block_name,
    s->>'session_link' AS session_link,
    s->>'study_plan_id' AS study_plan_id,
    s->>'subject_id' AS subject_id,
    s->'total_stats' AS total_stats,
    s->>'created_at' AS created_at,
    s->>'updated_at' AS updated_at
  FROM user_study_v2,
       jsonb_array_elements(study_schedule) AS s
  WHERE user_id = p_user_id
    AND (p_cycle_id IS NULL OR s->>'cycle_id' = p_cycle_id)
    AND (p_day_of_week IS NULL OR (s->>'day_of_week')::INTEGER = p_day_of_week);
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para buscar sessões agrupadas por dia
CREATE OR REPLACE FUNCTION get_schedule_by_week(
  p_user_id UUID,
  p_cycle_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  day_of_week INTEGER,
  sessions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (s->>'day_of_week')::INTEGER AS day_of_week,
    jsonb_agg(s ORDER BY s->>'start_time') AS sessions
  FROM user_study_v2,
       jsonb_array_elements(study_schedule) AS s
  WHERE user_id = p_user_id
    AND (p_cycle_id IS NULL OR s->>'cycle_id' = p_cycle_id)
  GROUP BY (s->>'day_of_week')::INTEGER
  ORDER BY day_of_week;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para validação de migração
CREATE OR REPLACE FUNCTION validate_schedule_migration()
RETURNS TABLE (
  metric TEXT,
  value INTEGER
) AS $$
BEGIN
  -- Total de usuários
  RETURN QUERY
  SELECT 'total_users'::TEXT, COUNT(*)::INTEGER
  FROM user_study_v2;
  
  -- Usuários com study_schedule
  RETURN QUERY
  SELECT 'users_with_schedule'::TEXT, COUNT(*)::INTEGER
  FROM user_study_v2 
  WHERE study_schedule IS NOT NULL 
    AND jsonb_array_length(study_schedule) > 0;
  
  -- Usuários com legacy weekly_schedule
  RETURN QUERY
  SELECT 'users_with_legacy'::TEXT, COUNT(*)::INTEGER
  FROM user_study_v2
  WHERE EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(study_cycles) AS cycle
    WHERE cycle->'schedule_data'->'weekly_schedule' IS NOT NULL
      AND jsonb_array_length(cycle->'schedule_data'->'weekly_schedule') > 0
  );
  
  -- Total de sessões em study_schedule
  RETURN QUERY
  SELECT 'total_sessions_in_schedule'::TEXT, 
         COALESCE(SUM(jsonb_array_length(study_schedule)), 0)::INTEGER
  FROM user_study_v2
  WHERE study_schedule IS NOT NULL;
  
  -- Total de sessões em legacy weekly_schedule
  RETURN QUERY
  SELECT 'total_sessions_in_legacy'::TEXT,
         COALESCE(SUM(
           (SELECT SUM(jsonb_array_length(day->'sessions'))
            FROM jsonb_array_elements(cycle->'schedule_data'->'weekly_schedule') AS day)
         ), 0)::INTEGER
  FROM user_study_v2,
       jsonb_array_elements(study_cycles) AS cycle
  WHERE cycle->'schedule_data'->'weekly_schedule' IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON FUNCTION get_schedule_sessions(UUID, TEXT, INTEGER) IS 
  'Retrieve schedule sessions with optional filtering by cycle_id and day_of_week';

COMMENT ON FUNCTION get_schedule_by_week(UUID, TEXT) IS 
  'Retrieve schedule sessions grouped by day of week';

COMMENT ON FUNCTION validate_schedule_migration() IS 
  'Validate the migration from study_cycles.weekly_schedule to study_schedule';

-- Executar validação
SELECT * FROM validate_schedule_migration();

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
--
-- 1. Execute a Fase 1 (extract_sessions_to_schedule)
--    SELECT * FROM extract_sessions_to_schedule();
--
-- 2. Deploy do código frontend atualizado
--
-- 3. Teste completamente a aplicação (criar sessões, editar, remover)
--
-- 4. Valide os dados
--    SELECT * FROM validate_schedule_migration();
--
-- 5. APENAS após confirmação, execute a Fase 3 (cleanup)
--    SELECT * FROM cleanup_cycle_weekly_schedule();
--
-- 6. Valide novamente
--    SELECT * FROM validate_schedule_migration();
--
-- ============================================
