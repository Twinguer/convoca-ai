-- Teste para verificar se o rollback funcionou
-- Execute este script após aplicar as migrações de rollback

DO $$
DECLARE
    test_score numeric;
    test_ranking_id text := 'ranking_16ae4f3d-91e3-4843-a2ab-67cb5927dc2d_44c81698-084f-41f3-931a-e8dd1f93a032_1760755531444';
    test_user_id uuid := '44c81698-084f-41f3-931a-e8dd1f93a032';
    test_concurso_id uuid := '16ae4f3d-91e3-4843-a2ab-67cb5927dc2d';
    test_booklet_id text := '1d6d58c0-ab9e-471c-9506-820bb37efdcc';
    
    v_user_data jsonb;
    v_score numeric;
    v_below_minimum boolean;
    v_status text;
    v_subjectives jsonb;
    v_object_scores jsonb;
    
    -- Variáveis para verificar estrutura
    v_has_global_minimum boolean := false;
    v_total_minimum_score numeric := 0;
    v_concursos_columns text[];
BEGIN
    RAISE NOTICE '=== TESTE DE ROLLBACK - REGRAS DE MÍNIMO ===';
    RAISE NOTICE 'Timestamp: %', NOW();
    
    -- 1. Verificar se campos de mínimo global foram removidos
    SELECT array_agg(column_name) INTO v_concursos_columns
    FROM information_schema.columns 
    WHERE table_name = 'concursos' 
    AND column_name IN ('has_minimum_score', 'total_minimum_score');
    
    IF v_concursos_columns IS NULL OR array_length(v_concursos_columns, 1) = 0 THEN
        RAISE NOTICE '✅ Campos de mínimo global removidos com sucesso';
    ELSE
        RAISE NOTICE '❌ ERRO: Campos de mínimo global ainda existem: %', v_concursos_columns;
    END IF;
    
    -- 2. Testar função calculate_user_score_realtime
    BEGIN
        SELECT calculate_user_score_realtime(
            test_ranking_id,
            test_user_id,
            test_concurso_id,
            test_booklet_id
        ) INTO test_score;
        
        RAISE NOTICE '✅ Função calculate_user_score_realtime executada sem erros';
        RAISE NOTICE '   Score calculado: %', test_score;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO na função calculate_user_score_realtime: %', SQLERRM;
            RETURN;
    END;
    
    -- 3. Verificar dados do usuário após execução
    SELECT consolidated_data->'rankings'->test_ranking_id->'user_data' INTO v_user_data
    FROM user_rankings
    WHERE user_id = test_user_id;
    
    IF v_user_data IS NULL THEN
        RAISE NOTICE '❌ ERRO: Dados do usuário não encontrados';
        RETURN;
    END IF;
    
    v_score := COALESCE((v_user_data->>'score')::numeric, 0);
    v_below_minimum := COALESCE((v_user_data->>'below_minimum')::boolean, false);
    v_status := v_user_data->>'status';
    v_subjectives := v_user_data->'subjectives';
    v_object_scores := v_user_data->'object_scores';
    
    RAISE NOTICE 'Dados do usuário após rollback:';
    RAISE NOTICE '  Score: %', v_score;
    RAISE NOTICE '  Below minimum: %', v_below_minimum;
    RAISE NOTICE '  Status: %', v_status;
    RAISE NOTICE '  Subjectives: %', v_subjectives;
    RAISE NOTICE '  Object scores: %', v_object_scores;
    
    -- 4. Verificar se rollback foi bem-sucedido
    IF test_score > 0 AND v_score > 0 THEN
        RAISE NOTICE '✅ ROLLBACK SUCESSO: Função funcionando normalmente';
        RAISE NOTICE '   Score calculado: %', test_score;
        RAISE NOTICE '   Score salvo: %', v_score;
        
        -- Verificar se scores subjetivos estão sendo lidos corretamente
        IF v_subjectives IS NOT NULL THEN
            RAISE NOTICE '✅ Subjectives encontrados: %', v_subjectives;
        ELSE
            RAISE NOTICE '⚠️  Subjectives não encontrados (pode ser normal se não houver dados)';
        END IF;
        
        -- Verificar se object_scores estão sendo preservados
        IF v_object_scores IS NOT NULL AND jsonb_typeof(v_object_scores) = 'object' THEN
            RAISE NOTICE '✅ Object scores preservados: %', v_object_scores;
        ELSE
            RAISE NOTICE '⚠️  Object scores não encontrados ou vazios';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ ROLLBACK FALHOU: Problemas na função';
        RAISE NOTICE '   Score calculado: %', test_score;
        RAISE NOTICE '   Score salvo: %', v_score;
    END IF;
    
    -- 5. Verificar se não há regras de mínimo global ativas
    IF v_below_minimum = false OR v_status != 'E' THEN
        RAISE NOTICE '✅ Regras de mínimo global desativadas (como esperado no rollback)';
    ELSE
        RAISE NOTICE '⚠️  Ainda há regras de mínimo ativas: below_minimum=%, status=%', v_below_minimum, v_status;
    END IF;
    
    RAISE NOTICE '=== FIM DO TESTE DE ROLLBACK ===';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO GERAL durante teste de rollback: %', SQLERRM;
        RAISE NOTICE 'Considere verificar manualmente o estado do sistema';
END $$;
