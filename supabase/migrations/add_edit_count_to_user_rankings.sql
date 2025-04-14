
-- Add edit_count column to user_rankings table
ALTER TABLE public.user_rankings ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Comment on the new column
COMMENT ON COLUMN public.user_rankings.edit_count IS 'Track number of times a user has edited their answer sheet (limit is 3)';
