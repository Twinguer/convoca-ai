
-- Função para gerenciar cadernos de prova
CREATE OR REPLACE FUNCTION public.manage_exam_booklets(
  p_operation text,
  p_concurso_id uuid DEFAULT NULL,
  p_booklet_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_display_order integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_booklet_record record;
BEGIN
  CASE p_operation
    WHEN 'GET' THEN
      -- Buscar cadernos de um concurso
      SELECT jsonb_build_object(
        'success', true,
        'booklets', jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'display_order', display_order
          ) ORDER BY display_order
        )
      ) INTO v_result
      FROM exam_booklets
      WHERE concurso_id = p_concurso_id;
      
      RETURN COALESCE(v_result, jsonb_build_object('success', true, 'booklets', '[]'::jsonb));
      
    WHEN 'CREATE' THEN
      -- Criar novo caderno
      INSERT INTO exam_booklets (concurso_id, name, display_order)
      VALUES (p_concurso_id, p_name, COALESCE(p_display_order, 1))
      RETURNING * INTO v_booklet_record;
      
      RETURN jsonb_build_object(
        'success', true,
        'booklet', jsonb_build_object(
          'id', v_booklet_record.id,
          'name', v_booklet_record.name,
          'display_order', v_booklet_record.display_order
        )
      );
      
    WHEN 'UPDATE' THEN
      -- Atualizar caderno
      UPDATE exam_booklets 
      SET 
        name = COALESCE(p_name, name),
        display_order = COALESCE(p_display_order, display_order),
        updated_at = now()
      WHERE id = p_booklet_id
      RETURNING * INTO v_booklet_record;
      
      RETURN jsonb_build_object(
        'success', true,
        'booklet', jsonb_build_object(
          'id', v_booklet_record.id,
          'name', v_booklet_record.name,
          'display_order', v_booklet_record.display_order
        )
      );
      
    WHEN 'DELETE' THEN
      -- Deletar caderno
      DELETE FROM exam_booklets WHERE id = p_booklet_id;
      
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

-- Função atualizada para salvar respostas sem chamar função inexistente
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
    
    -- Atualizar user_rankings
    UPDATE user_rankings
    SET 
        edit_count = p_current_edit_count + 1,
        discursive_score = p_discursive_score,
        case_study_1_score = p_case_study_1_score,
        case_study_2_score = p_case_study_2_score,
        case_study_3_score = p_case_study_3_score,
        selected_booklet = p_booklet_id,
        updated_at = now()
    WHERE id = p_ranking_id;
    
    -- Log da operação (removido a chamada da função inexistente)
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
            'timestamp', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'edit_count', p_current_edit_count + 1,
        'booklet_key', v_booklet_key,
        'answers_saved', jsonb_array_length(p_answers),
        'message', 'Respostas salvas para o caderno ' || v_booklet_key
    );
END;
$$;
