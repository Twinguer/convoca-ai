-- =====================================================
-- SCRIPT: Remove exam_booklets_backup Table
-- OBJETIVO: Remover tabela de backup obsoleta exam_booklets_backup
-- DATA: 2025-01-15
-- =====================================================

-- 1. Verificar se há dados na tabela exam_booklets_backup antes de remover
-- =====================================================
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM exam_booklets_backup;
  
  IF backup_count > 0 THEN
    RAISE NOTICE 'Tabela exam_booklets_backup contém % registros de backup. Dados originais já migrados para concursos.exam_booklets JSONB.', backup_count;
  ELSE
    RAISE NOTICE 'Tabela exam_booklets_backup está vazia. Removendo com segurança.';
  END IF;
END $$;

-- 2. Remover tabela de backup (CASCADE remove dependências)
-- =====================================================
DROP TABLE IF EXISTS exam_booklets_backup CASCADE;

-- 3. Verificar se a tabela foi removida
-- =====================================================
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE tablename = 'exam_booklets_backup'
  AND schemaname = 'public';

-- Se não retornar nenhuma linha, a tabela foi removida com sucesso!
