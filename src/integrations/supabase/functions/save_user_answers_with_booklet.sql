
-- Função corrigida para salvar respostas por caderno específico
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
    v_booklet_name TEXT;
BEGIN
    -- Verificar limite de edições
    IF p_current_edit_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Limite de edições atingido');
    END IF;
    
    -- Criar chave única para o caderno
    v_booklet_key := p_booklet_id::text;
    
    -- Buscar nome do caderno
    SELECT name INTO v_booklet_name
    FROM exam_booklets 
    WHERE id = p_booklet_id;
    
    -- Log de entrada
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'save_answers_start',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'booklet_id', p_booklet_id,
            'booklet_name', v_booklet_name,
            'answers_count', jsonb_array_length(p_answers),
            'timestamp', now()
        )
    );
    
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
        -- Log cada resposta processada
        INSERT INTO score_calculation_logs (
            calculation_type,
            calculation_details
        ) VALUES (
            'process_answer',
            jsonb_build_object(
                'ranking_id', p_ranking_id,
                'booklet_id', p_booklet_id,
                'question_number', v_answer.question_number,
                'answer', v_answer.answer,
                'timestamp', now()
            )
        );
        
        v_booklet_answers := jsonb_set(
            v_booklet_answers,
            ARRAY[v_answer.question_number::text],
            to_jsonb(v_answer.answer)
        );
    END LOOP;
    
    -- Log das respostas processadas para este caderno
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'booklet_answers_processed',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'booklet_id', p_booklet_id,
            'processed_answers', v_booklet_answers,
            'answers_count', jsonb_object_keys(v_booklet_answers),
            'timestamp', now()
        )
    );
    
    -- Atualizar APENAS o caderno específico nos dados consolidados
    v_consolidated_data := jsonb_set(
        v_existing_data,
        ARRAY['booklets', v_booklet_key],
        jsonb_build_object(
            'answers', v_booklet_answers,
            'metadata', jsonb_build_object(
                'completed_at', now(),
                'answer_count', jsonb_array_length(p_answers),
                'booklet_name', v_booklet_name
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
    
    -- Log dados consolidados antes de salvar
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'consolidated_data_before_save',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'consolidated_data', v_consolidated_data,
            'timestamp', now()
        )
    );
    
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
    
    -- Log da operação final
    INSERT INTO score_calculation_logs (
        calculation_type,
        calculation_details
    ) VALUES (
        'save_user_answers_with_booklet_complete',
        jsonb_build_object(
            'ranking_id', p_ranking_id,
            'concurso_id', p_concurso_id,
            'booklet_id', p_booklet_id,
            'answers_count', jsonb_array_length(p_answers),
            'calculation_result', v_calculation_result,
            'final_consolidated_data', v_consolidated_data,
            'timestamp', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'edit_count', p_current_edit_count + 1,
        'booklet_key', v_booklet_key,
        'answers_saved', jsonb_array_length(p_answers),
        'total_score', COALESCE((v_calculation_result->>'total_score')::numeric, 0),
        'message', 'Respostas salvas e pontuação calculada para o caderno ' || COALESCE(v_booklet_name, v_booklet_key),
        'saved_answers', v_booklet_answers
    );
END;
$$;
