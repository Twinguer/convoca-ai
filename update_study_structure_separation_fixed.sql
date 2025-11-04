-- =====================================================
-- MIGRAÇÃO: Separação de JSONB (study_sessions)
-- Corrige erro de ambiguidade + garante SECURITY DEFINER
-- =====================================================

-- 1. FUNÇÃO: Calcular estatísticas de study_sessions
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_study_statistics(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions JSONB;
  v_stats JSONB;
BEGIN
  SELECT study_sessions INTO v_sessions
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  IF v_sessions IS NULL OR jsonb_array_length(v_sessions) = 0 THEN
    RETURN jsonb_build_object(
      'totalHours', 0,
      'totalSessions', 0,
      'questionsAnswered', 0,
      'correctAnswers', 0,
      'wrongAnswers', 0,
      'lastStudyDate', NULL
    );
  END IF;
  
  SELECT jsonb_build_object(
    'totalHours', COALESCE(SUM((sess->>'duration_minutes')::numeric) / 60.0, 0),
    'totalSessions', COUNT(*),
    'questionsAnswered', COALESCE(SUM((sess->>'questions')::integer), 0),
    'correctAnswers', COALESCE(SUM((sess->>'correct_answers')::integer), 0),
    'wrongAnswers', COALESCE(
      SUM((sess->>'questions')::integer) - SUM((sess->>'correct_answers')::integer),
      0
    ),
    'lastStudyDate', MAX(sess->>'date')
  ) INTO v_stats
  FROM jsonb_array_elements(v_sessions) AS sess;
  
  RETURN v_stats;
END;
$$;

-- 2. FUNÇÃO: Migração global - Extrai completed_sessions
-- =====================================================
CREATE OR REPLACE FUNCTION public.migrate_completed_sessions_to_study_sessions()
RETURNS TABLE(user_id UUID, sessions_extracted INTEGER, cycles_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_all_sessions JSONB;
  v_cleaned_cycles JSONB;
BEGIN
  FOR v_user IN 
    SELECT us.user_id, us.study_cycles
    FROM user_study_v2 us
    WHERE us.study_cycles IS NOT NULL 
      AND jsonb_array_length(us.study_cycles) > 0
  LOOP
    -- Extrair todas as completed_sessions
    SELECT jsonb_agg(v_sess)
    INTO v_all_sessions
    FROM (
      SELECT jsonb_build_object(
        'id', gen_random_uuid()::text,
        'date', comp_sess->>'date',
        'duration_minutes', (comp_sess->>'duration_minutes')::numeric,
        'questions', (comp_sess->>'questions')::integer,
        'correct_answers', (comp_sess->>'correct_answers')::integer,
        'notes', comp_sess->>'notes',
        'schedule_session_id', v_sess->>'id',
        'discipline_name', v_sess->>'discipline_name',
        'created_at', COALESCE(comp_sess->>'date', NOW()::text)
      ) AS v_sess
      FROM jsonb_array_elements(v_user.study_cycles) AS cyc,
           jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd,
           jsonb_array_elements(wd->'sessions') AS v_sess,
           jsonb_array_elements(v_sess->'completed_sessions') AS comp_sess
    ) extracted;
    
    -- Limpar study_cycles removendo completed_sessions
    SELECT jsonb_agg(
      jsonb_set(
        cyc,
        '{schedule_data,weekly_schedule}',
        (
          SELECT jsonb_agg(
            jsonb_set(
              wd,
              '{sessions}',
              (
                SELECT jsonb_agg(v_sess - 'completed_sessions')
                FROM jsonb_array_elements(wd->'sessions') AS v_sess
              )
            )
          )
          FROM jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd
        )
      )
    )
    INTO v_cleaned_cycles
    FROM jsonb_array_elements(v_user.study_cycles) AS cyc;
    
    -- Atualizar user_study_v2
    UPDATE user_study_v2 SET
      study_sessions = COALESCE(v_all_sessions, '[]'::jsonb),
      study_cycles = COALESCE(v_cleaned_cycles, '[]'::jsonb),
      study_statistics = public.calculate_study_statistics(v_user.user_id),
      updated_at = NOW()
    WHERE user_study_v2.user_id = v_user.user_id;
    
    -- Retornar resultado
    user_id := v_user.user_id;
    sessions_extracted := COALESCE(jsonb_array_length(v_all_sessions), 0);
    cycles_count := COALESCE(jsonb_array_length(v_cleaned_cycles), 0);
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 3. FUNÇÃO: Adicionar nova sessão completada (RPC para frontend)
-- =====================================================
CREATE OR REPLACE FUNCTION public.add_completed_study_session(
  user_uuid UUID,
  session_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_sessions JSONB;
  v_new_session JSONB;
BEGIN
  -- Buscar sessões atuais
  SELECT study_sessions INTO v_current_sessions
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  -- Garantir que session_data tem ID
  v_new_session := session_data;
  IF v_new_session->>'id' IS NULL THEN
    v_new_session := jsonb_set(v_new_session, '{id}', to_jsonb(gen_random_uuid()::text));
  END IF;
  
  -- Adicionar created_at se não existir
  IF v_new_session->>'created_at' IS NULL THEN
    v_new_session := jsonb_set(v_new_session, '{created_at}', to_jsonb(NOW()::text));
  END IF;
  
  -- Adicionar à lista
  v_current_sessions := COALESCE(v_current_sessions, '[]'::jsonb) || jsonb_build_array(v_new_session);
  
  -- Atualizar banco
  UPDATE user_study_v2 SET
    study_sessions = v_current_sessions,
    study_statistics = public.calculate_study_statistics(user_uuid),
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object('success', true, 'session_id', v_new_session->>'id');
END;
$$;

-- 4. ATUALIZAR get_user_study_data (caso ainda não esteja separado)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_study_data(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE user_study_v2.user_id = user_uuid;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 5. CRIAR/VERIFICAR ÍNDICES GIN
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_study_v2_cycles ON user_study_v2 USING GIN (study_cycles);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_sessions ON user_study_v2 USING GIN (study_sessions);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_schedule ON user_study_v2 USING GIN (study_schedule);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_user_id ON user_study_v2 (user_id);

-- =====================================================
-- EXECUTAR MIGRAÇÃO AUTOMÁTICA
-- =====================================================
SELECT * FROM public.migrate_completed_sessions_to_study_sessions();

-- =====================================================
-- VERIFICAÇÃO: Checar se completed_sessions foi removido
-- =====================================================
SELECT 
  user_id,
  jsonb_array_length(study_sessions) as total_sessions,
  jsonb_array_length(study_cycles) as total_cycles,
  study_statistics->>'totalHours' as total_hours,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(study_cycles) AS cyc,
         jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd,
         jsonb_array_elements(wd->'sessions') AS sess
    WHERE sess ? 'completed_sessions'
  ) as remaining_completed_sessions_keys
FROM user_study_v2
WHERE user_id = '34d22725-d158-4d75-9089-efd049a1fb98';
