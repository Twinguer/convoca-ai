import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function fixForeignKeyConstraintV2() {
  console.log('🔧 Ajustando constraint de foreign key (versão 2)...');
  
  const fixForeignKeySQL = `
-- =====================================================
-- AJUSTAR CONSTRAINT DE FOREIGN KEY (VERSÃO 2)
-- =====================================================

-- 1. Remover constraint de foreign key temporariamente
ALTER TABLE users_profiles DROP CONSTRAINT IF EXISTS users_profiles_id_fkey;

-- 2. Comentários
COMMENT ON COLUMN users_profiles.id IS 'ID do usuário (referência para auth.users - constraint temporariamente removida para migração)';

-- 3. Nota: Após a migração, podemos recriar a constraint se necessário
-- ALTER TABLE users_profiles ADD CONSTRAINT users_profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
`;

  console.log('📝 SQL para ajustar constraint de foreign key (versão 2):');
  console.log('='.repeat(80));
  console.log(fixForeignKeySQL);
  console.log('='.repeat(80));
  
  console.log('\n🔗 Execute este SQL no Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
  
  console.log('\n📋 Passos para executar:');
  console.log('1. Acesse o link acima');
  console.log('2. Cole o SQL na área de texto');
  console.log('3. Clique em "Run" para executar');
  console.log('4. Aguarde a confirmação de sucesso');
  console.log('5. Execute: npm run migrate:data');
  
  return fixForeignKeySQL;
}

// Executar geração
fixForeignKeyConstraintV2().catch(console.error);

