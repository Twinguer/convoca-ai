-- Script para auditar funções SQL sem search_path
-- Executar no Supabase SQL Editor

-- 1. Buscar todas as funções que não têm search_path definido
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NULL THEN 'NO CONFIG'
        ELSE array_to_string(p.proconfig, ', ')
    END as configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- functions only
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
  AND (
    p.proconfig IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS config 
      WHERE config LIKE 'search_path=%'
    )
  )
ORDER BY p.proname;

-- 2. Buscar funções SECURITY DEFINER que podem precisar de revisão
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    array_to_string(p.proconfig, ', ') as configuration
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prosecdef = true  -- SECURITY DEFINER
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
ORDER BY p.proname;

-- 3. Contar funções por tipo de configuração
SELECT 
    CASE 
        WHEN p.proconfig IS NULL THEN 'NO CONFIG'
        WHEN EXISTS (SELECT 1 FROM unnest(p.proconfig) AS config WHERE config LIKE 'search_path=%') 
        THEN 'HAS SEARCH_PATH'
        ELSE 'OTHER CONFIG'
    END as config_type,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
GROUP BY 1
ORDER BY 2 DESC;
