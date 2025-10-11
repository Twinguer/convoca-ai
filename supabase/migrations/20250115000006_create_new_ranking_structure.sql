-- Migration: Create new ranking structure (Phase 1)
-- This creates new tables in parallel without affecting existing ones
-- Data migration will happen in Phase 2

-- 1. Create create_ranking_new table
CREATE TABLE create_ranking_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  orgao TEXT NOT NULL,
  banca TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ranking_config JSONB NOT NULL DEFAULT '{}',
  official_answer_key JSONB NOT NULL DEFAULT '{}',
  question_booklets JSONB DEFAULT '{}'
);

-- 2. Create user_ranking_new table
CREATE TABLE user_ranking_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES create_ranking_new(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  "position" INTEGER DEFAULT 0,
  reservation_type TEXT DEFAULT 'Ampla Concorrência',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_answers JSONB NOT NULL DEFAULT '{}',
  calculated_scores JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT user_ranking_new_ranking_user_unique UNIQUE (ranking_id, user_id)
);

-- 3. Create indexes for performance
-- Indexes for create_ranking_new
CREATE INDEX idx_create_ranking_new_titulo ON create_ranking_new (titulo);
CREATE INDEX idx_create_ranking_new_orgao ON create_ranking_new (orgao);
CREATE INDEX idx_create_ranking_new_banca ON create_ranking_new (banca);
CREATE INDEX idx_create_ranking_new_status ON create_ranking_new (status);
CREATE INDEX idx_create_ranking_new_creator ON create_ranking_new (creator_id);
CREATE INDEX idx_create_ranking_new_created_at ON create_ranking_new (created_at DESC);

