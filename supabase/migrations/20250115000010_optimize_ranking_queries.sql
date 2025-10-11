-- =====================================================
-- OTIMIZAÇÃO DE QUERIES DE RANKING - FASE 2
-- =====================================================

-- Função otimizada para buscar rankings com paginação
CREATE OR REPLACE FUNCTION get_rankings_optimized(
  p_concurso_id UUID,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50,
  p_reservation_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  score NUMERIC,
  discursive_score NUMERIC,
  case_study_1_score NUMERIC,
  case_study_2_score NUMERIC,
  case_study_3_score NUMERIC,
  weighted_discursive_score NUMERIC,
  weighted_case_study_1_score NUMERIC,
  weighted_case_study_2_score NUMERIC,
  weighted_case_study_3_score NUMERIC,
  subject_scores JSONB,
  custom_discipline_scores JSONB,
  weighted_custom_discipline_scores JSONB,
  reservation_type TEXT,
  user_name TEXT,
  user_avatar_url TEXT,
  concurso_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ranking_data AS (
    SELECT 
      ur.id,
      ur.user_id,
      ur.score,
      ur.discursive_score,
      ur.case_study_1_score,
      ur.case_study_2_score,
      ur.case_study_3_score,
      ur.weighted_discursive_score,
      ur.weighted_case_study_1_score,
      ur.weighted_case_study_2_score,
      ur.weighted_case_study_3_score,
      ur.subject_scores,
      ur.custom_discipline_scores,
      ur.weighted_custom_discipline_scores,
      ur.reservation_type,
      pup.name as user_name,
      pup.avatar_url as user_avatar_url,
      jsonb_build_object(
        'id', c.id,
        'total_minimum_score', c.total_minimum_score,
        'has_minimum_score', c.has_minimum_score,
        'disciplines', c.disciplines
      ) as concurso_data
    FROM user_ranking_new ur
    INNER JOIN public_user_profiles pup ON ur.user_id = pup.id
    INNER JOIN concursos c ON ur.concurso_id = c.id
    WHERE ur.concurso_id = p_concurso_id
      AND (p_reservation_type IS NULL OR ur.reservation_type = p_reservation_type)
    ORDER BY ur.score DESC
    OFFSET p_offset
    LIMIT p_limit
  )
  SELECT * FROM ranking_data;
END;
$$;

-- Função para contar total de rankings
CREATE OR REPLACE FUNCTION count_rankings_optimized(
  p_concurso_id UUID,
  p_reservation_type TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM user_ranking_new ur
  WHERE ur.concurso_id = p_concurso_id
    AND (p_reservation_type IS NULL OR ur.reservation_type = p_reservation_type);
  
  RETURN total_count;
END;
$$;

-- Função para buscar dados básicos do concurso
CREATE OR REPLACE FUNCTION get_concurso_basic_data(p_concurso_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  total_minimum_score NUMERIC,
  has_minimum_score BOOLEAN,
  disciplines JSONB,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.total_minimum_score,
    c.has_minimum_score,
    c.disciplines,
    c.created_at,
    c.is_active
  FROM concursos c
  WHERE c.id = p_concurso_id;
END;
$$;

-- Função para buscar estatísticas de ranking
CREATE OR REPLACE FUNCTION get_ranking_stats(p_concurso_id UUID)
RETURNS TABLE (
  total_participants INTEGER,
  average_score NUMERIC,
  highest_score NUMERIC,
  lowest_score NUMERIC,
  reservation_types JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total_participants,
      AVG(score) as average_score,
      MAX(score) as highest_score,
      MIN(score) as lowest_score,
      jsonb_agg(DISTINCT reservation_type) as reservation_types
    FROM user_ranking_new
    WHERE concurso_id = p_concurso_id
  )
  SELECT * FROM stats;
END;
$$;

-- Função para buscar ranking de um usuário específico
CREATE OR REPLACE FUNCTION get_user_ranking_position(
  p_concurso_id UUID,
  p_user_id UUID,
  p_reservation_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  position INTEGER,
  total_participants INTEGER,
  score NUMERIC,
  percentile NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_position INTEGER;
  total_participants INTEGER;
  user_score NUMERIC;
  user_percentile NUMERIC;
BEGIN
  -- Buscar posição do usuário
  WITH ranked_users AS (
    SELECT 
      user_id,
      score,
      ROW_NUMBER() OVER (ORDER BY score DESC) as position
    FROM user_ranking_new
    WHERE concurso_id = p_concurso_id
      AND (p_reservation_type IS NULL OR reservation_type = p_reservation_type)
  )
  SELECT 
    ru.position,
    (SELECT COUNT(*) FROM ranked_users) as total,
    ru.score
  INTO user_position, total_participants, user_score
  FROM ranked_users ru
  WHERE ru.user_id = p_user_id;

  -- Calcular percentil
  IF total_participants > 0 THEN
    user_percentile := ((total_participants - user_position + 1)::NUMERIC / total_participants::NUMERIC) * 100;
  ELSE
    user_percentile := 0;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(user_position, 0) as position,
    total_participants,
    COALESCE(user_score, 0) as score,
    COALESCE(user_percentile, 0) as percentile;
END;
$$;

-- Índices adicionais para otimização
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_concurso_score_desc 
ON user_ranking_new(concurso_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_user_ranking_new_concurso_reservation_score 
ON user_ranking_new(concurso_id, reservation_type, score DESC);

CREATE INDEX IF NOT EXISTS idx_user_ranking_new_user_concurso 
ON user_ranking_new(user_id, concurso_id);

-- Comentários para documentação
COMMENT ON FUNCTION get_rankings_optimized IS 'Função otimizada para buscar rankings com paginação e JOINs eficientes';
COMMENT ON FUNCTION count_rankings_optimized IS 'Função para contar total de rankings de forma eficiente';
COMMENT ON FUNCTION get_concurso_basic_data IS 'Função para buscar dados básicos do concurso sem JOINs desnecessários';
COMMENT ON FUNCTION get_ranking_stats IS 'Função para calcular estatísticas de ranking de forma otimizada';
COMMENT ON FUNCTION get_user_ranking_position IS 'Função para buscar posição específica de um usuário no ranking';
