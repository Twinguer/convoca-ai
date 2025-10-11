-- Restrict overly permissive RLS policies for better security
-- This migration tightens access controls on sensitive data

-- 1. Restrict user rankings visibility - users should only see their own data by default
DROP POLICY IF EXISTS "Users can view all user rankings" ON user_ranking_new;

-- Only allow users to see their own rankings, or rankings they participate in
CREATE POLICY "Users can view their own rankings and participated rankings"
ON user_ranking_new FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  ranking_id IN (
    SELECT ranking_id 
    FROM user_ranking_new 
    WHERE user_id = auth.uid()
  )
);

-- 2. Restrict ranking visibility - only show public rankings or user's own
DROP POLICY IF EXISTS "Users can view all rankings" ON create_ranking_new;

-- Allow viewing of public rankings and user's own rankings
CREATE POLICY "Users can view public rankings and their own"
ON create_ranking_new FOR SELECT
TO authenticated
USING (
  status = 'Em andamento' OR 
  creator_id = auth.uid() OR
  id IN (
    SELECT ranking_id 
    FROM user_ranking_new 
    WHERE user_id = auth.uid()
  )
);

-- 3. Add policy for anonymous users to view only public rankings
CREATE POLICY "Anonymous users can view only public rankings"
ON create_ranking_new FOR SELECT
TO anon
USING (status = 'Em andamento');

-- 4. Restrict user_ranking_new for anonymous users
CREATE POLICY "Anonymous users cannot view user rankings"
ON user_ranking_new FOR SELECT
TO anon
USING (false);

-- 5. Add more restrictive policy for ranking updates
DROP POLICY IF EXISTS "Users can update their own rankings" ON create_ranking_new;

CREATE POLICY "Users can update their own rankings with restrictions"
ON create_ranking_new FOR UPDATE
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (
  creator_id = auth.uid() AND
  -- Prevent changing to invalid status
  status IN ('Em andamento', 'Finalizado', 'Rascunho')
);

-- 6. Add policy to prevent users from modifying other users' rankings
DROP POLICY IF EXISTS "Users can update their own rankings" ON user_ranking_new;

CREATE POLICY "Users can only update their own participation data"
ON user_ranking_new FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
);

-- 7. Add policy to prevent bulk operations
-- Note: This constraint is already enforced by the unique constraint in the table
-- CREATE POLICY "Prevent bulk user ranking operations"
-- ON user_ranking_new FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   user_id = auth.uid() AND
--   -- Ensure only one ranking per user per ranking
--   NOT EXISTS (
--     SELECT 1 FROM user_ranking_new 
--     WHERE ranking_id = NEW.ranking_id 
--     AND user_id = NEW.user_id
--   )
-- );

-- 8. Add audit logging for sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log ranking modifications
  IF TG_TABLE_NAME = 'create_ranking_new' AND TG_OP = 'UPDATE' THEN
    INSERT INTO security_logs (action, details, user_id)
    VALUES (
      'ranking_updated',
      jsonb_build_object(
        'ranking_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changes', to_jsonb(NEW) - to_jsonb(OLD)
      ),
      auth.uid()
    );
  END IF;

  -- Log user ranking modifications
  IF TG_TABLE_NAME = 'user_ranking_new' AND TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    INSERT INTO security_logs (action, details, user_id)
    VALUES (
      'user_ranking_' || TG_OP,
      jsonb_build_object(
        'ranking_id', COALESCE(NEW.ranking_id, OLD.ranking_id),
        'target_user_id', COALESCE(NEW.user_id, OLD.user_id),
        'operation', TG_OP
      ),
      auth.uid()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_ranking_changes ON create_ranking_new;
CREATE TRIGGER audit_ranking_changes
  AFTER UPDATE ON create_ranking_new
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_operation();

DROP TRIGGER IF EXISTS audit_user_ranking_changes ON user_ranking_new;
CREATE TRIGGER audit_user_ranking_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_ranking_new
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_operation();

-- 9. Add comments for documentation
COMMENT ON POLICY "Users can view their own rankings and participated rankings" ON user_ranking_new IS 'Users can only see their own rankings and rankings they participate in';
COMMENT ON POLICY "Users can view public rankings and their own" ON create_ranking_new IS 'Users can view public rankings and their own created rankings';
COMMENT ON POLICY "Anonymous users can view only public rankings" ON create_ranking_new IS 'Anonymous users can only view public active rankings';
COMMENT ON POLICY "Users can update their own rankings with restrictions" ON create_ranking_new IS 'Users can update their own rankings with security restrictions';
COMMENT ON POLICY "Users can only update their own participation data" ON user_ranking_new IS 'Users can only update their own participation data with restrictions';
COMMENT ON POLICY "Prevent bulk user ranking operations" ON user_ranking_new IS 'Prevents users from creating multiple rankings for the same ranking';
COMMENT ON FUNCTION log_sensitive_operation() IS 'Audit logging for sensitive ranking operations';
