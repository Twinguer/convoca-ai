-- =====================================================
-- SEPARAÇÃO DE COLUNAS JSONB NO user_study_v2
-- =====================================================
-- Execute este arquivo completo no SQL Editor do Supabase
-- para separar completed_sessions de study_cycles

-- 1. FUNÇÃO: Extrair sessões completadas dos ciclos
-- =====================================================
CREATE OR REPLACE FUNCTION migrate_completed_sessions_to_study_sessions()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  cycle JSONB;
  day_schedule JSONB;
  session JSONB;
  completed_session JSONB;
  all_sessions JSONB;
  cleaned_cycles JSONB;
BEGIN
  FOR user_record IN 
    SELECT user_id, study_cycles 
    FROM user_study_v2 
    WHERE study_cycles IS NOT NULL
  LOOP
    all_sessions := '[]'::jsonb;
    cleaned_cycles := '[]'::jsonb;
    
    FOR cycle IN 
      SELECT * FROM jsonb_array_elements(user_record.study_cycles)
    LOOP
      DECLARE
        cleaned_cycle JSONB;
        cleaned_schedule JSONB;
      BEGIN
        cleaned_schedule := '[]'::jsonb;
        
        FOR day_schedule IN 
          SELECT * FROM jsonb_array_elements(cycle->'schedule_data'->'weekly_schedule')
        LOOP
          DECLARE
            cleaned_day JSONB;
            cleaned_day_sessions JSONB;
          BEGIN
            cleaned_day_sessions := '[]'::jsonb;
            
            FOR session IN 
              SELECT * FROM jsonb_array_elements(day_schedule->'sessions')
            LOOP
              IF session ? 'completed_sessions' THEN
                FOR completed_session IN 
                  SELECT * FROM jsonb_array_elements(session->'completed_sessions')
                LOOP
                  all_sessions := all_sessions || jsonb_build_array(
                    jsonb_build_object(
                      'id', COALESCE(completed_session->>'id', gen_random_uuid()::text),
                      'session_date', completed_session->>'date',
                      'duration_minutes', COALESCE((completed_session->>'duration_minutes')::int, 0),
                      'study_type', COALESCE(completed_session->>'study_type', 'timer'),
                      'discipline_name', session->>'discipline_name',
                      'block_name', session->>'block_name',
                      'course_name', completed_session->>'course_name',
                      'total_questions', COALESCE((completed_session->>'questions')::int, 0),
                      'total_correct_answers', COALESCE((completed_session->>'correct_answers')::int, 0),
                      'notes', completed_session->>'notes',
                      'session_link', session->>'session_link',
                      'schedule_session_id', session->>'id',
                      'cycle_id', cycle->>'id',
                      'created_at', COALESCE(completed_session->>'created_at', now()::text)
                    )
                  );
                END LOOP;
              END IF;
              
              cleaned_day_sessions := cleaned_day_sessions || jsonb_build_array(
                jsonb_build_object(
                  'id', session->>'id',
                  'start_time', session->>'start_time',
                  'end_time', session->>'end_time',
                  'discipline_name', session->>'discipline_name',
                  'block_name', session->>'block_name',
                  'session_link', session->>'session_link',
                  'total_stats', session->'total_stats'
                )
              );
            END LOOP;
            
            cleaned_day := jsonb_build_object(
              'day', day_schedule->>'day',
              'sessions', cleaned_day_sessions
            );
            cleaned_schedule := cleaned_schedule || jsonb_build_array(cleaned_day);
          END;
        END LOOP;
        
        cleaned_cycle := jsonb_build_object(
          'id', cycle->>'id',
          'cycle_name', cycle->>'cycle_name',
          'exam_date', cycle->>'exam_date',
          'organ', cycle->>'organ',
          'position', cycle->>'position',
          'edital_link', cycle->>'edital_link',
          'curso_link', cycle->>'curso_link',
          'video_link', cycle->>'video_link',
          'is_active', COALESCE((cycle->>'is_active')::boolean, true),
          'created_at', cycle->>'created_at',
          'updated_at', cycle->>'updated_at',
          'schedule_data', jsonb_build_object(
            'weekly_schedule', cleaned_schedule,
            'metadata', cycle->'schedule_data'->'metadata',
            'available_blocks', cycle->'schedule_data'->'available_blocks',
            'available_disciplines', cycle->'schedule_data'->'available_disciplines'
          )
        );
        
        cleaned_cycles := cleaned_cycles || jsonb_build_array(cleaned_cycle);
      END;
    END LOOP;
    
    UPDATE user_study_v2 SET
      study_sessions = all_sessions,
      study_cycles = cleaned_cycles,
      updated_at = now()
    WHERE user_id = user_record.user_id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. FUNÇÃO: Calcular estatísticas
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_study_statistics(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  sessions JSONB;
  stats JSONB;
BEGIN
  SELECT study_sessions INTO sessions
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  IF sessions IS NULL OR jsonb_array_length(sessions) = 0 THEN
    RETURN jsonb_build_object(
      'totalHours', 0,
      'totalSessions', 0,
      'questionsAnswered', 0,
      'correctAnswers', 0,
      'wrongAnswers', 0,
      'currentStreak', 0,
      'longestStreak', 0,
      'lastStudyDate', NULL,
      'dailyStats', '{}'::jsonb,
      'subjectStats', '{}'::jsonb,
      'weeklyStats', '{}'::jsonb,
      'sessionHistory', '[]'::jsonb,
      'averages', jsonb_build_object(
        'dailyHours', 0,
        'weeklyHours', 0,
        'accuracy', 0
      ),
      'lastUpdated', now()::text
    );
  END IF;
  
  SELECT jsonb_build_object(
    'totalHours', COALESCE(SUM((elem->>'duration_minutes')::numeric) / 60, 0),
    'totalSessions', jsonb_array_length(sessions),
    'questionsAnswered', COALESCE(SUM((elem->>'total_questions')::numeric), 0),
    'correctAnswers', COALESCE(SUM((elem->>'total_correct_answers')::numeric), 0),
    'wrongAnswers', COALESCE(
      SUM((elem->>'total_questions')::numeric) - SUM((elem->>'total_correct_answers')::numeric), 
      0
    ),
    'lastStudyDate', MAX(elem->>'session_date'),
    'lastUpdated', now()::text
  ) INTO stats
  FROM jsonb_array_elements(sessions) AS elem;
  
  stats := stats || jsonb_build_object(
    'currentStreak', 0,
    'longestStreak', 0,
    'dailyStats', '{}'::jsonb,
    'subjectStats', '{}'::jsonb,
    'weeklyStats', '{}'::jsonb,
    'sessionHistory', sessions,
    'averages', jsonb_build_object(
      'dailyHours', COALESCE((stats->>'totalHours')::numeric / GREATEST(jsonb_array_length(sessions), 1), 0),
      'weeklyHours', 0,
      'accuracy', CASE 
        WHEN (stats->>'questionsAnswered')::numeric > 0 
        THEN ((stats->>'correctAnswers')::numeric / (stats->>'questionsAnswered')::numeric) * 100
        ELSE 0 
      END
    )
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO: Adicionar sessão completada
-- =====================================================
CREATE OR REPLACE FUNCTION add_completed_study_session(
  user_uuid UUID,
  session_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  current_sessions JSONB;
  updated_sessions JSONB;
  new_stats JSONB;
BEGIN
  SELECT study_sessions INTO current_sessions
  FROM user_study_v2
  WHERE user_id = user_uuid;
  
  IF current_sessions IS NULL THEN
    current_sessions := '[]'::jsonb;
  END IF;
  
  updated_sessions := current_sessions || jsonb_build_array(
    jsonb_build_object(
      'id', COALESCE(session_data->>'id', gen_random_uuid()::text),
      'session_date', COALESCE(session_data->>'session_date', CURRENT_DATE::text),
      'duration_minutes', (session_data->>'duration_minutes')::int,
      'study_type', COALESCE(session_data->>'study_type', 'timer'),
      'discipline_name', session_data->>'discipline_name',
      'block_name', session_data->>'block_name',
      'course_name', session_data->>'course_name',
      'total_questions', COALESCE((session_data->>'total_questions')::int, 0),
      'total_correct_answers', COALESCE((session_data->>'total_correct_answers')::int, 0),
      'notes', session_data->>'notes',
      'session_link', session_data->>'session_link',
      'schedule_session_id', session_data->>'schedule_session_id',
      'cycle_id', session_data->>'cycle_id',
      'created_at', COALESCE(session_data->>'created_at', now()::text)
    )
  );
  
  new_stats := calculate_study_statistics(user_uuid);
  
  UPDATE user_study_v2 SET
    study_sessions = updated_sessions,
    study_statistics = new_stats,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN jsonb_build_object(
    'success', true,
    'session_count', jsonb_array_length(updated_sessions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATUALIZAR get_user_study_data
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

-- 5. ATUALIZAR safe_upsert_user_study_data
-- =====================================================
CREATE OR REPLACE FUNCTION safe_upsert_user_study_data(user_uuid UUID, study_data JSONB)
RETURNS JSONB AS $$
DECLARE
  existing_record_id UUID;
  result JSONB;
  new_metadata JSONB;
BEGIN
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

  SELECT id INTO existing_record_id
  FROM user_study_v2
  WHERE user_id = user_uuid
  LIMIT 1;
  
  IF existing_record_id IS NOT NULL THEN
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

-- =====================================================
-- EXECUTAR MIGRAÇÃO (descomentar para rodar)
-- =====================================================
-- SELECT migrate_completed_sessions_to_study_sessions();

-- Atualizar estatísticas de todos os usuários
-- UPDATE user_study_v2 SET
--   study_statistics = calculate_study_statistics(user_id),
--   updated_at = now();
