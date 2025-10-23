-- =====================================================
-- MIGRAÇÃO COMPLETA: Separação definitiva de study_sessions
-- =====================================================

-- 1. DROP funções existentes
-- =====================================================
DROP FUNCTION IF EXISTS public.calculate_study_statistics_from_sessions(JSONB);
DROP FUNCTION IF EXISTS public.calculate_study_statistics(UUID);
DROP FUNCTION IF EXISTS public.add_completed_study_session(UUID, JSONB);
DROP FUNCTION IF EXISTS public.user_study_v2_before_save_cleanup();
DROP FUNCTION IF EXISTS public.migrate_completed_sessions_to_study_sessions();

-- 2. FUNÇÃO: Calcular estatísticas de um array de sessões
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_study_statistics_from_sessions(v_sessions JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF v_sessions IS NULL OR jsonb_array_length(v_sessions) = 0 THEN
    RETURN jsonb_build_object(
      'totalHours', 0,
      'totalSessions', 0,
      'questionsAnswered', 0,
      'correctAnswers', 0,
      'wrongAnswers', 0,
      'lastStudyDate', NULL,
      'dailyStats', '{}'::jsonb,
      'weeklyStats', '{}'::jsonb,
      'monthlyStats', '{}'::jsonb,
      'averages', jsonb_build_object('dailyHours', 0, 'weeklyHours', 0, 'monthlyHours', 0),
      'sessionHistory', '[]'::jsonb,
      'subjectStats', '{}'::jsonb,
      'lastUpdated', NOW()::text
    );
  END IF;
  
  RETURN jsonb_build_object(
    'totalHours', COALESCE(SUM((sess->>'duration_minutes')::numeric) / 60.0, 0),
    'totalSessions', COUNT(*),
    'questionsAnswered', COALESCE(SUM((sess->>'questions')::integer), 0),
    'correctAnswers', COALESCE(SUM((sess->>'correct_answers')::integer), 0),
    'wrongAnswers', COALESCE(
      SUM(COALESCE((sess->>'questions')::integer, 0)) - 
      SUM(COALESCE((sess->>'correct_answers')::integer, 0)), 0
    ),
    'lastStudyDate', MAX(sess->>'date'),
    'dailyStats', '{}'::jsonb,
    'weeklyStats', '{}'::jsonb,
    'monthlyStats', '{}'::jsonb,
    'averages', jsonb_build_object('dailyHours', 0, 'weeklyHours', 0, 'monthlyHours', 0),
    'sessionHistory', '[]'::jsonb,
    'subjectStats', '{}'::jsonb,
    'lastUpdated', NOW()::text
  )
  FROM jsonb_array_elements(v_sessions) AS sess;
END;
$$;

-- 3. FUNÇÃO: Calcular estatísticas para um usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_study_statistics(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions JSONB;
BEGIN
  SELECT study_sessions INTO v_sessions
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  RETURN public.calculate_study_statistics_from_sessions(v_sessions);
END;
$$;

-- 4. FUNÇÃO: Adicionar sessão completada (com normalização de chaves)
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
  
  -- Normalizar chaves (aceitar variações)
  v_new_session := jsonb_build_object(
    'id', COALESCE(session_data->>'id', gen_random_uuid()::text),
    'date', COALESCE(session_data->>'date', session_data->>'session_date', CURRENT_DATE::text),
    'duration_minutes', COALESCE((session_data->>'duration_minutes')::numeric, (session_data->>'duration')::numeric, 0),
    'questions', COALESCE((session_data->>'questions')::integer, (session_data->>'total_questions')::integer, 0),
    'correct_answers', COALESCE((session_data->>'correct_answers')::integer, (session_data->>'total_correct')::integer, (session_data->>'total_correct_answers')::integer, 0),
    'notes', session_data->>'notes',
    'schedule_session_id', session_data->>'schedule_session_id',
    'session_link', session_data->>'session_link',
    'discipline_name', session_data->>'discipline_name',
    'study_type', session_data->>'study_type',
    'course_name', session_data->>'course_name',
    'created_at', COALESCE(session_data->>'created_at', NOW()::text)
  );
  
  -- Adicionar à lista
  v_current_sessions := COALESCE(v_current_sessions, '[]'::jsonb) || jsonb_build_array(v_new_session);
  
  -- Atualizar banco
  UPDATE user_study_v2 SET
    study_sessions = v_current_sessions,
    study_statistics = public.calculate_study_statistics_from_sessions(v_current_sessions),
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object('success', true, 'session_id', v_new_session->>'id');
END;
$$;

-- 5. FUNÇÃO: Limpeza automática antes de salvar (TRIGGER)
-- =====================================================
CREATE OR REPLACE FUNCTION public.user_study_v2_before_save_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extracted_sessions JSONB;
  v_cleaned_cycles JSONB;
BEGIN
  -- Extrair completed_sessions de study_cycles
  SELECT jsonb_agg(v_sess)
  INTO v_extracted_sessions
  FROM (
    SELECT jsonb_build_object(
      'id', gen_random_uuid()::text,
      'date', comp_sess->>'date',
      'duration_minutes', (comp_sess->>'duration_minutes')::numeric,
      'questions', (comp_sess->>'questions')::integer,
      'correct_answers', (comp_sess->>'correct_answers')::integer,
      'notes', comp_sess->>'notes',
      'schedule_session_id', sess->>'id',
      'discipline_name', sess->>'discipline_name',
      'study_type', comp_sess->>'study_type',
      'course_name', comp_sess->>'course_name',
      'created_at', COALESCE(comp_sess->>'created_at', NOW()::text)
    ) AS v_sess
    FROM jsonb_array_elements(NEW.study_cycles) AS cyc,
         jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd,
         jsonb_array_elements(wd->'sessions') AS sess,
         jsonb_array_elements(sess->'completed_sessions') AS comp_sess
  ) extracted;
  
  -- Se encontrou sessões, adicionar ao study_sessions
  IF v_extracted_sessions IS NOT NULL AND jsonb_array_length(v_extracted_sessions) > 0 THEN
    NEW.study_sessions := COALESCE(NEW.study_sessions, '[]'::jsonb) || v_extracted_sessions;
  END IF;
  
  -- Limpar completed_sessions dos cycles
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
              SELECT jsonb_agg(sess - 'completed_sessions')
              FROM jsonb_array_elements(wd->'sessions') AS sess
            )
          )
        )
        FROM jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd
      )
    )
  )
  INTO v_cleaned_cycles
  FROM jsonb_array_elements(NEW.study_cycles) AS cyc;
  
  IF v_cleaned_cycles IS NOT NULL THEN
    NEW.study_cycles := v_cleaned_cycles;
  END IF;
  
  -- Recalcular estatísticas
  NEW.study_statistics := public.calculate_study_statistics_from_sessions(NEW.study_sessions);
  
  RETURN NEW;
