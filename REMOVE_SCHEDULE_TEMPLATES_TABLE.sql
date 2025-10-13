-- =====================================================
-- SCRIPT MANUAL: Remover tabela schedule_templates
-- OBJETIVO: Limpar funcionalidade não implementada
-- EXECUTAR: No Supabase SQL Editor
-- =====================================================

-- Verificar se a tabela existe antes de remover
DO $$
DECLARE
  table_exists BOOLEAN;
  table_count INTEGER;
BEGIN
  -- Verificar se a tabela existe
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'schedule_templates'
  ) INTO table_exists;
  
  IF table_exists THEN
    -- Contar registros se existir
    SELECT COUNT(*) INTO table_count FROM schedule_templates;
    
    IF table_count > 0 THEN
      RAISE NOTICE 'Tabela schedule_templates contém % registros. Removendo com dados.', table_count;
    ELSE
      RAISE NOTICE 'Tabela schedule_templates está vazia. Removendo com segurança.';
    END IF;
    
    -- Remover tabela (CASCADE remove dependências)
    DROP TABLE IF EXISTS schedule_templates CASCADE;
    RAISE NOTICE 'Tabela schedule_templates removida com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela schedule_templates não existe. Nada a fazer.';
  END IF;
END $$;

-- Verificar se há funções relacionadas que precisam ser removidas
DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  -- Verificar se há funções específicas para schedule_templates
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name LIKE '%schedule_template%'
  ) INTO func_exists;
  
  IF func_exists THEN
    -- Listar e remover funções relacionadas
    FOR func_exists IN 
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%schedule_template%'
    LOOP
      EXECUTE 'DROP FUNCTION IF EXISTS ' || func_exists || '() CASCADE';
      RAISE NOTICE 'Função % removida.', func_exists;
    END LOOP;
  END IF;
END $$;

-- Verificar estrutura final
SELECT 
  'Verificação Final' as status,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'schedule_templates'
    ) THEN 'ERRO: Tabela ainda existe'
    ELSE 'SUCESSO: Tabela removida'
  END as resultado;
