-- =====================================================
-- SCRIPT CONSOLIDADO: Remover todas as tabelas obsoletas
-- OBJETIVO: Limpeza completa do banco de dados
-- EXECUTAR: No Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. REMOVER TABELAS DE TESTE (V2 RANKING)
-- =====================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar user_ranking_new
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_ranking_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM user_ranking_new;
    RAISE NOTICE 'Tabela user_ranking_new contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS user_ranking_new CASCADE;
    RAISE NOTICE 'Tabela user_ranking_new removida.';
  END IF;
  
  -- Verificar create_ranking_new
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'create_ranking_new'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM create_ranking_new;
    RAISE NOTICE 'Tabela create_ranking_new contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS create_ranking_new CASCADE;
    RAISE NOTICE 'Tabela create_ranking_new removida.';
  END IF;
END $$;

-- =====================================================
-- 2. REMOVER TABELAS DE CADERNOS OBSOLETAS
-- =====================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar exam_booklets
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_booklets'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM exam_booklets;
    RAISE NOTICE 'Tabela exam_booklets contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS exam_booklets CASCADE;
    RAISE NOTICE 'Tabela exam_booklets removida.';
  END IF;
  
  -- Verificar exam_booklets_backup
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_booklets_backup'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM exam_booklets_backup;
    RAISE NOTICE 'Tabela exam_booklets_backup contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS exam_booklets_backup CASCADE;
    RAISE NOTICE 'Tabela exam_booklets_backup removida.';
  END IF;
END $$;

-- =====================================================
-- 3. REMOVER TABELAS DE GABARITOS OBSOLETAS
-- =====================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar official_answer_weights
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'official_answer_weights'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM official_answer_weights;
    RAISE NOTICE 'Tabela official_answer_weights contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS official_answer_weights CASCADE;
    RAISE NOTICE 'Tabela official_answer_weights removida.';
  END IF;
  
  -- Verificar official_answer_weights_backup
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'official_answer_weights_backup'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM official_answer_weights_backup;
    RAISE NOTICE 'Tabela official_answer_weights_backup contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS official_answer_weights_backup CASCADE;
    RAISE NOTICE 'Tabela official_answer_weights_backup removida.';
  END IF;
END $$;

-- =====================================================
-- 4. REMOVER TABELAS DE CÁLCULOS OBSOLETAS
-- =====================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar ranking_calculations
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ranking_calculations'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM ranking_calculations;
    RAISE NOTICE 'Tabela ranking_calculations contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS ranking_calculations CASCADE;
    RAISE NOTICE 'Tabela ranking_calculations removida.';
  END IF;
END $$;

-- =====================================================
-- 5. REMOVER TABELAS DE TEMPLATES OBSOLETAS
-- =====================================================
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar schedule_templates
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'schedule_templates'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT COUNT(*) INTO table_count FROM schedule_templates;
    RAISE NOTICE 'Tabela schedule_templates contém % registros. Removendo...', table_count;
    DROP TABLE IF EXISTS schedule_templates CASCADE;
    RAISE NOTICE 'Tabela schedule_templates removida.';
  END IF;
END $$;

-- =====================================================
-- 6. REMOVER FUNÇÕES OBSOLETAS
-- =====================================================
DO $$
DECLARE
  func_exists BOOLEAN;
  func_name TEXT;
BEGIN
  -- Lista de funções obsoletas para remover
  FOR func_name IN 
    SELECT unnest(ARRAY[
      'calculate_user_ranking_score_v2',
      'get_rankings_with_filters',
      'get_user_rankings_for_ranking',
      'migrate_ranking_calculations',
      'migrate_official_answers',
      'migrate_exam_booklets',
      'migrate_form_config',
      'update_answer_with_weight',
      'update_official_answers_and_recalculate',
      'manage_exam_booklets'
    ])
  LOOP
    SELECT EXISTS (
      SELECT FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = func_name
    ) INTO func_exists;
    
    IF func_exists THEN
      EXECUTE 'DROP FUNCTION IF EXISTS ' || func_name || '() CASCADE';
      RAISE NOTICE 'Função % removida.', func_name;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  'VERIFICAÇÃO FINAL' as status,
  'Tabelas obsoletas removidas com sucesso!' as resultado;

-- Listar tabelas restantes para verificação
SELECT 
  table_name,
  'Tabela ativa' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'concursos',
    'user_rankings', 
    'consolidated_answers_by_concurso',
    'users_profiles',
    'study_cycles_v2',
    'study_goals_tracking',
    'spaced_repetition_queue'
  )
ORDER BY table_name;
