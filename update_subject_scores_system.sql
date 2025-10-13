-- =====================================================
-- SCRIPT: Atualizar sistema para usar subject_scores
-- OBJETIVO: Implementar sistema unificado de pontuações subjetivas
-- DATA: 2025-01-15
-- =====================================================

-- 1. Atualizar função save_user_answers_consolidated_by_concurso para aceitar subject_scores
CREATE OR REPLACE FUNCTION public.save_user_answers_consolidated_by_concurso(
    p_ranking_id uuid,
    p_concurso_id uuid,
    p_booklet_id text,
    p_answers jsonb,
    p_subject_scores jsonb DEFAULT '{}'::jsonb,
    p_discursive_score numeric DEFAULT 0,
    p_case_study_1_score numeric DEFAULT 0,
    p_case_study_2_score numeric DEFAULT 0,
    p_case_study_3_score numeric DEFAULT 0,
    p_current_edit_count integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_discursive_weight numeric;
    v_case_study_1_weight numeric;
    v_case_study_2_weight numeric;
    v_case_study_3_weight numeric;
    v_consolidated_data jsonb;
    v_user_data jsonb;
    v_answers_data jsonb;
    v_subjective_scores jsonb;
    v_edit_count integer;
    v_total_score numeric := 0;
    v_result jsonb;
    v_key text;
    v_value jsonb;
BEGIN
    -- Log início
    RAISE NOTICE 'Starting save_user_answers_consolidated_by_concurso for ranking %', p_ranking_id;
    
    -- Obter dados do usuário e concurso
    SELECT 
        ur.user_id,
        c.discursive_weight,
        c.case_study_1_weight,
        c.case_study_2_weight,
        c.case_study_3_weight,
        ur.edit_count
    INTO v_user_id, v_discursive_weight, v_case_study_1_weight, v_case_study_2_weight, v_case_study_3_weight, v_edit_count
    FROM user_rankings ur
    JOIN concursos c ON c.id = ur.concurso_id
    WHERE ur.id = p_ranking_id;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ranking não encontrado');
    END IF;
    
    -- Incrementar contador de edições
    v_edit_count := COALESCE(v_edit_count, 0) + 1;
    
    -- Preparar dados de respostas
    v_answers_data := jsonb_build_object(
        'answers', p_answers,
        'metadata', jsonb_build_object(
            'booklet_id', p_booklet_id,
            'saved_at', now(),
            'edit_count', v_edit_count
        )
    );
    
    -- Preparar pontuações subjetivas (usar subject_scores se disponível, senão usar campos individuais)
    v_subjective_scores := jsonb_build_object(
        'discursive', COALESCE((p_subject_scores->>'discursive')::numeric, p_discursive_score),
        'case_study_1', COALESCE((p_subject_scores->>'case1')::numeric, p_case_study_1_score),
        'case_study_2', COALESCE((p_subject_scores->>'case2')::numeric, p_case_study_2_score),
        'case_study_3', COALESCE((p_subject_scores->>'case3')::numeric, p_case_study_3_score)
    );
    
    -- Adicionar disciplinas customizadas do subject_scores
    IF p_subject_scores IS NOT NULL AND p_subject_scores != '{}'::jsonb THEN
        FOR v_key, v_value IN SELECT * FROM jsonb_each(p_subject_scores)
        LOOP
            IF v_key NOT IN ('discursive', 'case1', 'case2', 'case3') THEN
                v_subjective_scores := jsonb_set(v_subjective_scores, ARRAY[v_key], v_value);
            END IF;
        END LOOP;
    END IF;
    
    -- Preparar dados do usuário
    v_user_data := jsonb_build_object(
        'user_id', v_user_id,
        'answers', v_answers_data,
        'subjective_scores', v_subjective_scores,
        'metadata', jsonb_build_object(
            'last_updated', now(),
            'edit_count', v_edit_count,
            'version', '2.0'
        )
    );
    
    -- Buscar dados consolidados existentes
    SELECT consolidated_data INTO v_consolidated_data
    FROM consolidated_answers_by_concurso
    WHERE concurso_id = p_concurso_id;
    
    -- Se não existir, criar estrutura inicial
    IF v_consolidated_data IS NULL THEN
        v_consolidated_data := jsonb_build_object(
            'concurso_id', p_concurso_id,
            'users', jsonb_build_object(),
            'metadata', jsonb_build_object(
                'created_at', now(),
                'last_updated', now(),
                'total_users', 0
            )
        );
    END IF;
    
    -- Atualizar dados do usuário específico
    v_consolidated_data := jsonb_set(
        v_consolidated_data,
        ARRAY['users', v_user_id::text],
        v_user_data
    );
    
    -- Atualizar metadados
    v_consolidated_data := jsonb_set(
        v_consolidated_data,
        ARRAY['metadata', 'last_updated'],
        to_jsonb(now())
    );
    
    -- Salvar dados consolidados
    INSERT INTO consolidated_answers_by_concurso (concurso_id, consolidated_data)
    VALUES (p_concurso_id, v_consolidated_data)
    ON CONFLICT (concurso_id) 
    DO UPDATE SET 
        consolidated_data = v_consolidated_data,
        updated_at = now();
    
    -- Atualizar user_rankings com pontuações individuais e subject_scores
    UPDATE user_rankings
    SET 
        discursive_score = COALESCE((p_subject_scores->>'discursive')::numeric, p_discursive_score),
        case_study_1_score = COALESCE((p_subject_scores->>'case1')::numeric, p_case_study_1_score),
        case_study_2_score = COALESCE((p_subject_scores->>'case2')::numeric, p_case_study_2_score),
        case_study_3_score = COALESCE((p_subject_scores->>'case3')::numeric, p_case_study_3_score),
        subject_scores = p_subject_scores,
        edit_count = v_edit_count,
        updated_at = now()
    WHERE id = p_ranking_id;
    
    -- Calcular pontuação total usando a função existente
    PERFORM calculate_user_score_realtime(p_ranking_id);
    
    -- Buscar pontuação total calculada
    SELECT score INTO v_total_score
    FROM user_rankings
    WHERE id = p_ranking_id;
    
    -- Preparar resultado
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Respostas salvas com sucesso',
        'edit_count', v_edit_count,
        'booklet_key', p_booklet_id,
        'answers_saved', jsonb_array_length(jsonb_object_keys(p_answers)),
        'total_score', v_total_score,
        'subject_scores', v_subjective_scores,
        'saved_answers', p_answers
    );
    
    RAISE NOTICE 'Successfully saved answers for ranking % with total score %', p_ranking_id, v_total_score;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in save_user_answers_consolidated_by_concurso: %', SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Erro ao salvar respostas'
        );
