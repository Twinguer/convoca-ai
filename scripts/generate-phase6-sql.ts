import 'dotenv/config';

console.log('🚀 GERANDO SQL PARA FASE 6 - FUNÇÕES E TRIGGERS');
console.log('=' .repeat(60));

const phase6SQL = `
-- =====================================================
-- FASE 6: FUNÇÕES E TRIGGERS
-- =====================================================

-- 1. Função de Cálculo de Posição
CREATE OR REPLACE FUNCTION update_ranking_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular posições quando score muda
  UPDATE ranking_calculations 
  SET position = subq.new_position
  FROM (
    SELECT 
      id, 
      ROW_NUMBER() OVER (PARTITION BY concurso_id ORDER BY total_weighted_score DESC) as new_position
    FROM ranking_calculations 
    WHERE concurso_id = NEW.concurso_id
  ) subq
  WHERE ranking_calculations.id = subq.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para atualizar posições
DROP TRIGGER IF EXISTS trigger_update_ranking_position ON ranking_calculations;
CREATE TRIGGER trigger_update_ranking_position
  AFTER INSERT OR UPDATE OF total_weighted_score ON ranking_calculations
  FOR EACH ROW EXECUTE FUNCTION update_ranking_position();

-- 3. Função de Cálculo Completo
CREATE OR REPLACE FUNCTION calculate_user_ranking_score(
  p_concurso_id UUID,
  p_user_id UUID,
  p_selected_booklet TEXT,
  p_answers JSONB
) RETURNS VOID AS $$
DECLARE
  v_concurso_config JSONB;
  v_official_answers JSONB;
  v_booklet_answers JSONB;
  v_calculations RECORD;
BEGIN
  -- Buscar configuração do concurso
  SELECT form_config, official_answers INTO v_concurso_config, v_official_answers
  FROM concursos WHERE id = p_concurso_id;
  
  -- Extrair gabarito do caderno específico
  v_booklet_answers := v_official_answers->p_selected_booklet->'answers';
  
  -- Calcular scores (lógica de cálculo aqui)
  -- ... implementar lógica de cálculo ...
  
  -- Inserir/atualizar cálculos
  INSERT INTO ranking_calculations (
    concurso_id, user_id, selected_booklet, reservation_type,
    basic_knowledge_raw_score, basic_knowledge_weighted_score,
    total_raw_score, total_weighted_score
  ) VALUES (
    p_concurso_id, p_user_id, p_selected_booklet, p_answers->>'reservation_type',
    0, 0, -- v_calculations.basic_raw, v_calculations.basic_weighted,
    0, 0  -- v_calculations.total_raw, v_calculations.total_weighted
  )
  ON CONFLICT (concurso_id, user_id) DO UPDATE SET
    selected_booklet = EXCLUDED.selected_booklet,
    basic_knowledge_raw_score = EXCLUDED.basic_knowledge_raw_score,
    basic_knowledge_weighted_score = EXCLUDED.basic_knowledge_weighted_score,
    total_raw_score = EXCLUDED.total_raw_score,
    total_weighted_score = EXCLUDED.total_weighted_score,
    last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Função para buscar classificação de ranking
CREATE OR REPLACE FUNCTION get_ranking_classification(
  p_concurso_id UUID,
  p_selected_booklet TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  position INTEGER,
  user_id UUID,
  user_name TEXT,
  total_score NUMERIC,
  basic_knowledge_score NUMERIC,
  specific_knowledge_1_score NUMERIC,
  specific_knowledge_2_score NUMERIC,
  specific_knowledge_3_score NUMERIC,
  discursive_score NUMERIC,
  case_study_1_score NUMERIC,
  case_study_2_score NUMERIC,
  case_study_3_score NUMERIC,
  accuracy NUMERIC,
  correct_answers INTEGER,
  total_questions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rc.position,
    rc.user_id,
    up.name as user_name,
    rc.total_weighted_score as total_score,
    rc.basic_knowledge_weighted_score as basic_knowledge_score,
    rc.specific_knowledge_1_weighted_score as specific_knowledge_1_score,
    rc.specific_knowledge_2_weighted_score as specific_knowledge_2_score,
    rc.specific_knowledge_3_weighted_score as specific_knowledge_3_score,
    rc.discursive_weighted_score as discursive_score,
    rc.case_study_1_weighted_score as case_study_1_score,
    rc.case_study_2_weighted_score as case_study_2_score,
    rc.case_study_3_weighted_score as case_study_3_score,
    rc.total_accuracy as accuracy,
    rc.total_correct_answers as correct_answers,
    rc.total_questions_answered as total_questions
  FROM ranking_calculations rc
  JOIN users_profiles up ON up.id = rc.user_id
  WHERE rc.concurso_id = p_concurso_id
    AND (p_selected_booklet IS NULL OR rc.selected_booklet = p_selected_booklet)
  ORDER BY rc.position
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 5. Função para atualizar contador de participantes
CREATE OR REPLACE FUNCTION update_concurso_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contador de participantes no concurso
  UPDATE concursos 
  SET total_participants = (
    SELECT COUNT(*) 
    FROM ranking_calculations 
    WHERE concurso_id = NEW.concurso_id
  )
  WHERE id = NEW.concurso_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar contador de participantes
DROP TRIGGER IF EXISTS trigger_update_concurso_participants ON ranking_calculations;
CREATE TRIGGER trigger_update_concurso_participants
  AFTER INSERT OR DELETE ON ranking_calculations
  FOR EACH ROW EXECUTE FUNCTION update_concurso_participants();

-- 7. Verificar funções criadas
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'update_ranking_position',
    'calculate_user_ranking_score',
    'get_ranking_classification',
    'update_concurso_participants'
  )
ORDER BY routine_name;
`;

console.log('\n📋 SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
console.log('=' .repeat(60));
console.log(phase6SQL);
console.log('\n✅ Copie o SQL acima e execute no Supabase SQL Editor');
console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');

