-- Remover função RPC antiga manage_exam_booklets
DROP FUNCTION IF EXISTS public.manage_exam_booklets(text, uuid, uuid, text, integer, jsonb);
DROP FUNCTION IF EXISTS public.manage_exam_booklets(text, uuid, jsonb);

-- Verificar se foi removida
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname LIKE '%manage_exam_booklets%';

