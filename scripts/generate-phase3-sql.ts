import 'dotenv/config';

console.log('🚀 GERANDO SQL PARA FASE 3 - ESTRUTURA USER_RANKINGS');
console.log('=' .repeat(60));

const phase3SQL = `
-- =====================================================
-- FASE 3: ADICIONAR COLUNAS JSONB À TABELA USER_RANKINGS
-- =====================================================

-- 1. Adicionar colunas JSONB para participações
ALTER TABLE user_rankings ADD COLUMN IF NOT EXISTS participations JSONB DEFAULT '{}';
ALTER TABLE user_rankings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Adicionar colunas para controle
ALTER TABLE user_rankings ADD COLUMN IF NOT EXISTS selected_booklet TEXT;
ALTER TABLE user_rankings ADD COLUMN IF NOT EXISTS reservation_type TEXT DEFAULT 'Ampla Concorrência';

-- 3. Criar índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_user_rankings_concurso_score ON user_rankings (concurso_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id ON user_rankings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_rankings_selected_booklet ON user_rankings (concurso_id, selected_booklet);

-- 4. Criar índices GIN para JSONB
CREATE INDEX IF NOT EXISTS idx_user_rankings_participations_gin ON user_rankings USING GIN (participations);

-- 5. Verificar estrutura atualizada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_rankings' 
  AND table_schema = 'public'
  AND column_name IN ('participations', 'metadata', 'selected_booklet', 'reservation_type')
ORDER BY column_name;
`;

console.log('\n📋 SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
console.log('=' .repeat(60));
console.log(phase3SQL);
console.log('\n✅ Copie o SQL acima e execute no Supabase SQL Editor');
console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');



