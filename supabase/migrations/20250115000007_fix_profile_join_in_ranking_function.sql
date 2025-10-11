-- Fix profile data join in ranking function
-- Update get_user_rankings_for_ranking to use public_user_profiles view

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
    pup.name as user_name,  -- Use public_user_profiles view
    pup.avatar_url,         -- Use public_user_profiles view
    ur.created_at
  FROM user_ranking_new ur
  LEFT JOIN public_user_profiles pup ON ur.user_id = pup.id  -- Use public view instead of users_profiles
  WHERE 
    ur.ranking_id = p_ranking_id
    AND (p_reservation_type IS NULL OR ur.reservation_type = p_reservation_type)
  ORDER BY ur."position" ASC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_rankings_for_ranking IS 'Get user rankings for a specific ranking with profile data from public view';
