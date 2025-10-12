
-- Função para gerenciar cadernos de prova via JSONB
CREATE OR REPLACE FUNCTION public.manage_exam_booklets(
  p_operation text,
  p_concurso_id uuid DEFAULT NULL,
  p_booklet_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_display_order integer DEFAULT NULL,
  p_booklets jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_exam_booklets jsonb;
BEGIN
  CASE p_operation
    WHEN 'GET' THEN
      -- Buscar cadernos de um concurso do JSONB
      SELECT exam_booklets INTO v_exam_booklets
      FROM concursos
      WHERE id = p_concurso_id;
      
      -- Ordenar por display_order
      v_exam_booklets := (
        SELECT jsonb_agg(booklet ORDER BY (booklet->>'display_order')::int)
        FROM jsonb_array_elements(COALESCE(v_exam_booklets, '[]'::jsonb)) AS booklet
      );
      
      RETURN jsonb_build_object(
        'success', true,
        'booklets', COALESCE(v_exam_booklets, '[]'::jsonb)
      );
      
    WHEN 'CREATE' THEN
      -- Criar novo caderno no JSONB
      SELECT exam_booklets INTO v_exam_booklets
      FROM concursos
      WHERE id = p_concurso_id;
      
      -- Adicionar novo caderno
      v_exam_booklets := COALESCE(v_exam_booklets, '[]'::jsonb) || jsonb_build_object(
        'id', gen_random_uuid(),
        'name', p_name,
        'display_order', COALESCE(p_display_order, 1),
        'is_active', true,
        'total_questions', 0
      );
      
      -- Atualizar na tabela concursos
      UPDATE concursos 
      SET exam_booklets = v_exam_booklets
      WHERE id = p_concurso_id;
      
      RETURN jsonb_build_object('success', true);
      
    WHEN 'UPDATE' THEN
      -- Atualizar caderno no JSONB
      SELECT exam_booklets INTO v_exam_booklets
      FROM concursos
      WHERE id = p_concurso_id;
      
      -- Atualizar caderno específico
      v_exam_booklets := (
        SELECT jsonb_agg(
          CASE 
            WHEN (booklet->>'id')::uuid = p_booklet_id THEN
              booklet || jsonb_build_object(
                'name', COALESCE(p_name, booklet->>'name'),
                'display_order', COALESCE(p_display_order, (booklet->>'display_order')::int)
              )
            ELSE booklet
          END
        )
        FROM jsonb_array_elements(COALESCE(v_exam_booklets, '[]'::jsonb)) AS booklet
      );
      
      -- Atualizar na tabela concursos
      UPDATE concursos 
      SET exam_booklets = v_exam_booklets
      WHERE id = p_concurso_id;
      
      RETURN jsonb_build_object('success', true);
      
    WHEN 'DELETE' THEN
      -- Deletar caderno do JSONB
      SELECT exam_booklets INTO v_exam_booklets
      FROM concursos
      WHERE id = p_concurso_id;
      
      -- Remover caderno específico
      v_exam_booklets := (
        SELECT jsonb_agg(booklet)
        FROM jsonb_array_elements(COALESCE(v_exam_booklets, '[]'::jsonb)) AS booklet
        WHERE (booklet->>'id')::uuid != p_booklet_id
      );
      
      -- Atualizar na tabela concursos
      UPDATE concursos 
      SET exam_booklets = v_exam_booklets
      WHERE id = p_concurso_id;
      
      RETURN jsonb_build_object('success', true);
      
    WHEN 'SAVE_ALL' THEN
      -- Salvar todos os cadernos (usado pelo frontend)
      UPDATE concursos 
      SET exam_booklets = p_booklets
      WHERE id = p_concurso_id;
      
      RETURN jsonb_build_object('success', true);
      
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Operação inválida');
  END CASE;
END;
$$;

-- Função para buscar gabarito por caderno específico
CREATE OR REPLACE FUNCTION public.get_official_answer_weights_by_booklet(
  p_concurso_id uuid,
  p_booklet_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_object_agg(
    'questao' || question_number::text,
    jsonb_build_object(
      'resposta', correct_answer,
      'peso', weight,
      'secao', section_type,
      'anulada', is_nullified
    )
  ) INTO v_result
  FROM official_answer_weights
  WHERE concurso_id = p_concurso_id 
    AND booklet_id = p_booklet_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Função atualizada para calcular pontuação por caderno específico
CREATE OR REPLACE FUNCTION public.calculate_user_score_by_booklet(
    p_ranking_id uuid,
    p_concurso_id uuid,
    p_booklet_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_consolidated_data JSONB;
    v_booklet_key TEXT;
    v_booklet_answers JSONB;
    v_total_score NUMERIC := 0;
    v_concurso RECORD;
    v_discipline_scores JSONB := '{}';
    v_weighted_discipline_scores JSONB := '{}';
    v_answer_key TEXT;
    v_user_answer TEXT;
    v_question_num INTEGER;
    v_weight NUMERIC;
    v_section_type TEXT;
    v_is_nullified BOOLEAN;
    v_is_correct BOOLEAN;
BEGIN
    v_booklet_key := p_booklet_id::text;
    
    -- Buscar dados do concurso
    SELECT * INTO v_concurso
    FROM concursos
    WHERE id = p_concurso_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Concurso não encontrado');
    END IF;
    
    -- Buscar dados consolidados do usuário
    SELECT answers_data INTO v_consolidated_data
    FROM user_answers
    WHERE user_ranking_id = p_ranking_id
    AND question_number IS NULL;
    
    IF v_consolidated_data IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nenhuma resposta encontrada');
    END IF;
    
    -- Extrair respostas do caderno específico
    v_booklet_answers := v_consolidated_data->'booklets'->v_booklet_key->'answers';
    
    IF v_booklet_answers IS NULL THEN
        v_booklet_answers := '{}'::jsonb;
    END IF;
    
    -- Percorrer todas as questões do gabarito oficial para este caderno
    FOR v_question_num, v_answer_key, v_weight, v_section_type, v_is_nullified IN
        SELECT 
            question_number, 
            correct_answer, 
            COALESCE(weight, 1), 
            COALESCE(section_type, 'basic'),
            COALESCE(is_nullified, false)
        FROM official_answer_weights
        WHERE concurso_id = p_concurso_id
        AND (booklet_id = p_booklet_id OR booklet_id IS NULL)
    LOOP
        -- Verificar se o usuário respondeu esta questão
        IF v_booklet_answers ? v_question_num::text THEN
            v_user_answer := v_booklet_answers->>v_question_num::text;
            
            -- Determinar se a resposta está correta
            v_is_correct := v_is_nullified OR UPPER(TRIM(v_user_answer)) = UPPER(TRIM(v_answer_key));
            
            IF v_is_correct THEN
                -- Adicionar à pontuação total
                v_total_score := v_total_score + v_weight;
                
                -- Atualizar pontuação por disciplina
                IF v_discipline_scores ? v_section_type THEN
                    v_discipline_scores := jsonb_set(
                        v_discipline_scores, 
                        ARRAY[v_section_type], 
                        to_jsonb((v_discipline_scores->>v_section_type)::numeric + 1)
                    );
                ELSE
                    v_discipline_scores := jsonb_set(v_discipline_scores, ARRAY[v_section_type], to_jsonb(1));
                END IF;
                
                -- Atualizar pontuação ponderada por disciplina
                IF v_weighted_discipline_scores ? v_section_type THEN
                    v_weighted_discipline_scores := jsonb_set(
                        v_weighted_discipline_scores, 
                        ARRAY[v_section_type], 
                        to_jsonb((v_weighted_discipline_scores->>v_section_type)::numeric + v_weight)
                    );
                ELSE
                    v_weighted_discipline_scores := jsonb_set(v_weighted_discipline_scores, ARRAY[v_section_type], to_jsonb(v_weight));
                END IF;
            END IF;
        END IF;
    END LOOP;
    
    -- Adicionar pontuações subjetivas se existirem
    DECLARE
        v_subjective_scores JSONB;
        v_discursive_score NUMERIC := 0;
        v_case_study_1_score NUMERIC := 0;
        v_case_study_2_score NUMERIC := 0;
        v_case_study_3_score NUMERIC := 0;
    BEGIN
        v_subjective_scores := v_consolidated_data->'subjective_scores';
        
        IF v_subjective_scores IS NOT NULL THEN
            v_discursive_score := COALESCE((v_subjective_scores->>'discursive')::numeric, 0);
            v_case_study_1_score := COALESCE((v_subjective_scores->>'case_study_1')::numeric, 0);
            v_case_study_2_score := COALESCE((v_subjective_scores->>'case_study_2')::numeric, 0);
            v_case_study_3_score := COALESCE((v_subjective_scores->>'case_study_3')::numeric, 0);
            
            -- Aplicar pesos às pontuações subjetivas
            v_total_score := v_total_score + 
                (v_discursive_score * COALESCE(v_concurso.discursive_weight, 1)) +
                (v_case_study_1_score * COALESCE(v_concurso.case_study_1_weight, 1)) +
                (v_case_study_2_score * COALESCE(v_concurso.case_study_2_weight, 1)) +
                (v_case_study_3_score * COALESCE(v_concurso.case_study_3_weight, 1));
        END IF;
    END;
    
    -- Log da operação
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'calculate_user_score_by_booklet',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'concurso_id', p_concurso_id,
            'booklet_id', p_booklet_id,
            'total_score', v_total_score,
            'discipline_scores', v_discipline_scores,
            'weighted_discipline_scores', v_weighted_discipline_scores,
            'timestamp', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'total_score', v_total_score,
        'discipline_scores', v_discipline_scores,
        'weighted_discipline_scores', v_weighted_discipline_scores,
        'booklet_id', v_booklet_key,
        'message', 'Pontuação calculada com sucesso para o caderno ' || v_booklet_key
    );
END;
$$;

-- Função atualizada para salvar respostas com cálculo automático por caderno
CREATE OR REPLACE FUNCTION public.save_user_answers_with_booklet(
    p_ranking_id uuid,
    p_concurso_id uuid, 
    p_booklet_id uuid,
    p_answers jsonb,
    p_discursive_score numeric DEFAULT 0,
    p_case_study_1_score numeric DEFAULT 0,
    p_case_study_2_score numeric DEFAULT 0,
    p_case_study_3_score numeric DEFAULT 0,
    p_current_edit_count integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_data JSONB;
    v_consolidated_data JSONB;
    v_booklet_answers JSONB := '{}';
    v_answer RECORD;
    v_booklet_key TEXT;
    v_calculation_result JSONB;
BEGIN
    -- Verificar limite de edições
    IF p_current_edit_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Limite de edições atingido');
    END IF;
    
    -- Criar chave única para o caderno
    v_booklet_key := p_booklet_id::text;
    
    -- Buscar dados consolidados existentes
    SELECT answers_data INTO v_existing_data
    FROM user_answers
    WHERE user_ranking_id = p_ranking_id
    AND question_number IS NULL;
    
    -- Se não existir, criar estrutura base
    IF v_existing_data IS NULL THEN
        v_existing_data := jsonb_build_object(
            'booklets', '{}',
            'subjective_scores', jsonb_build_object(
                'discursive', 0,
                'case_study_1', 0,
                'case_study_2', 0,
                'case_study_3', 0
            ),
            'selected_booklet', v_booklet_key,
            'total_edit_count', 0,
            'metadata', jsonb_build_object(
                'last_updated', now(),
                'version', '2.0'
            )
        );
    END IF;
    
    -- Processar respostas para este caderno específico
    FOR v_answer IN
        SELECT 
            (elem->>'questionNumber')::integer as question_number,
            elem->>'answer' as answer
        FROM jsonb_array_elements(p_answers) as elem
    LOOP
        v_booklet_answers := jsonb_set(
            v_booklet_answers,
            ARRAY[v_answer.question_number::text],
            to_jsonb(v_answer.answer)
        );
    END LOOP;
    
    -- Atualizar APENAS o caderno específico nos dados consolidados
    v_consolidated_data := jsonb_set(
        v_existing_data,
        ARRAY['booklets', v_booklet_key],
        jsonb_build_object(
            'answers', v_booklet_answers,
            'metadata', jsonb_build_object(
                'completed_at', now(),
                'answer_count', jsonb_array_length(p_answers),
                'booklet_name', (
                    SELECT name FROM exam_booklets 
                    WHERE id = p_booklet_id
                )
            )
        )
    );
    
    -- Atualizar scores subjetivos
    v_consolidated_data := jsonb_set(v_consolidated_data, ARRAY['subjective_scores'], 
        jsonb_build_object(
            'discursive', p_discursive_score,
            'case_study_1', p_case_study_1_score,
            'case_study_2', p_case_study_2_score,
            'case_study_3', p_case_study_3_score
        )
    );
    
    -- Atualizar caderno selecionado e metadados
    v_consolidated_data := jsonb_set(v_consolidated_data, ARRAY['selected_booklet'], to_jsonb(v_booklet_key));
    v_consolidated_data := jsonb_set(v_consolidated_data, ARRAY['total_edit_count'], to_jsonb(p_current_edit_count + 1));
    v_consolidated_data := jsonb_set(v_consolidated_data, ARRAY['metadata', 'last_updated'], to_jsonb(now()));
    
    -- Salvar dados consolidados
    INSERT INTO user_answers (user_ranking_id, answers_data, answer_format, updated_at)
    VALUES (p_ranking_id, v_consolidated_data, 'CONSOLIDATED', now())
    ON CONFLICT (user_ranking_id) WHERE question_number IS NULL
    DO UPDATE SET 
        answers_data = EXCLUDED.answers_data,
        answer_format = 'CONSOLIDATED',
        updated_at = now();
    
    -- Calcular pontuação específica para este caderno
    SELECT calculate_user_score_by_booklet(p_ranking_id, p_concurso_id, p_booklet_id) INTO v_calculation_result;
    
    -- Atualizar user_rankings
    UPDATE user_rankings
    SET 
        edit_count = p_current_edit_count + 1,
        discursive_score = p_discursive_score,
        case_study_1_score = p_case_study_1_score,
        case_study_2_score = p_case_study_2_score,
        case_study_3_score = p_case_study_3_score,
        selected_booklet = p_booklet_id,
        score = COALESCE((v_calculation_result->>'total_score')::numeric, 0),
        customDisciplineScores = COALESCE(v_calculation_result->'discipline_scores', '{}'::jsonb),
        weightedCustomDisciplineScores = COALESCE(v_calculation_result->'weighted_discipline_scores', '{}'::jsonb),
        updated_at = now()
    WHERE id = p_ranking_id;
    
    -- Log da operação
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'save_user_answers_with_booklet',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'concurso_id', p_concurso_id,
            'booklet_id', p_booklet_id,
            'answers_count', jsonb_array_length(p_answers),
            'calculation_result', v_calculation_result,
            'timestamp', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'edit_count', p_current_edit_count + 1,
        'booklet_key', v_booklet_key,
        'answers_saved', jsonb_array_length(p_answers),
        'total_score', COALESCE((v_calculation_result->>'total_score')::numeric, 0),
        'message', 'Respostas salvas e pontuação calculada para o caderno ' || v_booklet_key
    );
END;
$$;
