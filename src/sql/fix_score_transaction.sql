
-- Atualização da função save_scores_transaction para garantir que todos os campos de pontuação sejam preservados
CREATE OR REPLACE FUNCTION public.save_scores_transaction(p_ranking_id uuid, p_raw_scores jsonb, p_weighted_scores jsonb, p_subjective_scores jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_old_scores JSONB;
  v_result JSONB;
  v_current_ranking RECORD;
BEGIN
  -- Inicia transação explícita
  BEGIN
    -- Primeiro, obter os valores atuais para garantir que nenhum dado seja perdido
    SELECT * INTO v_current_ranking
    FROM user_rankings
    WHERE id = p_ranking_id;
    
    IF v_current_ranking IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Ranking não encontrado');
    END IF;
    
    -- Armazena pontuações antigas para log
    SELECT jsonb_build_object(
      'basic_knowledge_score', v_current_ranking.basic_knowledge_score,
      'specific_knowledge_score', v_current_ranking.specific_knowledge_score,
      'specific_knowledge_1_score', v_current_ranking.specific_knowledge_1_score,
      'specific_knowledge_2_score', v_current_ranking.specific_knowledge_2_score,
      'specific_knowledge_3_score', v_current_ranking.specific_knowledge_3_score,
      'discursive_score', v_current_ranking.discursive_score,
      'case_study_1_score', v_current_ranking.case_study_1_score,
      'case_study_2_score', v_current_ranking.case_study_2_score,
      'case_study_3_score', v_current_ranking.case_study_3_score,
      'score', v_current_ranking.score
    ) INTO v_old_scores;

    -- Log para debug dos valores recebidos
    INSERT INTO score_calculation_logs (
      user_ranking_id,
      calculation_type,
      calculation_details
    ) VALUES (
      p_ranking_id,
      'save_scores_transaction_input',
      jsonb_build_object(
        'raw_scores', p_raw_scores,
        'weighted_scores', p_weighted_scores,
        'subjective_scores', p_subjective_scores,
        'timestamp', now()
      )
    );

    -- Atualiza pontuações na tabela user_rankings
    UPDATE user_rankings
    SET
      -- Pontuações brutas com fallback para os valores existentes
      basic_knowledge_score = COALESCE((p_raw_scores->>'basicKnowledgeScore')::numeric, basic_knowledge_score),
      specific_knowledge_score = COALESCE((p_raw_scores->>'specificKnowledgeScore')::numeric, specific_knowledge_score),
      specific_knowledge_1_score = COALESCE((p_raw_scores->>'specific1Score')::numeric, specific_knowledge_1_score),
      specific_knowledge_2_score = COALESCE((p_raw_scores->>'specific2Score')::numeric, specific_knowledge_2_score),
      specific_knowledge_3_score = COALESCE((p_raw_scores->>'specific3Score')::numeric, specific_knowledge_3_score),
      
      -- Pontuações subjetivas com fallback para os valores existentes
      discursive_score = COALESCE((p_subjective_scores->>'discursiveScore')::numeric, discursive_score),
      case_study_1_score = COALESCE((p_subjective_scores->>'caseStudy1Score')::numeric, case_study_1_score),
      case_study_2_score = COALESCE((p_subjective_scores->>'caseStudy2Score')::numeric, case_study_2_score),
      case_study_3_score = COALESCE((p_subjective_scores->>'caseStudy3Score')::numeric, case_study_3_score),
      
      -- Pontuações ponderadas com fallback para os valores existentes
      weighted_basic_score = COALESCE((p_weighted_scores->>'weightedBasicScore')::numeric, weighted_basic_score),
      weighted_specific_1_score = COALESCE((p_weighted_scores->>'weightedSpecific1Score')::numeric, weighted_specific_1_score),
      weighted_specific_2_score = COALESCE((p_weighted_scores->>'weightedSpecific2Score')::numeric, weighted_specific_2_score),
      weighted_specific_3_score = COALESCE((p_weighted_scores->>'weightedSpecific3Score')::numeric, weighted_specific_3_score),
      weighted_discursive_score = COALESCE((p_weighted_scores->>'weightedDiscursiveScore')::numeric, weighted_discursive_score),
      weighted_case_study_1_score = COALESCE((p_weighted_scores->>'weightedCaseStudy1Score')::numeric, weighted_case_study_1_score),
      weighted_case_study_2_score = COALESCE((p_weighted_scores->>'weightedCaseStudy2Score')::numeric, weighted_case_study_2_score),
      weighted_case_study_3_score = COALESCE((p_weighted_scores->>'weightedCaseStudy3Score')::numeric, weighted_case_study_3_score),
      
      -- Pontuação total (calcula novamente se não fornecida)
      score = COALESCE(
        (p_weighted_scores->>'totalScore')::numeric,
        COALESCE((p_weighted_scores->>'weightedBasicScore')::numeric, weighted_basic_score) +
        COALESCE((p_weighted_scores->>'weightedSpecific1Score')::numeric, weighted_specific_1_score) +
        COALESCE((p_weighted_scores->>'weightedSpecific2Score')::numeric, weighted_specific_2_score) +
        COALESCE((p_weighted_scores->>'weightedSpecific3Score')::numeric, weighted_specific_3_score) +
        COALESCE((p_weighted_scores->>'weightedDiscursiveScore')::numeric, weighted_discursive_score) +
        COALESCE((p_weighted_scores->>'weightedCaseStudy1Score')::numeric, weighted_case_study_1_score) +
        COALESCE((p_weighted_scores->>'weightedCaseStudy2Score')::numeric, weighted_case_study_2_score) +
        COALESCE((p_weighted_scores->>'weightedCaseStudy3Score')::numeric, weighted_case_study_3_score)
      ),
      
      -- Metadados
      updated_at = NOW(),
      is_score_recalculated = true
    WHERE id = p_ranking_id
    RETURNING jsonb_build_object(
      'success', true,
      'ranking_id', id,
      'new_scores', jsonb_build_object(
        'basic_knowledge_score', basic_knowledge_score,
        'specific_knowledge_score', specific_knowledge_score,
        'specific_knowledge_1_score', specific_knowledge_1_score, 
        'specific_knowledge_2_score', specific_knowledge_2_score,
        'specific_knowledge_3_score', specific_knowledge_3_score,
        'discursive_score', discursive_score,
        'case_study_1_score', case_study_1_score,
        'case_study_2_score', case_study_2_score,
        'case_study_3_score', case_study_3_score,
        'weighted_basic_score', weighted_basic_score,
        'weighted_specific_1_score', weighted_specific_1_score,
        'weighted_specific_2_score', weighted_specific_2_score,
        'weighted_specific_3_score', weighted_specific_3_score,
        'weighted_discursive_score', weighted_discursive_score,
        'weighted_case_study_1_score', weighted_case_study_1_score,
        'weighted_case_study_2_score', weighted_case_study_2_score,
        'weighted_case_study_3_score', weighted_case_study_3_score,
        'score', score
      )
    ) INTO v_result;

    -- Registra a operação no log
    INSERT INTO score_calculation_logs (
      user_ranking_id,
      calculation_type,
      previous_score,
      new_score,
      calculation_details
    ) VALUES (
      p_ranking_id,
      'save_scores_transaction',
      (v_old_scores->>'score')::numeric,
      (v_result->'new_scores'->>'score')::numeric,
      jsonb_build_object(
        'old_scores', v_old_scores,
        'new_scores', v_result->'new_scores'
      )
    );

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, registra e propaga
    INSERT INTO score_calculation_logs (
      user_ranking_id,
      calculation_type,
      calculation_details
    ) VALUES (
      p_ranking_id,
      'save_scores_transaction_error',
      jsonb_build_object(
        'error', SQLERRM,
        'error_detail', SQLSTATE
      )
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
  END;
END;
$function$;
