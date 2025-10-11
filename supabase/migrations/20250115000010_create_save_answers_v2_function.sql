-- Migration: Create save_user_answers_v2 function for user_ranking_new
-- This function saves answers directly to the JSONB structure in user_ranking_new

CREATE OR REPLACE FUNCTION public.save_user_answers_v2(
    p_user_ranking_id uuid,
    p_answers jsonb,
    p_discursive_score numeric DEFAULT 0,
    p_case_study_1_score numeric DEFAULT 0,
    p_case_study_2_score numeric DEFAULT 0,
    p_case_study_3_score numeric DEFAULT 0,
    p_edit_count integer DEFAULT 0,
    p_selected_booklet text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID;
    v_ranking_id UUID;
    v_existing_answers JSONB;
    v_existing_scores JSONB;
    v_existing_metadata JSONB;
    v_updated_answers JSONB;
    v_updated_scores JSONB;
    v_updated_metadata JSONB;
    v_answers_saved INTEGER := 0;
    v_answer RECORD;
BEGIN
    -- SECURITY: Verify user owns this ranking
    SELECT ur.user_id, ur.ranking_id
    INTO v_user_id, v_ranking_id
    FROM user_ranking_new ur
    WHERE ur.id = p_user_ranking_id;
    
    IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized access');
    END IF;

    -- Check edit limit
    IF p_edit_count >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Limite de edições atingido');
    END IF;
    
    -- Get existing data
    SELECT 
        COALESCE(user_answers, '{}'::jsonb),
        COALESCE(calculated_scores, '{}'::jsonb),
        COALESCE(metadata, '{}'::jsonb)
    INTO v_existing_answers, v_existing_scores, v_existing_metadata
    FROM user_ranking_new
    WHERE id = p_user_ranking_id;
    
    -- Update answers
    v_updated_answers := v_existing_answers;
    FOR v_answer IN SELECT * FROM jsonb_each(p_answers) LOOP
        v_updated_answers := v_updated_answers || jsonb_build_object(v_answer.key, v_answer.value);
        v_answers_saved := v_answers_saved + 1;
    END LOOP;
    
    -- Update calculated scores
    v_updated_scores := v_existing_scores || jsonb_build_object(
        'discursive_score', p_discursive_score,
        'case_study_1_score', p_case_study_1_score,
        'case_study_2_score', p_case_study_2_score,
        'case_study_3_score', p_case_study_3_score,
        'total', p_discursive_score + p_case_study_1_score + p_case_study_2_score + p_case_study_3_score,
        'last_updated', NOW()
    );
    
    -- Update metadata
    v_updated_metadata := v_existing_metadata || jsonb_build_object(
        'edit_count', p_edit_count + 1,
        'last_edit_at', NOW(),
        'all_questions_answered', (SELECT COUNT(*) FROM jsonb_each(p_answers)) > 0,
        'selected_booklet', COALESCE(p_selected_booklet, v_existing_metadata->>'selected_booklet'),
        'updated_at', NOW()
    );
    
    -- Update the user ranking
    UPDATE user_ranking_new
    SET 
        user_answers = v_updated_answers,
        calculated_scores = v_updated_scores,
        metadata = v_updated_metadata,
        score = (v_updated_scores->>'total')::numeric,
        updated_at = NOW()
    WHERE id = p_user_ranking_id;
    
    -- Log the action
    INSERT INTO security_logs (user_id, action, details)
    VALUES (auth.uid(), 'save_answers_v2', jsonb_build_object(
        'user_ranking_id', p_user_ranking_id,
        'ranking_id', v_ranking_id,
        'answers_saved', v_answers_saved,
        'edit_count', p_edit_count + 1
    ));
    
    RETURN jsonb_build_object(
        'success', true,
        'answers_saved', v_answers_saved,
        'edit_count', p_edit_count + 1,
        'total_score', (v_updated_scores->>'total')::numeric
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO security_logs (user_id, action, details)
        VALUES (auth.uid(), 'save_answers_v2_error', jsonb_build_object(
            'user_ranking_id', p_user_ranking_id,
            'error', SQLERRM
        ));
        
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.save_user_answers_v2 IS 'Saves user answers directly to user_ranking_new JSONB structure';