END;
$function$;

-- 2. Atualizar função calculate_user_score_realtime para usar subject_scores
CREATE OR REPLACE FUNCTION public.calculate_user_score_realtime(p_ranking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total_score NUMERIC := 0;
  v_concurso_id UUID;
  v_user_id UUID;
  v_selected_booklet TEXT;
  v_consolidated_selected TEXT;
  v_concurso RECORD;
  v_basic_score NUMERIC := 0;
  v_specific1_score NUMERIC := 0;
  v_specific2_score NUMERIC := 0;
  v_specific3_score NUMERIC := 0;
  v_discursive_score NUMERIC := 0;
  v_case_study1_score NUMERIC := 0;
  v_case_study2_score NUMERIC := 0;
  v_case_study3_score NUMERIC := 0;
  v_subject_scores JSONB := '{}'::jsonb;
  v_weighted_subject_scores JSONB := '{}'::jsonb;
  v_has_custom_knowledge BOOLEAN := FALSE;
  v_disciplines JSONB;
  v_consolidated_data JSONB;
  v_user_answers JSONB;
  v_official_answers JSONB;
  v_exam_type TEXT;
  v_wrong_answer_penalty NUMERIC := 0;

  v_block JSONB;
  v_discipline JSONB;
  v_discipline_type TEXT;
  v_discipline_weight NUMERIC;
  v_discipline_score NUMERIC;
  v_custom_discipline_scores JSONB := '{}'::jsonb;
  v_weighted_custom_discipline_scores JSONB := '{}'::jsonb;

  v_question_num TEXT;
  v_official_answer_data JSONB;
  v_user_answer TEXT;
  v_correct_answer TEXT;
  v_section_type TEXT;
  v_weight NUMERIC;
  v_is_nullified BOOLEAN;
  v_points_if_wrong NUMERIC;
  v_question_type TEXT;
BEGIN
  -- Get ranking and concurso data
  SELECT
    ur.concurso_id,
    ur.user_id,
    ur.selected_booklet::text,
    ur.subject_scores,
    c.has_custom_knowledge,
    c.disciplines,
    c.exam_type,
    COALESCE(c.wrong_answer_penalty, 0),
    c.discursive_weight,
    c.case_study_1_weight,
    c.case_study_2_weight,
    c.case_study_3_weight
  INTO
    v_concurso_id,
    v_user_id,
    v_selected_booklet,
    v_subject_scores,
    v_has_custom_knowledge,
    v_disciplines,
    v_exam_type,
    v_wrong_answer_penalty,
    v_concurso.discursive_weight,
    v_concurso.case_study_1_weight,
    v_concurso.case_study_2_weight,
    v_concurso.case_study_3_weight
  FROM user_rankings ur
  JOIN concursos c ON c.id = ur.concurso_id
  WHERE ur.id = p_ranking_id;

  IF v_concurso_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Extract subjective scores from subject_scores JSONB
  v_discursive_score := COALESCE((v_subject_scores->>'discursive')::numeric, 0);
  v_case_study1_score := COALESCE((v_subject_scores->>'case1')::numeric, 0);
  v_case_study2_score := COALESCE((v_subject_scores->>'case2')::numeric, 0);
  v_case_study3_score := COALESCE((v_subject_scores->>'case3')::numeric, 0);

  -- Get consolidated data
  SELECT consolidated_data INTO v_consolidated_data
  FROM consolidated_answers_by_concurso
  WHERE concurso_id = v_concurso_id;

  IF v_consolidated_data IS NULL THEN
    RETURN 0;
  END IF;

  -- Get user answers from consolidated data
  v_user_answers := v_consolidated_data->'users'->v_user_id::text->'answers'->'answers';

  -- Get official answers
  SELECT official_answers INTO v_official_answers
  FROM concursos
  WHERE id = v_concurso_id;

  IF v_official_answers IS NULL THEN
    RETURN 0;
  END IF;

  -- Get selected booklet from consolidated data (preferred) or user_rankings
  v_consolidated_selected := v_consolidated_data->'users'->v_user_id::text->'answers'->'metadata'->>'booklet_id';
  IF v_consolidated_selected IS NOT NULL THEN
    v_selected_booklet := v_consolidated_selected;
  END IF;

  -- Get official answers for selected booklet
  v_official_answers := v_official_answers->v_selected_booklet->'questions';

  IF v_has_custom_knowledge AND v_disciplines IS NOT NULL THEN
    -- Custom knowledge structure (hierarchical)
    FOR v_block IN SELECT * FROM jsonb_array_elements(v_disciplines)
    LOOP
      IF v_block->>'isEnabled' = 'true' AND v_block->'disciplines' IS NOT NULL THEN
        FOR v_discipline IN SELECT * FROM jsonb_array_elements(v_block->'disciplines')
        LOOP
          IF v_discipline->>'isEnabled' = 'true' THEN
            v_discipline_type := v_discipline->>'type';
            v_discipline_weight := COALESCE((v_discipline->>'weight')::numeric, 1);
            v_discipline_score := 0;

            -- Calculate score for this discipline
            FOR v_question_num IN SELECT key FROM jsonb_object_keys(v_official_answers) AS key
            LOOP
              v_official_answer_data := v_official_answers->v_question_num;
              v_section_type := v_official_answer_data->>'section_type';
              
              IF v_section_type = v_discipline_type THEN
                v_user_answer := v_user_answers->>v_question_num;
                v_correct_answer := v_official_answer_data->>'correct_answer';
                v_weight := COALESCE((v_official_answer_data->>'weight')::numeric, 1);
                v_is_nullified := COALESCE((v_official_answer_data->>'is_nullified')::boolean, false);
                v_question_type := v_official_answer_data->>'question_type';

                IF v_user_answer IS NOT NULL AND NOT v_is_nullified THEN
                  IF v_exam_type = 'Certo ou Errado' THEN
                    -- Certo ou Errado: +weight if correct, -weight if wrong
                    IF v_user_answer = v_correct_answer THEN
                      v_discipline_score := v_discipline_score + v_weight;
                    ELSE
                      v_discipline_score := v_discipline_score - v_weight;
                    END IF;
                  ELSE
                    -- Multiple choice: +weight if correct, -penalty if wrong
                    IF v_user_answer = v_correct_answer THEN
                      v_discipline_score := v_discipline_score + v_weight;
                    ELSE
                      v_discipline_score := v_discipline_score - COALESCE(v_wrong_answer_penalty, 0);
                    END IF;
                  END IF;
                END IF;
              END IF;
            END LOOP;

            -- Store discipline score
            v_custom_discipline_scores := jsonb_set(
              v_custom_discipline_scores,
              ARRAY[v_discipline_type],
              to_jsonb(v_discipline_score)
            );

            -- Store weighted discipline score
            v_weighted_custom_discipline_scores := jsonb_set(
              v_weighted_custom_discipline_scores,
              ARRAY[v_discipline_type],
              to_jsonb(v_discipline_score * v_discipline_weight)
            );

            -- Add to total score
            v_total_score := v_total_score + (v_discipline_score * v_discipline_weight);
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    -- Add subjective scores
    v_total_score := v_total_score +
      (v_discursive_score * COALESCE(v_concurso.discursive_weight, 1)) +
      (v_case_study1_score * COALESCE(v_concurso.case_study_1_weight, 1)) +
      (v_case_study2_score * COALESCE(v_concurso.case_study_2_weight, 1)) +
      (v_case_study3_score * COALESCE(v_concurso.case_study_3_weight, 1));

    -- Update ranking
    UPDATE user_rankings
    SET
      score = v_total_score,
      subject_scores = v_subject_scores,
      "customDisciplineScores" = v_custom_discipline_scores,
      "weightedCustomDisciplineScores" = v_weighted_custom_discipline_scores,
      basic_knowledge_score = 0,
      specific_knowledge_1_score = 0,
      specific_knowledge_2_score = 0,
      specific_knowledge_3_score = 0,
      specific_knowledge_score = 0,
      weighted_basic_score = 0,
      weighted_specific_1_score = 0,
      weighted_specific_2_score = 0,
      weighted_specific_3_score = 0,
      weighted_discursive_score = v_discursive_score * COALESCE(v_concurso.discursive_weight, 1),
      weighted_case_study_1_score = v_case_study1_score * COALESCE(v_concurso.case_study_1_weight, 1),
      weighted_case_study_2_score = v_case_study2_score * COALESCE(v_concurso.case_study_2_weight, 1),
      weighted_case_study_3_score = v_case_study3_score * COALESCE(v_concurso.case_study_3_weight, 1),
      is_score_recalculated = true,
      updated_at = now()
    WHERE id = p_ranking_id;

  ELSE
    -- Legacy (non-custom) structure
    FOR v_question_num IN SELECT key FROM jsonb_object_keys(v_official_answers) AS key
    LOOP
      v_official_answer_data := v_official_answers->v_question_num;
      v_correct_answer := v_official_answer_data->>'correct_answer';
      v_section_type := v_official_answer_data->>'section_type';
      v_weight := COALESCE((v_official_answer_data->>'weight')::numeric, 1);
      v_is_nullified := COALESCE((v_official_answer_data->>'is_nullified')::boolean, false);
      v_question_type := v_official_answer_data->>'question_type';
      v_user_answer := v_user_answers->>v_question_num;

      IF v_user_answer IS NOT NULL AND NOT v_is_nullified THEN
        IF v_exam_type = 'Certo ou Errado' THEN
          -- Certo ou Errado: +weight if correct, -weight if wrong
          IF v_user_answer = v_correct_answer THEN
            v_total_score := v_total_score + v_weight;
          ELSE
            v_total_score := v_total_score - v_weight;
          END IF;
        ELSE
          -- Multiple choice: +weight if correct, -penalty if wrong
          IF v_user_answer = v_correct_answer THEN
            v_total_score := v_total_score + v_weight;
          ELSE
            v_total_score := v_total_score - COALESCE(v_wrong_answer_penalty, 0);
          END IF;
        END IF;

        -- Add to section scores
        CASE v_section_type
          WHEN 'basic_knowledge' THEN
            v_basic_score := v_basic_score + v_weight;
          WHEN 'specific_knowledge_1' THEN
            v_specific1_score := v_specific1_score + v_weight;
          WHEN 'specific_knowledge_2' THEN
            v_specific2_score := v_specific2_score + v_weight;
          WHEN 'specific_knowledge_3' THEN
            v_specific3_score := v_specific3_score + v_weight;
        END CASE;
      END IF;
    END LOOP;

    -- Add subjective scores
    v_total_score := v_total_score +
      (v_discursive_score * COALESCE(v_concurso.discursive_weight, 1)) +
      (v_case_study1_score * COALESCE(v_concurso.case_study_1_weight, 1)) +
      (v_case_study2_score * COALESCE(v_concurso.case_study_2_weight, 1)) +
      (v_case_study3_score * COALESCE(v_concurso.case_study_3_weight, 1));

    -- Update subject_scores with objective scores
    v_subject_scores := jsonb_set(v_subject_scores, ARRAY['basic'], to_jsonb(v_basic_score));
    v_subject_scores := jsonb_set(v_subject_scores, ARRAY['specific1'], to_jsonb(v_specific1_score));
    v_subject_scores := jsonb_set(v_subject_scores, ARRAY['specific2'], to_jsonb(v_specific2_score));
    v_subject_scores := jsonb_set(v_subject_scores, ARRAY['specific3'], to_jsonb(v_specific3_score));

    UPDATE user_rankings
    SET
      score = v_total_score,
      basic_knowledge_score = v_basic_score,
      specific_knowledge_1_score = v_specific1_score,
      specific_knowledge_2_score = v_specific2_score,
      specific_knowledge_3_score = v_specific3_score,
      specific_knowledge_score = v_specific1_score + v_specific2_score + v_specific3_score,
      weighted_basic_score = v_basic_score * COALESCE(v_concurso.basic_knowledge_weight, 1),
      weighted_specific_1_score = v_specific1_score * COALESCE(v_concurso.specific_knowledge_1_weight, 1),
      weighted_specific_2_score = v_specific2_score * COALESCE(v_concurso.specific_knowledge_2_weight, 1),
      weighted_specific_3_score = v_specific3_score * COALESCE(v_concurso.specific_knowledge_3_weight, 1),
      weighted_discursive_score = v_discursive_score * COALESCE(v_concurso.discursive_weight, 1),
      weighted_case_study_1_score = v_case_study1_score * COALESCE(v_concurso.case_study_1_weight, 1),
      weighted_case_study_2_score = v_case_study2_score * COALESCE(v_concurso.case_study_2_weight, 1),
      weighted_case_study_3_score = v_case_study3_score * COALESCE(v_concurso.case_study_3_weight, 1),
      subject_scores = v_subject_scores,
      "customDisciplineScores" = '{}'::jsonb,
      "weightedCustomDisciplineScores" = '{}'::jsonb,
      is_score_recalculated = true,
      updated_at = now()
    WHERE id = p_ranking_id;

  END IF;

  RETURN v_total_score;
END;
$$;

-- 3. Comentário final
-- =====================================================
-- SISTEMA ATUALIZADO COM SUCESSO!
-- 
-- O que foi implementado:
-- 1. ✅ Função save_user_answers_consolidated_by_concurso agora aceita p_subject_scores
-- 2. ✅ Função calculate_user_score_realtime agora usa subject_scores JSONB
-- 3. ✅ Sistema unificado de pontuações subjetivas
-- 4. ✅ Suporte a disciplinas customizadas no subject_scores
-- 5. ✅ Compatibilidade com sistema anterior (campos individuais)
-- 
-- Próximos passos:
-- 1. Testar criação de ranking com subject_scores
-- 2. Testar preenchimento de pontuações na nova aba
-- 3. Verificar exibição na tabela de classificação
-- =====================================================
