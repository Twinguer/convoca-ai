import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixProfileTableReferences() {
  console.log('🔧 Corrigindo referências de tabelas nos perfis...');

  try {
    // 1. Verificar se as tabelas existem
    console.log('\n📋 Verificando tabelas necessárias:');
    console.log('=' .repeat(50));

    const tablesToCheck = [
      'public_profiles',
      'users_profiles', 
      'user_rankings',
      'rankings',
      'concursos'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          missingTables.push(table);
        } else {
          existingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    console.log('✅ Tabelas existentes:', existingTables.join(', '));
    console.log('❌ Tabelas ausentes:', missingTables.join(', '));

    // 2. Verificar se public_profiles existe (deveria ser users_profiles)
    if (missingTables.includes('public_profiles') && existingTables.includes('users_profiles')) {
      console.log('\n🔧 PROBLEMA IDENTIFICADO:');
      console.log('   - Código está tentando acessar "public_profiles"');
      console.log('   - Mas a tabela correta é "users_profiles"');
      console.log('   - Precisa corrigir as referências no código');
    }

    // 3. Verificar se concursos ainda existe (deveria ser rankings)
    if (existingTables.includes('concursos') && existingTables.includes('rankings')) {
      console.log('\n🔧 PROBLEMA IDENTIFICADO:');
      console.log('   - Código ainda está tentando acessar "concursos"');
      console.log('   - Mas deveria usar "rankings"');
      console.log('   - Precisa atualizar as referências no código');
    }

    // 4. Verificar estrutura da tabela users_profiles
    console.log('\n🔍 Verificando estrutura da tabela users_profiles:');
    const { data: usersProfilesData, error: usersProfilesError } = await supabase
      .from('users_profiles')
      .select('*')
      .limit(1);

    if (usersProfilesError) {
      console.log('❌ Erro ao acessar users_profiles:', usersProfilesError.message);
    } else if (usersProfilesData && usersProfilesData.length > 0) {
      console.log('✅ users_profiles acessível');
      console.log('   Colunas disponíveis:', Object.keys(usersProfilesData[0]).join(', '));
    }

    // 5. Verificar se há dados de teste
    console.log('\n📊 Verificando dados disponíveis:');
    
    const { data: usersCount } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true });
    
    const { data: rankingsCount } = await supabase
      .from('rankings')
      .select('*', { count: 'exact', head: true });
    
    const { data: userRankingsCount } = await supabase
      .from('user_rankings')
      .select('*', { count: 'exact', head: true });

    console.log(`   Usuários: ${usersCount?.length || 0}`);
    console.log(`   Rankings: ${rankingsCount?.length || 0}`);
    console.log(`   Participações: ${userRankingsCount?.length || 0}`);

    // 6. Gerar SQL para criar tabela public_profiles se necessário
    console.log('\n🔧 GERANDO SOLUÇÕES:');
    console.log('=' .repeat(50));

    if (missingTables.includes('public_profiles')) {
      const createPublicProfilesSQL = `
-- =====================================================
-- CRIAR TABELA public_profiles (VIEW OU TABELA)
-- BANCO: nomeia-ai
-- DATA: ${new Date().toISOString()}
-- =====================================================

-- Opção 1: Criar VIEW public_profiles baseada em users_profiles
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
  nickname
FROM users_profiles;

-- Opção 2: Criar tabela public_profiles separada (se necessário)
-- CREATE TABLE IF NOT EXISTS public_profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   name TEXT,
--   avatar_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   bio TEXT,
--   estado TEXT,
--   formacao TEXT,
--   cargo_atual TEXT,
--   area_estudos TEXT,
--   especialidade TEXT,
--   curso_preparatorio TEXT,
--   rotina_estudos TEXT,
--   status_concurseiro TEXT,
--   nickname TEXT
-- );

-- Comentários
COMMENT ON VIEW public_profiles IS 'View pública dos perfis de usuários baseada em users_profiles';
`;

      console.log('\n📝 SQL para criar public_profiles:');
      console.log(createPublicProfilesSQL);
    }

    // 7. Gerar script para corrigir referências no código
    console.log('\n🔧 SCRIPT PARA CORRIGIR CÓDIGO:');
    console.log('=' .repeat(50));

    const fixCodeScript = `
// =====================================================
// CORRIGIR REFERÊNCIAS DE TABELAS NO CÓDIGO
// =====================================================

// 1. PublicUserProfile.tsx - Linha 82
// TROCAR:
//   .from('public_profiles')
// POR:
//   .from('users_profiles')

// 2. PublicUserProfile.tsx - Linha 152
// TROCAR:
//   concursos(titulo, id)
// POR:
//   rankings(titulo, id)

// 3. PublicUserProfile.tsx - Linha 165
// TROCAR:
//   .from('concursos')
// POR:
//   .from('rankings')

// 4. Verificar outras referências a 'public_profiles' e 'concursos'
// 5. Atualizar queries para usar a nova estrutura normalizada
`;

    console.log(fixCodeScript);

    // 8. Resumo dos problemas e soluções
    console.log('\n📊 RESUMO DOS PROBLEMAS:');
    console.log('=' .repeat(50));
    console.log('❌ Problema 1: Código tenta acessar "public_profiles" (não existe)');
    console.log('   Solução: Usar "users_profiles" ou criar VIEW public_profiles');
    console.log('');
    console.log('❌ Problema 2: Código ainda usa "concursos" em algumas queries');
    console.log('   Solução: Atualizar para usar "rankings"');
    console.log('');
    console.log('❌ Problema 3: Queries de relacionamento podem estar incorretas');
    console.log('   Solução: Verificar e corrigir joins entre tabelas');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(50));
    console.log('1. Executar SQL para criar VIEW public_profiles');
    console.log('2. Atualizar código para usar tabelas corretas');
    console.log('3. Testar carregamento de perfis');
    console.log('4. Verificar se todas as funcionalidades estão funcionando');

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

fixProfileTableReferences();



