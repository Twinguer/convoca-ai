import 'dotenv/config';

console.log('🚀 GERANDO SQL PARA FASE 2 - ESTRUTURA CONCURSOS');
console.log('=' .repeat(60));

const phase2SQL = `
-- =====================================================
-- FASE 2: ADICIONAR COLUNAS JSONB À TABELA CONCURSOS
-- =====================================================

-- 1. Adicionar colunas JSONB para dados consolidados
ALTER TABLE concursos ADD COLUMN IF NOT EXISTS official_answers JSONB DEFAULT '{}';
ALTER TABLE concursos ADD COLUMN IF NOT EXISTS exam_booklets JSONB DEFAULT '[]';
ALTER TABLE concursos ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{}';
ALTER TABLE concursos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Adicionar colunas para controle
ALTER TABLE concursos ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;

-- 3. Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_concursos_titulo ON concursos (titulo);
CREATE INDEX IF NOT EXISTS idx_concursos_orgao ON concursos (orgao);
CREATE INDEX IF NOT EXISTS idx_concursos_banca ON concursos (banca);
CREATE INDEX IF NOT EXISTS idx_concursos_status ON concursos (status);
CREATE INDEX IF NOT EXISTS idx_concursos_created_by ON concursos (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_concursos_created_at ON concursos (created_at DESC);

-- 4. Criar índices GIN para JSONB
CREATE INDEX IF NOT EXISTS idx_concursos_official_answers_gin ON concursos USING GIN (official_answers);
CREATE INDEX IF NOT EXISTS idx_concursos_exam_booklets_gin ON concursos USING GIN (exam_booklets);
CREATE INDEX IF NOT EXISTS idx_concursos_form_config_gin ON concursos USING GIN (form_config);

-- 5. Verificar estrutura atualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'concursos' 
  AND table_schema = 'public'
  AND column_name IN ('official_answers', 'exam_booklets', 'form_config', 'metadata', 'total_participants')
ORDER BY column_name;
`;

console.log('\n📋 SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
console.log('=' .repeat(60));
console.log(phase2SQL);
console.log('\n✅ Copie o SQL acima e execute no Supabase SQL Editor');
console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');

