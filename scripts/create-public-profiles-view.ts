import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPublicProfilesView() {
  console.log('🔧 Criando VIEW public_profiles...');

  try {
    // SQL para criar a VIEW public_profiles
    const createViewSQL = `
-- =====================================================
-- CRIAR VIEW public_profiles
-- BANCO: nomeia-ai
-- DATA: ${new Date().toISOString()}
-- =====================================================

-- Criar VIEW public_profiles baseada em users_profiles
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  created_at,
  updated_at,
  bio,
  estado,
  formacao,
  cargo_atual,
  area_estudos,
  especialidade,
  curso_preparatorio,
  rotina_estudos,
  status_concurseiro,
  nickname,
  concursos_aprovados,
  concursos_participando,
  profile_text,
  is_studying,
  study_started_at,
  privacy_settings
FROM users_profiles;

-- Comentários
COMMENT ON VIEW public_profiles IS 'View pública dos perfis de usuários baseada em users_profiles';

-- Verificar se a VIEW foi criada
SELECT 'public_profiles view created successfully' as status;
`;

    console.log('\n📝 SQL para criar VIEW public_profiles:');
    console.log(createViewSQL);

    console.log('\n⚠️  ATENÇÃO: Este SQL deve ser executado manualmente no Supabase SQL Editor!');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
    console.log('📋 Copie e cole o SQL acima no editor');

    // Testar se a VIEW já existe
    console.log('\n🔍 Testando se public_profiles já existe...');
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, name')
        .limit(1);

      if (error) {
        console.log('❌ public_profiles não existe:', error.message);
        console.log('✅ Precisa criar a VIEW');
      } else {
        console.log('✅ public_profiles já existe e está acessível');
        console.log('   Dados encontrados:', data?.length || 0, 'registros');
      }
    } catch (err) {
      console.log('❌ Erro ao testar public_profiles:', err);
    }

    console.log('\n🎯 PRÓXIMO PASSO:');
    console.log('=' .repeat(50));
    console.log('1. Execute o SQL acima no Supabase SQL Editor');
    console.log('2. Depois execute: npm run fix:profile-code');
    console.log('3. Teste o carregamento de perfis');

  } catch (error) {
    console.error('❌ Erro ao criar VIEW:', error);
  }
}

createPublicProfilesView();



