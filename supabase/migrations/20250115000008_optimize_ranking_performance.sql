-- Performance optimization for ranking system
-- Add additional indexes for better query performance

-- 1. Composite index for user rankings queries
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_ranking_position 
ON user_ranking_new (ranking_id, "position") 
WHERE "position" IS NOT NULL;

-- 2. Index for reservation type filtering
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_reservation_ranking 
ON user_ranking_new (reservation_type, ranking_id);

-- 3. Index for score-based queries
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_score_desc 
ON user_ranking_new (score DESC) 
WHERE score IS NOT NULL;

-- 4. Index for ranking creation date queries
CREATE INDEX IF NOT EXISTS idx_create_ranking_new_created_at_desc 
ON create_ranking_new (created_at DESC);

-- 5. Index for ranking status filtering
CREATE INDEX IF NOT EXISTS idx_create_ranking_new_status_created 
ON create_ranking_new (status, created_at DESC);

-- 6. Note: public_user_profiles is a view, indexes are on the underlying users_profiles table

-- 7. Partial index for active rankings only
CREATE INDEX IF NOT EXISTS idx_create_ranking_new_active 
ON create_ranking_new (created_at DESC) 
WHERE status = 'Em andamento';

-- 8. Index for user participation queries
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_user_ranking 
ON user_ranking_new (user_id, ranking_id);

-- 9. Index for metadata queries (JSONB)
CREATE INDEX IF NOT EXISTS idx_user_ranking_new_metadata_gin 
ON user_ranking_new USING GIN (metadata);

-- Add comments for documentation
COMMENT ON INDEX idx_user_ranking_new_ranking_position IS 'Composite index for ranking position queries';
COMMENT ON INDEX idx_user_ranking_new_reservation_ranking IS 'Index for reservation type filtering with ranking';
COMMENT ON INDEX idx_user_ranking_new_score_desc IS 'Index for score-based sorting and filtering';
COMMENT ON INDEX idx_create_ranking_new_created_at_desc IS 'Index for ranking creation date sorting';
COMMENT ON INDEX idx_create_ranking_new_status_created IS 'Index for status filtering with creation date';
COMMENT ON INDEX idx_create_ranking_new_active IS 'Partial index for active rankings only';
COMMENT ON INDEX idx_user_ranking_new_user_ranking IS 'Index for user participation queries';
COMMENT ON INDEX idx_user_ranking_new_metadata_gin IS 'GIN index for metadata JSONB queries';
