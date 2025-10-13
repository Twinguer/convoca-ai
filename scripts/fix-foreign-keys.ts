import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const developmentUrl = process.env.VITE_SUPABASE_URL;
const developmentServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!developmentUrl || !developmentServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Verifique se o arquivo .env.local está configurado corretamente.');
  process.exit(1);
}

const targetSupabase = createClient(developmentUrl, developmentServiceKey);

async function generateFixForeignKeysSql() {
  console.log('🔧 Corrigindo relacionamentos entre tabelas...');
  
  const sql = `
-- =====================================================
-- CORRIGIR RELACIONAMENTOS E FOREIGN KEYS
-- OBJETIVO: Estabelecer relacionamentos corretos entre tabelas
-- =====================================================

-- 1. REMOVER CONSTRAINTS EXISTENTES PROBLEMÁTICAS
-- =====================================================

-- Remover constraints de foreign key existentes que podem estar causando problemas
ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS fk_user_rankings_user;
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS fk_user_answers_user;
ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS fk_user_rankings_ranking;
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS fk_user_answers_ranking;

-- 2. CRIAR RELACIONAMENTOS CORRETOS
-- =====================================================

-- Relacionamento: user_rankings -> users_profiles
ALTER TABLE user_rankings 
  ADD CONSTRAINT fk_user_rankings_user_profile
  FOREIGN KEY (user_id) REFERENCES users_profiles(id) ON DELETE CASCADE;

-- Relacionamento: user_rankings -> rankings
ALTER TABLE user_rankings 
  ADD CONSTRAINT fk_user_rankings_ranking
  FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Relacionamento: user_answers -> users_profiles
ALTER TABLE user_answers 
  ADD CONSTRAINT fk_user_answers_user_profile
  FOREIGN KEY (user_id) REFERENCES users_profiles(id) ON DELETE CASCADE;

-- Relacionamento: user_answers -> rankings
ALTER TABLE user_answers 
  ADD CONSTRAINT fk_user_answers_ranking
  FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Relacionamento: ranking_answers -> rankings
ALTER TABLE ranking_answers 
  ADD CONSTRAINT fk_ranking_answers_ranking
  FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Relacionamento: ranking_disciplines -> rankings
ALTER TABLE ranking_disciplines 
  ADD CONSTRAINT fk_ranking_disciplines_ranking
  FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para foreign keys
CREATE INDEX IF NOT EXISTS idx_user_rankings_user_id 
  ON user_rankings (user_id);

CREATE INDEX IF NOT EXISTS idx_user_rankings_ranking_id 
  ON user_rankings (ranking_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_user_id 
  ON user_answers (user_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_ranking_id 
  ON user_answers (ranking_id);

CREATE INDEX IF NOT EXISTS idx_ranking_answers_ranking_id 
  ON ranking_answers (ranking_id);

CREATE INDEX IF NOT EXISTS idx_ranking_disciplines_ranking_id 
  ON ranking_disciplines (ranking_id);

-- 4. ATUALIZAR COMENTÁRIOS
-- =====================================================

COMMENT ON CONSTRAINT fk_user_rankings_user_profile ON user_rankings 
  IS 'Relacionamento: user_rankings -> users_profiles';

COMMENT ON CONSTRAINT fk_user_rankings_ranking ON user_rankings 
  IS 'Relacionamento: user_rankings -> rankings';

COMMENT ON CONSTRAINT fk_user_answers_user_profile ON user_answers 
  IS 'Relacionamento: user_answers -> users_profiles';

COMMENT ON CONSTRAINT fk_user_answers_ranking ON user_answers 
  IS 'Relacionamento: user_answers -> rankings';

COMMENT ON CONSTRAINT fk_ranking_answers_ranking ON ranking_answers 
  IS 'Relacionamento: ranking_answers -> rankings';

COMMENT ON CONSTRAINT fk_ranking_disciplines_ranking ON ranking_disciplines 
  IS 'Relacionamento: ranking_disciplines -> rankings';

-- 5. VERIFICAR INTEGRIDADE DOS DADOS
-- =====================================================

-- Verificar se há dados órfãos
SELECT 'user_rankings órfãos' as tabela, COUNT(*) as registros
FROM user_rankings ur
LEFT JOIN users_profiles up ON ur.user_id = up.id
WHERE up.id IS NULL

UNION ALL

SELECT 'user_rankings sem ranking' as tabela, COUNT(*) as registros
FROM user_rankings ur
LEFT JOIN rankings r ON ur.ranking_id = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 'user_answers órfãos' as tabela, COUNT(*) as registros
FROM user_answers ua
LEFT JOIN users_profiles up ON ua.user_id = up.id
WHERE up.id IS NULL

UNION ALL

SELECT 'user_answers sem ranking' as tabela, COUNT(*) as registros
FROM user_answers ua
LEFT JOIN rankings r ON ua.ranking_id = r.id
WHERE r.id IS NULL;
`;

  console.log('📝 SQL para corrigir relacionamentos:\n================================================================================\n');
  console.log(sql);
  console.log('\n================================================================================\n');
  console.log(`🔗 Execute este SQL no Supabase SQL Editor:\nhttps://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_REF_ID}/sql`);
  console.log('\n📋 Passos para executar:\n1. Acesse o link acima\n2. Cole o SQL na área de texto\n3. Clique em "Run" para executar\n4. Aguarde a confirmação de sucesso\n5. Execute: npm run diagnose:failed-tests');
}

if (import.meta.main) {
  generateFixForeignKeysSql().catch(console.error);
}

export { generateFixForeignKeysSql };