END;
$$;

-- 6. CRIAR TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS trg_user_study_v2_cleanup ON user_study_v2;

CREATE TRIGGER trg_user_study_v2_cleanup
  BEFORE INSERT OR UPDATE ON user_study_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.user_study_v2_before_save_cleanup();

-- 7. FUNÇÃO: Migração global (backfill)
-- =====================================================
CREATE OR REPLACE FUNCTION public.migrate_completed_sessions_to_study_sessions()
RETURNS TABLE(user_id UUID, sessions_extracted INTEGER, cycles_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_result RECORD;
BEGIN
  FOR v_user IN 
    SELECT us.user_id
    FROM user_study_v2 us
  LOOP
    -- Forçar UPDATE para disparar o trigger
    UPDATE user_study_v2 
    SET updated_at = NOW()
    WHERE user_study_v2.user_id = v_user.user_id;
    
    -- Retornar estatísticas
    SELECT 
      v_user.user_id,
      jsonb_array_length(COALESCE(study_sessions, '[]'::jsonb)),
      jsonb_array_length(COALESCE(study_cycles, '[]'::jsonb))
    INTO v_result
    FROM user_study_v2
    WHERE user_study_v2.user_id = v_user.user_id;
    
    user_id := v_result.user_id;
    sessions_extracted := COALESCE(v_result.jsonb_array_length, 0);
    cycles_count := COALESCE(v_result.jsonb_array_length, 0);
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 8. ATUALIZAR get_user_study_data
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

-- 9. ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_study_v2_cycles ON user_study_v2 USING GIN (study_cycles);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_sessions ON user_study_v2 USING GIN (study_sessions);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_schedule ON user_study_v2 USING GIN (study_schedule);
CREATE INDEX IF NOT EXISTS idx_user_study_v2_user_id ON user_study_v2 (user_id);

-- 10. EXECUTAR MIGRAÇÃO
-- =====================================================
SELECT * FROM public.migrate_completed_sessions_to_study_sessions();

-- 11. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  user_id,
  jsonb_array_length(COALESCE(study_sessions, '[]'::jsonb)) as sessions_count,
  jsonb_array_length(COALESCE(study_cycles, '[]'::jsonb)) as cycles_count,
  (study_statistics->>'totalHours')::numeric as total_hours,
  (study_statistics->>'totalSessions')::integer as total_sessions_stat,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(study_cycles) AS cyc,
         jsonb_array_elements(cyc->'schedule_data'->'weekly_schedule') AS wd,
         jsonb_array_elements(wd->'sessions') AS sess
    WHERE sess ? 'completed_sessions'
  ) as remaining_completed_sessions_keys
FROM user_study_v2
ORDER BY user_id;
