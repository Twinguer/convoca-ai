
-- Corrigir completamente a função para salvar as pontuações customizadas

CREATE OR REPLACE FUNCTION public.recalculate_all_scores_with_weights(p_concurso_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  r RECORD;
  a RECORD;
  u RECORD;
  updated_count INTEGER := 0;
  v_concurso RECORD;
  v_minimum_score_type TEXT;

  -- Variables for score calculation
  v_raw_scores JSONB;
  v_weighted_scores JSONB;
  v_subjective_scores JSONB;

  -- For logging
  v_log_id UUID;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
BEGIN
  v_start_time := now();

  -- Obter informações do concurso PRIMEIRO
  SELECT 
    minimum_score_type, 
    has_custom_knowledge,
    basic_knowledge_weight,
    specific_knowledge_1_weight,
    specific_knowledge_2_weight,
    specific_knowledge_3_weight,
    discursive_weight,
    case_study_1_weight,
    case_study_2_weight,
    case_study_3_weight,
    disciplines
  INTO v_concurso
  FROM concursos
  WHERE id = p_concurso_id::uuid;

  -- Verificar se o concurso existe
  IF v_concurso IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Concurso não encontrado');
  END IF;

  -- Extrair minimum_score_type para uso posterior
  v_minimum_score_type := v_concurso.minimum_score_type;

  -- Log function start
  INSERT INTO score_calculation_logs (
    calculation_type,
    calculation_details
  ) VALUES (
    'batch_recalculate_with_weights_start',
    jsonb_build_object(
      'concurso_id', p_concurso_id,
      'minimum_score_type', v_minimum_score_type,
      'has_custom_knowledge', v_concurso.has_custom_knowledge,
      'timestamp', NOW()
    )
  ) RETURNING id INTO v_log_id;

  -- Check if we have an answer key with weights for this concurso
  PERFORM 1 FROM official_answer_weights WHERE concurso_id = p_concurso_id::uuid LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO score_calculation_logs (
      calculation_type,
      calculation_details
    ) VALUES (
      'batch_recalculate_error',
      jsonb_build_object(
        'concurso_id', p_concurso_id,
        'error', 'Gabarito com pesos não encontrado',
        'timestamp', NOW()
      )
    );

    RETURN jsonb_build_object('success', FALSE, 'error', 'Gabarito com pesos não encontrado');
  END IF;

  -- Log how many rankings we're about to process
  SELECT COUNT(*) INTO updated_count
  FROM user_rankings
  WHERE concurso_id = p_concurso_id::uuid;

  -- Log the count
  INSERT INTO score_calculation_logs (
    calculation_type,
    calculation_details
  ) VALUES (
    'batch_recalculate_info',
    jsonb_build_object(
      'concurso_id', p_concurso_id,
      'rankings_count', updated_count,
      'timestamp', NOW()
    )
  );

  -- Reset counter for actual updates
  updated_count := 0;

  -- For each user ranking
  FOR u IN
    SELECT id, user_id, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score
    FROM user_rankings
    WHERE concurso_id = p_concurso_id::uuid
  LOOP
    -- Log processing this user ranking
    INSERT INTO score_calculation_logs (
      user_ranking_id,
      calculation_type,
      calculation_details
    ) VALUES (
      u.id,
      'batch_recalculate_processing_with_weights',
      jsonb_build_object(
        'ranking_id', u.id,
        'user_id', u.user_id,
        'minimum_score_type', v_minimum_score_type,
        'has_custom_knowledge', v_concurso.has_custom_knowledge,
        'timestamp', NOW()
      )
    );

    -- Initialize JSON objects for scores
    v_raw_scores := jsonb_build_object(
      'basicKnowledgeScore', 0,
      'specific1Score', 0,
      'specific2Score', 0,
      'specific3Score', 0,
      'specificKnowledgeScore', 0
    );

    v_weighted_scores := jsonb_build_object(
      'weightedBasicScore', 0,
      'weightedSpecific1Score', 0,
      'weightedSpecific2Score', 0,
      'weightedSpecific3Score', 0,
      'weightedDiscursiveScore', 0,
      'weightedCaseStudy1Score', 0,
      'weightedCaseStudy2Score', 0,
      'weightedCaseStudy3Score', 0,
      'totalScore', 0
    );

    v_subjective_scores := jsonb_build_object(
      'discursiveScore', COALESCE(u.discursive_score, 0),
      'caseStudy1Score', COALESCE(u.case_study_1_score, 0),
      'caseStudy2Score', COALESCE(u.case_study_2_score, 0),
      'caseStudy3Score', COALESCE(u.case_study_3_score, 0)
    );

    -- Check if we're using custom disciplines
    IF v_concurso.has_custom_knowledge IS TRUE AND v_concurso.disciplines IS NOT NULL AND jsonb_array_length(v_concurso.disciplines) > 0 THEN
      -- Handle custom disciplines scoring
      DECLARE
        v_discipline JSONB;
        v_discipline_type TEXT;
        v_discipline_name TEXT;
        v_discipline_weight NUMERIC;
        v_discipline_score NUMERIC;
        v_custom_discipline_scores JSONB := '{}'::jsonb;
        v_weighted_custom_discipline_scores JSONB := '{}'::jsonb;
        v_total_score NUMERIC := 0;
      BEGIN
        -- For each custom discipline
        FOR v_discipline IN SELECT * FROM jsonb_array_elements(v_concurso.disciplines)
        LOOP
          -- Only process if the discipline is enabled
          IF (v_discipline->>'isEnabled')::boolean IS TRUE THEN
            v_discipline_type := v_discipline->>'type';
            v_discipline_name := v_discipline->>'name';
            v_discipline_weight := COALESCE((v_discipline->>'weight')::NUMERIC, 1.0);
            
            -- Skip if no discipline type
            IF v_discipline_type IS NULL THEN
              CONTINUE;
            END IF;
            
            -- Log the discipline being processed
            INSERT INTO score_calculation_logs (
              user_ranking_id,
              calculation_type,
              calculation_details
            ) VALUES (
              u.id,
              'process_custom_discipline',
              jsonb_build_object(
                'discipline_type', v_discipline_type,
                'discipline_name', v_discipline_name,
                'discipline_weight', v_discipline_weight,
                'timestamp', NOW()
              )
            );
            
            -- Calculate score for this discipline
            SELECT
              COALESCE(SUM(
                CASE 
                  WHEN oaw.is_nullified OR UPPER(ua.answer) = UPPER(oaw.correct_answer) 
                  THEN oaw.weight 
                  ELSE 0 
                END
              ), 0) INTO v_discipline_score
            FROM
              user_answers ua
              JOIN official_answer_weights oaw ON
                ua.question_number = oaw.question_number AND
                oaw.concurso_id = p_concurso_id::uuid AND
                oaw.section_type = v_discipline_type
            WHERE
              ua.user_ranking_id = u.id;
            
            -- Log CRÍTICO - Pontuação calculada para a disciplina
            INSERT INTO score_calculation_logs (
              user_ranking_id,
              calculation_type,
              calculation_details
            ) VALUES (
              u.id,
              'raw_discipline_score',
              jsonb_build_object(
                'discipline_type', v_discipline_type,
                'raw_score', v_discipline_score,
                'timestamp', NOW()
              )
            );

            -- Add to custom_discipline_scores
            v_custom_discipline_scores := jsonb_set(
              v_custom_discipline_scores,
              ARRAY[v_discipline_type],
              to_jsonb(v_discipline_score),
              true -- create_if_missing
            );
            
            -- Add weighted score to weighted_custom_discipline_scores
            v_weighted_custom_discipline_scores := jsonb_set(
              v_weighted_custom_discipline_scores,
              ARRAY[v_discipline_type],
              to_jsonb(v_discipline_score * v_discipline_weight),
              true -- create_if_missing
            );
            
            -- Add to total score
            v_total_score := v_total_score + (v_discipline_score * v_discipline_weight);
            
            -- Log the score calculation
            INSERT INTO score_calculation_logs (
              user_ranking_id,
              calculation_type,
              calculation_details
            ) VALUES (
              u.id,
              'discipline_score_calculated',
              jsonb_build_object(
                'discipline_type', v_discipline_type,
                'raw_score', v_discipline_score,
                'weighted_score', v_discipline_score * v_discipline_weight,
                'timestamp', NOW()
              )
            );
          END IF;
        END LOOP;
        
        -- Add subjective scores to total after objective disciplines
        v_total_score := v_total_score +
          (COALESCE(u.discursive_score, 0) * COALESCE(v_concurso.discursive_weight, 1)) +
          (COALESCE(u.case_study_1_score, 0) * COALESCE(v_concurso.case_study_1_weight, 1)) +
          (COALESCE(u.case_study_2_score, 0) * COALESCE(v_concurso.case_study_2_weight, 1)) +
          (COALESCE(u.case_study_3_score, 0) * COALESCE(v_concurso.case_study_3_weight, 1));

        -- Log: Final states before UPDATE
        INSERT INTO score_calculation_logs (
          user_ranking_id,
          calculation_type,
          calculation_details
        ) VALUES (
          u.id,
          'final_jsonb_states_before_update',
          jsonb_build_object(
            'subject_scores', v_custom_discipline_scores,
            'customDisciplineScores', v_custom_discipline_scores,
            'weightedCustomDisciplineScores', v_weighted_custom_discipline_scores,
            'total_score', v_total_score,
            'timestamp', NOW()
          )
        );

        -- CORREÇÃO CRÍTICA: Update user ranking com sintaxe correta para as colunas camelCase
        UPDATE user_rankings
        SET
          score = v_total_score,
          subject_scores = v_custom_discipline_scores,
          "customDisciplineScores" = v_custom_discipline_scores,
          "weightedCustomDisciplineScores" = v_weighted_custom_discipline_scores,
          -- Set traditional score columns to 0 for custom contests
          basic_knowledge_score = 0,
          specific_knowledge_1_score = 0,
          specific_knowledge_2_score = 0,
          specific_knowledge_3_score = 0,
          specific_knowledge_score = 0,
          weighted_basic_score = 0,
          weighted_specific_1_score = 0,
          weighted_specific_2_score = 0,
          weighted_specific_3_score = 0,
          -- Update subjective scores
          discursive_score = COALESCE(u.discursive_score, 0),
          case_study_1_score = COALESCE(u.case_study_1_score, 0),
          case_study_2_score = COALESCE(u.case_study_2_score, 0),
          case_study_3_score = COALESCE(u.case_study_3_score, 0),
          -- Update weighted subjective scores
          weighted_discursive_score = COALESCE(u.discursive_score, 0) * COALESCE(v_concurso.discursive_weight, 1),
          weighted_case_study_1_score = COALESCE(u.case_study_1_score, 0) * COALESCE(v_concurso.case_study_1_weight, 1),
          weighted_case_study_2_score = COALESCE(u.case_study_2_score, 0) * COALESCE(v_concurso.case_study_2_weight, 1),
          weighted_case_study_3_score = COALESCE(u.case_study_3_score, 0) * COALESCE(v_concurso.case_study_3_weight, 1),
          is_score_recalculated = true,
          updated_at = now()
        WHERE id = u.id;

        -- Log Final de Update (Custom)
        INSERT INTO score_calculation_logs (
          user_ranking_id,
          calculation_type,
          new_score,
          calculation_details
        ) VALUES (
          u.id,
          'update_custom_ranking_finished',
          v_total_score,
          jsonb_build_object(
            'message', 'User Ranking Updated (Custom)',
            'ranking_id', u.id,
            'final_saved_score', v_total_score,
            'timestamp', NOW()
          )
        );
      END;
    ELSE
      -- Traditional approach (non-custom disciplines)
      FOR a IN
        SELECT
          ua.question_number,
          ua.answer as user_answer,
          oaw.correct_answer,
          oaw.weight,
          oaw.is_nullified,
          oaw.section_type
        FROM
          user_answers ua
          JOIN official_answer_weights oaw ON
            ua.question_number = oaw.question_number AND
            oaw.concurso_id = p_concurso_id::uuid
        WHERE
          ua.user_ranking_id = u.id
      LOOP
        -- Add to score if answer is correct or question is nullified
        IF a.is_nullified OR UPPER(a.user_answer) = UPPER(a.correct_answer) THEN
          IF a.section_type = 'basic' THEN
            v_raw_scores := jsonb_set(v_raw_scores, '{basicKnowledgeScore}',
              (COALESCE((v_raw_scores->>'basicKnowledgeScore')::numeric, 0) + a.weight)::text::jsonb);
          ELSIF a.section_type = 'specific1' THEN
            v_raw_scores := jsonb_set(v_raw_scores, '{specific1Score}',
              (COALESCE((v_raw_scores->>'specific1Score')::numeric, 0) + a.weight)::text::jsonb);
            v_raw_scores := jsonb_set(v_raw_scores, '{specificKnowledgeScore}',
              (COALESCE((v_raw_scores->>'specificKnowledgeScore')::numeric, 0) + a.weight)::text::jsonb);
          ELSIF a.section_type = 'specific2' THEN
            v_raw_scores := jsonb_set(v_raw_scores, '{specific2Score}',
              (COALESCE((v_raw_scores->>'specific2Score')::numeric, 0) + a.weight)::text::jsonb);
            v_raw_scores := jsonb_set(v_raw_scores, '{specificKnowledgeScore}',
              (COALESCE((v_raw_scores->>'specificKnowledgeScore')::numeric, 0) + a.weight)::text::jsonb);
          ELSIF a.section_type = 'specific3' THEN
            v_raw_scores := jsonb_set(v_raw_scores, '{specific3Score}',
              (COALESCE((v_raw_scores->>'specific3Score')::numeric, 0) + a.weight)::text::jsonb);
            v_raw_scores := jsonb_set(v_raw_scores, '{specificKnowledgeScore}',
              (COALESCE((v_raw_scores->>'specificKnowledgeScore')::numeric, 0) + a.weight)::text::jsonb);
          END IF;
        END IF;
      END LOOP;

      -- Calculate weighted scores
      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedBasicScore}',
        ((v_raw_scores->>'basicKnowledgeScore')::numeric * COALESCE(v_concurso.basic_knowledge_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedSpecific1Score}',
        ((v_raw_scores->>'specific1Score')::numeric * COALESCE(v_concurso.specific_knowledge_1_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedSpecific2Score}',
        ((v_raw_scores->>'specific2Score')::numeric * COALESCE(v_concurso.specific_knowledge_2_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedSpecific3Score}',
        ((v_raw_scores->>'specific3Score')::numeric * COALESCE(v_concurso.specific_knowledge_3_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedDiscursiveScore}',
        ((v_subjective_scores->>'discursiveScore')::numeric * COALESCE(v_concurso.discursive_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedCaseStudy1Score}',
        ((v_subjective_scores->>'caseStudy1Score')::numeric * COALESCE(v_concurso.case_study_1_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedCaseStudy2Score}',
        ((v_subjective_scores->>'caseStudy2Score')::numeric * COALESCE(v_concurso.case_study_2_weight, 1))::text::jsonb);

      v_weighted_scores := jsonb_set(v_weighted_scores, '{weightedCaseStudy3Score}',
        ((v_subjective_scores->>'caseStudy3Score')::numeric * COALESCE(v_concurso.case_study_3_weight, 1))::text::jsonb);

      -- Calculate total score
      v_weighted_scores := jsonb_set(v_weighted_scores, '{totalScore}',
        (
          (v_weighted_scores->>'weightedBasicScore')::numeric +
          (v_weighted_scores->>'weightedSpecific1Score')::numeric +
          (v_weighted_scores->>'weightedSpecific2Score')::numeric +
          (v_weighted_scores->>'weightedSpecific3Score')::numeric +
          (v_weighted_scores->>'weightedDiscursiveScore')::numeric +
          (v_weighted_scores->>'weightedCaseStudy1Score')::numeric +
          (v_weighted_scores->>'weightedCaseStudy2Score')::numeric +
          (v_weighted_scores->>'weightedCaseStudy3Score')::numeric
        )::text::jsonb);

      -- Update ranking scores
      UPDATE user_rankings
      SET
        basic_knowledge_score = (v_raw_scores->>'basicKnowledgeScore')::numeric,
        specific_knowledge_1_score = (v_raw_scores->>'specific1Score')::numeric,
        specific_knowledge_2_score = (v_raw_scores->>'specific2Score')::numeric,
        specific_knowledge_3_score = (v_raw_scores->>'specific3Score')::numeric,
        specific_knowledge_score = (v_raw_scores->>'specificKnowledgeScore')::numeric,
        weighted_basic_score = (v_weighted_scores->>'weightedBasicScore')::numeric,
        weighted_specific_1_score = (v_weighted_scores->>'weightedSpecific1Score')::numeric,
        weighted_specific_2_score = (v_weighted_scores->>'weightedSpecific2Score')::numeric,
        weighted_specific_3_score = (v_weighted_scores->>'weightedSpecific3Score')::numeric,
        weighted_discursive_score = (v_weighted_scores->>'weightedDiscursiveScore')::numeric,
        weighted_case_study_1_score = (v_weighted_scores->>'weightedCaseStudy1Score')::numeric,
        weighted_case_study_2_score = (v_weighted_scores->>'weightedCaseStudy2Score')::numeric,
        weighted_case_study_3_score = (v_weighted_scores->>'weightedCaseStudy3Score')::numeric,
        score = (v_weighted_scores->>'totalScore')::numeric,
        -- Clear custom scores for traditional contests
        "customDisciplineScores" = '{}'::jsonb,
        "weightedCustomDisciplineScores" = '{}'::jsonb,
        updated_at = NOW(),
        is_score_recalculated = TRUE
      WHERE id = u.id;
    END IF;

    updated_count := updated_count + 1;

    -- Log updates
    INSERT INTO score_calculation_logs (
      user_ranking_id,
      calculation_type,
      new_score,
      calculation_details
    ) VALUES (
      u.id,
      'batch_recalculate_with_weights_update',
      (SELECT score FROM user_rankings WHERE id = u.id),
      jsonb_build_object(
        'minimum_score_type', v_minimum_score_type,
        'has_custom_knowledge', v_concurso.has_custom_knowledge,
        'timestamp', NOW()
      )
    );
  END LOOP;

  v_end_time := now();

  -- Update the log with final results
  INSERT INTO score_calculation_logs (
    calculation_type,
    calculation_details
  ) VALUES (
    'batch_recalculate_with_weights_complete',
    jsonb_build_object(
      'concurso_id', p_concurso_id,
      'updated_count', updated_count,
      'execution_time_ms', EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000,
      'timestamp', NOW()
    )
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'updatedCount', updated_count,
    'executionTimeMs', EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000
  );
END;
$function$
