import 'dotenv/config';

console.log('🚀 GERANDO SQL PARA FASE 5 - MIGRAÇÃO DE DADOS');
console.log('=' .repeat(60));

const phase5SQL = `
-- =====================================================
-- FASE 5: MIGRAÇÃO DE DADOS DAS TABELAS ANTIGAS
-- =====================================================

-- 1. Função para migrar gabaritos de official_answer_weights → concursos.official_answers
CREATE OR REPLACE FUNCTION migrate_official_answers()
RETURNS VOID AS $$
DECLARE
  v_concurso RECORD;
  v_official_data JSONB;
BEGIN
  FOR v_concurso IN SELECT id FROM concursos LOOP
    -- Buscar dados do official_answer_weights
    SELECT consolidated_answer_data INTO v_official_data
    FROM official_answer_weights
    WHERE concurso_id = v_concurso.id;
    
    -- Atualizar concursos com dados consolidados
    UPDATE concursos 
    SET official_answers = COALESCE(v_official_data, '{}'::jsonb)
    WHERE id = v_concurso.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para migrar cadernos de exam_booklets → concursos.exam_booklets
CREATE OR REPLACE FUNCTION migrate_exam_booklets()
RETURNS VOID AS $$
DECLARE
  v_concurso RECORD;
  v_booklets JSONB;
BEGIN
  FOR v_concurso IN SELECT id FROM concursos LOOP
    -- Buscar cadernos do concurso
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'display_order', display_order,
        'total_questions', 0, -- Será preenchido depois
        'is_active', true
      ) ORDER BY display_order
    ) INTO v_booklets
    FROM exam_booklets
    WHERE concurso_id = v_concurso.id;
    
    -- Atualizar concursos com cadernos
    UPDATE concursos 
    SET exam_booklets = COALESCE(v_booklets, '[]'::jsonb)
    WHERE id = v_concurso.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para migrar configurações de consolidated_answers_by_concurso → concursos.form_config
CREATE OR REPLACE FUNCTION migrate_form_config()
RETURNS VOID AS $$
DECLARE
  v_concurso RECORD;
  v_config JSONB;
BEGIN
  FOR v_concurso IN SELECT id FROM concursos LOOP
    -- Buscar configuração consolidada
    SELECT consolidated_data INTO v_config
    FROM consolidated_answers_by_concurso
    WHERE concurso_id = v_concurso.id;
    
    -- Atualizar concursos com configuração
    UPDATE concursos 
    SET form_config = COALESCE(v_config, '{}'::jsonb)
    WHERE id = v_concurso.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Função para migrar cálculos de user_rankings → ranking_calculations
CREATE OR REPLACE FUNCTION migrate_ranking_calculations()
RETURNS VOID AS $$
DECLARE
  v_participation RECORD;
  v_position INTEGER;
BEGIN
  -- Migrar dados existentes
  FOR v_participation IN 
    SELECT 
      ur.id,
      ur.concurso_id,
      ur.user_id,
      ur.score,
      ur.basic_knowledge_score,
      ur.specific_knowledge_score,
      ur.discursive_score,
      ur.case_study_1_score,
      ur.case_study_2_score,
      ur.case_study_3_score,
      ur.weighted_basic_score,
      ur.weighted_specific_1_score,
      ur.weighted_specific_2_score,
      ur.weighted_specific_3_score,
      ur.weighted_discursive_score,
      ur.weighted_case_study_1_score,
      ur.weighted_case_study_2_score,
      ur.weighted_case_study_3_score,
      ur.edit_count,
      ur.reservation_type,
      ur.selected_booklet
    FROM user_rankings ur
  LOOP
    -- Calcular posição
    SELECT COUNT(*) + 1 INTO v_position
    FROM user_rankings ur2
    WHERE ur2.concurso_id = v_participation.concurso_id
      AND ur2.score > v_participation.score;
    
    -- Inserir cálculo
    INSERT INTO ranking_calculations (
      concurso_id, user_id, selected_booklet, reservation_type,
      basic_knowledge_raw_score, basic_knowledge_weighted_score,
      specific_knowledge_1_raw_score, specific_knowledge_1_weighted_score,
      discursive_raw_score, discursive_weighted_score,
      case_study_1_raw_score, case_study_1_weighted_score,
      case_study_2_raw_score, case_study_2_weighted_score,
      case_study_3_raw_score, case_study_3_weighted_score,
      total_raw_score, total_weighted_score, position, edit_count
    ) VALUES (
      v_participation.concurso_id, v_participation.user_id, 
      COALESCE(v_participation.selected_booklet, 't1'), v_participation.reservation_type,
      v_participation.basic_knowledge_score, v_participation.weighted_basic_score,
      v_participation.specific_knowledge_score, v_participation.weighted_specific_1_score,
      v_participation.discursive_score, v_participation.weighted_discursive_score,
      v_participation.case_study_1_score, v_participation.weighted_case_study_1_score,
      v_participation.case_study_2_score, v_participation.weighted_case_study_2_score,
      v_participation.case_study_3_score, v_participation.weighted_case_study_3_score,
      v_participation.score, v_participation.score, v_position, v_participation.edit_count
    )
    ON CONFLICT (concurso_id, user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Executar migrações
SELECT migrate_official_answers();
SELECT migrate_exam_booklets();
SELECT migrate_form_config();
SELECT migrate_ranking_calculations();

-- 6. Verificar migração
SELECT 
  'concursos' as tabela, 
  COUNT(*) as registros,
  COUNT(CASE WHEN official_answers != '{}' THEN 1 END) as com_official_answers,
  COUNT(CASE WHEN exam_booklets != '[]' THEN 1 END) as com_exam_booklets,
  COUNT(CASE WHEN form_config != '{}' THEN 1 END) as com_form_config
FROM concursos
UNION ALL
SELECT 
  'user_rankings' as tabela, 
  COUNT(*) as registros,
  COUNT(CASE WHEN participations != '{}' THEN 1 END) as com_participations,
  COUNT(CASE WHEN selected_booklet IS NOT NULL THEN 1 END) as com_selected_booklet,
  0 as com_form_config
FROM user_rankings
UNION ALL
SELECT 
  'ranking_calculations' as tabela, 
  COUNT(*) as registros,
  COUNT(CASE WHEN total_weighted_score > 0 THEN 1 END) as com_scores,
  COUNT(CASE WHEN position > 0 THEN 1 END) as com_positions,
  0 as com_form_config
FROM ranking_calculations;

-- 7. Limpar funções temporárias
DROP FUNCTION IF EXISTS migrate_official_answers();
DROP FUNCTION IF EXISTS migrate_exam_booklets();
DROP FUNCTION IF EXISTS migrate_form_config();
DROP FUNCTION IF EXISTS migrate_ranking_calculations();
`;

console.log('\n📋 SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
console.log('=' .repeat(60));
console.log(phase5SQL);
console.log('\n✅ Copie o SQL acima e execute no Supabase SQL Editor');
console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');