-- Indexes for user_ranking_new
CREATE INDEX idx_user_ranking_new_ranking_id ON user_ranking_new (ranking_id);
CREATE INDEX idx_user_ranking_new_user_id ON user_ranking_new (user_id);
CREATE INDEX idx_user_ranking_new_score ON user_ranking_new (score DESC);
CREATE INDEX idx_user_ranking_new_position ON user_ranking_new ("position");
CREATE INDEX idx_user_ranking_new_reservation ON user_ranking_new (reservation_type);
CREATE INDEX idx_user_ranking_new_created_at ON user_ranking_new (created_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_create_ranking_new_config_gin ON create_ranking_new USING GIN (ranking_config);
CREATE INDEX idx_create_ranking_new_answer_key_gin ON create_ranking_new USING GIN (official_answer_key);
CREATE INDEX idx_create_ranking_new_booklets_gin ON create_ranking_new USING GIN (question_booklets);
CREATE INDEX idx_user_ranking_new_answers_gin ON user_ranking_new USING GIN (user_answers);
CREATE INDEX idx_user_ranking_new_scores_gin ON user_ranking_new USING GIN (calculated_scores);
CREATE INDEX idx_user_ranking_new_metadata_gin ON user_ranking_new USING GIN (metadata);

-- 4. Enable RLS
ALTER TABLE create_ranking_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ranking_new ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for create_ranking_new
CREATE POLICY "Users can view all rankings" 
ON create_ranking_new FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create rankings" 
ON create_ranking_new FOR INSERT 
TO authenticated 
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own rankings" 
ON create_ranking_new FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

CREATE POLICY "Users can delete their own rankings" 
ON create_ranking_new FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- 6. Create RLS policies for user_ranking_new
CREATE POLICY "Users can view all user rankings" 
ON user_ranking_new FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create their own rankings" 
ON user_ranking_new FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rankings" 
ON user_ranking_new FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rankings" 
ON user_ranking_new FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- 7. Create helper functions for the new structure
CREATE OR REPLACE FUNCTION get_rankings_with_filters(
  p_titulo TEXT DEFAULT NULL,
  p_orgao TEXT DEFAULT NULL,
  p_banca TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  titulo TEXT,
  orgao TEXT,
  banca TEXT,
  status TEXT,
  participant_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.titulo,
    cr.orgao,
    cr.banca,
    cr.status,
    COUNT(ur.id) as participant_count,
    cr.created_at
  FROM create_ranking_new cr
  LEFT JOIN user_ranking_new ur ON cr.id = ur.ranking_id
  WHERE 
    (p_titulo IS NULL OR cr.titulo ILIKE '%' || p_titulo || '%')
    AND (p_orgao IS NULL OR cr.orgao ILIKE '%' || p_orgao || '%')
    AND (p_banca IS NULL OR cr.banca ILIKE '%' || p_banca || '%')
    AND (p_status IS NULL OR cr.status = p_status)
  GROUP BY cr.id, cr.titulo, cr.orgao, cr.banca, cr.status, cr.created_at
  ORDER BY cr.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 8. Create function to get user rankings for a specific ranking
CREATE OR REPLACE FUNCTION get_user_rankings_for_ranking(
  p_ranking_id UUID,
  p_reservation_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  score NUMERIC,
  "position" INTEGER,
  reservation_type TEXT,
  user_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ur.id,
    ur.user_id,
    ur.score,
    ur."position",
    ur.reservation_type,
    up.name as user_name,
    up.avatar_url,
    ur.created_at
  FROM user_ranking_new ur
  LEFT JOIN users_profiles up ON ur.user_id = up.id
  WHERE 
    ur.ranking_id = p_ranking_id
    AND (p_reservation_type IS NULL OR ur.reservation_type = p_reservation_type)
  ORDER BY ur."position" ASC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- 9. Create function to calculate user ranking score
CREATE OR REPLACE FUNCTION calculate_user_ranking_score_v2(
  p_user_ranking_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_ranking RECORD;
  v_ranking_config JSONB;
  v_official_answers JSONB;
  v_user_answers JSONB;
  v_calculated_scores JSONB;
  v_total_score NUMERIC := 0;
BEGIN
  -- Get user ranking data
  SELECT 
    ur.id,
    ur.ranking_id,
    ur.user_id,
    ur.score,
    ur."position",
    ur.reservation_type,
    ur.created_at,
    ur.updated_at,
    ur.user_answers,
    ur.calculated_scores,
    ur.metadata,
    cr.ranking_config,
    cr.official_answer_key
  INTO 
    v_user_ranking.id,
    v_user_ranking.ranking_id,
    v_user_ranking.user_id,
    v_user_ranking.score,
    v_user_ranking."position",
    v_user_ranking.reservation_type,
    v_user_ranking.created_at,
    v_user_ranking.updated_at,
    v_user_ranking.user_answers,
    v_user_ranking.calculated_scores,
    v_user_ranking.metadata,
    v_ranking_config,
    v_official_answers
  FROM user_ranking_new ur
  JOIN create_ranking_new cr ON ur.ranking_id = cr.id
  WHERE ur.id = p_user_ranking_id;

  IF NOT FOUND THEN
    RETURN '{"error": "User ranking not found"}'::jsonb;
  END IF;

  -- For now, return the existing calculated_scores
  -- This will be enhanced in Phase 2 with actual calculation logic
  v_calculated_scores := COALESCE(v_user_ranking.calculated_scores, '{}'::jsonb);
  
  -- Extract total score
  v_total_score := COALESCE((v_calculated_scores->>'total')::NUMERIC, 0);

  -- Update the user ranking with calculated scores
  UPDATE user_ranking_new
  SET 
    calculated_scores = v_calculated_scores,
    score = v_total_score,
    updated_at = NOW()
  WHERE id = p_user_ranking_id;

  RETURN v_calculated_scores;
END;
$function$;

-- 10. Add comments for documentation
COMMENT ON TABLE create_ranking_new IS 'New ranking structure - stores ranking creation data and official answer keys';
COMMENT ON TABLE user_ranking_new IS 'New ranking structure - stores user participation data and calculated scores';
COMMENT ON COLUMN create_ranking_new.ranking_config IS 'JSONB containing all ranking configuration data from creation form';
COMMENT ON COLUMN create_ranking_new.official_answer_key IS 'JSONB containing official answer key for all booklets';
COMMENT ON COLUMN create_ranking_new.question_booklets IS 'JSONB containing question booklets (optional)';
COMMENT ON COLUMN user_ranking_new.user_answers IS 'JSONB containing user answers for all booklets';
COMMENT ON COLUMN user_ranking_new.calculated_scores IS 'JSONB containing calculated scores and statistics';
COMMENT ON COLUMN user_ranking_new.metadata IS 'JSONB containing additional metadata about user participation';

-- 11. Add a comment to track this migration
COMMENT ON SCHEMA public IS 'Updated 2025-01-15: Added new ranking structure tables (Phase 1) - create_ranking_new and user_ranking_new';
