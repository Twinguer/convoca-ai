-- =====================================================
-- ATUALIZAÇÃO DAS FUNÇÕES RPC PARA user_study_v2
-- =====================================================
-- Este arquivo deve ser executado no SQL Editor do Supabase
-- para atualizar as funções que ainda apontam para user_study

-- 1. ATUALIZAR get_user_study_data() para ler de user_study_v2
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_study_data(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'study_sessions', COALESCE(study_sessions, '[]'::jsonb),
    'study_cycles', COALESCE(study_cycles, '[]'::jsonb),
    'study_statistics', COALESCE(study_statistics, '{}'::jsonb),
    'study_schedule', COALESCE(study_schedule, '[]'::jsonb),
    -- Expandir study_metadata
    'study_plans', COALESCE(study_metadata->'study_plans', '[]'::jsonb),
    'study_subjects', COALESCE(study_metadata->'study_subjects', '[]'::jsonb),
    'study_goals', COALESCE(study_metadata->'study_goals', '[]'::jsonb),
    'study_goals_tracking', COALESCE(study_metadata->'study_goals_tracking', '{}'::jsonb),
    'study_progress', COALESCE(study_metadata->'study_progress', '[]'::jsonb),
    'study_reminders', COALESCE(study_metadata->'study_reminders', '[]'::jsonb),
    'spaced_repetition_queue', COALESCE(study_metadata->'spaced_repetition_queue', '[]'::jsonb),
    'user_study_days', COALESCE(study_metadata->'user_study_days', '[]'::jsonb),
    'study_contests', COALESCE(study_metadata->'study_contests', '[]'::jsonb),
    'last_activity_date', last_activity_date,
    'total_sessions_count', jsonb_array_length(COALESCE(study_sessions, '[]'::jsonb)),
    'total_schedule_count', jsonb_array_length(COALESCE(study_schedule, '[]'::jsonb)),
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATUALIZAR safe_upsert_user_study_data() para salvar em user_study_v2
-- =====================================================
CREATE OR REPLACE FUNCTION safe_upsert_user_study_data(user_uuid UUID, study_data JSONB)
RETURNS JSONB AS $$
DECLARE
  existing_record_id UUID;
  result JSONB;
  new_metadata JSONB;
BEGIN
  -- Construir study_metadata a partir dos campos enviados
  new_metadata := jsonb_build_object(
    'study_plans', COALESCE(study_data->'study_plans', '[]'::jsonb),
    'study_subjects', COALESCE(study_data->'study_subjects', '[]'::jsonb),
    'study_goals', COALESCE(study_data->'study_goals', '[]'::jsonb),
    'study_goals_tracking', COALESCE(study_data->'study_goals_tracking', '{}'::jsonb),
    'study_progress', COALESCE(study_data->'study_progress', '[]'::jsonb),
    'study_reminders', COALESCE(study_data->'study_reminders', '[]'::jsonb),
    'spaced_repetition_queue', COALESCE(study_data->'spaced_repetition_queue', '[]'::jsonb),
    'user_study_days', COALESCE(study_data->'user_study_days', '[]'::jsonb),
    'study_contests', COALESCE(study_data->'study_contests', '[]'::jsonb)
  );

  -- Verificar se registro já existe
  SELECT id INTO existing_record_id
  FROM user_study_v2
  WHERE user_id = user_uuid
  LIMIT 1;
  
  IF existing_record_id IS NOT NULL THEN
    -- Atualizar registro existente
    UPDATE user_study_v2 SET
      study_sessions = COALESCE(study_data->'study_sessions', study_sessions),
      study_cycles = COALESCE(study_data->'study_cycles', study_cycles),
      study_statistics = COALESCE(study_data->'study_statistics', study_statistics),
      study_schedule = COALESCE(study_data->'study_schedule', study_schedule),
      study_metadata = study_metadata || new_metadata,
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = existing_record_id;
    
    result := jsonb_build_object('success', true, 'action', 'updated', 'id', existing_record_id);
  ELSE
    -- Criar novo registro
    INSERT INTO user_study_v2 (
      user_id,
      study_sessions,
      study_cycles,
      study_statistics,
      study_schedule,
      study_metadata,
      last_activity_date
    ) VALUES (
      user_uuid,
      COALESCE(study_data->'study_sessions', '[]'::jsonb),
      COALESCE(study_data->'study_cycles', '[]'::jsonb),
      COALESCE(study_data->'study_statistics', '{}'::jsonb),
      COALESCE(study_data->'study_schedule', '[]'::jsonb),
      new_metadata,
      CURRENT_DATE
    ) RETURNING id INTO existing_record_id;
    
    result := jsonb_build_object('success', true, 'action', 'created', 'id', existing_record_id);
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR upsert_study_cycle() - Função otimizada para adicionar/atualizar ciclo
-- =====================================================
CREATE OR REPLACE FUNCTION upsert_study_cycle(
  user_uuid UUID,
  cycle_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  current_cycles JSONB;
  updated_cycles JSONB;
  cycle_id TEXT;
  cycle_exists BOOLEAN;
BEGIN
  -- Buscar ciclos atuais
  SELECT study_cycles INTO current_cycles
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  -- Se não existe registro, criar
  IF current_cycles IS NULL THEN
    INSERT INTO user_study_v2 (user_id, study_cycles, last_activity_date)
    VALUES (user_uuid, jsonb_build_array(cycle_data), CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      study_cycles = jsonb_build_array(cycle_data),
      updated_at = now();
    RETURN jsonb_build_object('success', true, 'action', 'created');
  END IF;
  
  -- Verificar se ciclo já existe (pelo id)
  cycle_id := cycle_data->>'id';
  cycle_exists := EXISTS (
    SELECT 1 FROM jsonb_array_elements(current_cycles) AS cycle 
    WHERE cycle->>'id' = cycle_id
  );
  
  IF cycle_exists THEN
    -- Atualizar ciclo existente
    updated_cycles := (
      SELECT jsonb_agg(
        CASE 
          WHEN cycle->>'id' = cycle_id THEN cycle_data
          ELSE cycle
        END
      )
      FROM jsonb_array_elements(current_cycles) AS cycle
    );
  ELSE
    -- Adicionar novo ciclo
    updated_cycles := current_cycles || jsonb_build_array(cycle_data);
  END IF;
  
  -- Salvar ciclos atualizados
  UPDATE user_study_v2 SET
    study_cycles = updated_cycles,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object('success', true, 'action', CASE WHEN cycle_exists THEN 'updated' ELSE 'added' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR remove_study_cycle() - Função otimizada para remover ciclo
-- =====================================================
CREATE OR REPLACE FUNCTION remove_study_cycle(
  user_uuid UUID,
  cycle_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  updated_cycles JSONB;
BEGIN
  SELECT jsonb_agg(cycle)
  INTO updated_cycles
  FROM jsonb_array_elements((SELECT study_cycles FROM user_study_v2 WHERE user_id = user_uuid)) AS cycle
  WHERE cycle->>'id' != cycle_id;
  
  UPDATE user_study_v2 SET
    study_cycles = COALESCE(updated_cycles, '[]'::jsonb),
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object('success', true, 'action', 'removed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR ÍNDICES GIN para otimizar buscas em JSONB
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_study_v2_cycles ON user_study_v2 USING GIN (study_cycles);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_sessions ON user_study_v2 USING GIN (study_sessions);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_schedule ON user_study_v2 USING GIN (study_schedule);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_user_id ON user_study_v2 (user_id);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
-- Execute este arquivo completo no SQL Editor do Supabase
-- Após a execução:
-- 1. Verificar se as funções foram criadas sem erros
-- 2. Testar criação de ciclo no frontend
-- 3. Verificar persistência dos dados em user_study_v2.study_cycles
