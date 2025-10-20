import { createClient } from '@supabase/supabase-js';

// Configuração do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConvocaAi() {
  console.log('🔗 Conectando ao convoca-ai...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  // Teste 1: Verificar concursos
  console.log('\n📊 Teste 1: Verificando concursos...');
  const { data: concursos, error: concursosError } = await supabase
    .from('concursos')
    .select('*')
    .limit(5);
  
  if (concursosError) {
    console.log('❌ Erro ao buscar concursos:', concursosError.message);
  } else {
    console.log('✅ Concursos encontrados:', concursos?.length || 0);
    concursos?.forEach(concurso => {
      const title = concurso.title || concurso.name || concurso.concurso_name || 'Sem título';
      console.log(`  - ${title} (${concurso.id})`);
    });
  }

  // Teste 2: Verificar users_profiles
  console.log('\n📊 Teste 2: Verificando users_profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('users_profiles')
    .select('id, name, email, created_at')
    .limit(10);
  
  if (profilesError) {
    console.log('❌ Erro ao buscar users_profiles:', profilesError.message);
  } else {
    console.log('✅ User profiles encontrados:', profiles?.length || 0);
    profiles?.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.email})`);
    });
  }

  // Teste 3: Verificar user_rankings
  console.log('\n📊 Teste 3: Verificando user_rankings...');
  const { data: rankings, error: rankingsError } = await supabase
    .from('user_rankings')
    .select('user_id, consolidated_data')
    .limit(5);
  
  if (rankingsError) {
    console.log('❌ Erro ao buscar user_rankings:', rankingsError.message);
  } else {
    console.log('✅ User rankings encontrados:', rankings?.length || 0);
    rankings?.forEach(ranking => {
      const consolidatedData = ranking.consolidated_data;
      const rankingsCount = consolidatedData?.rankings ? Object.keys(consolidated_data.rankings).length : 0;
      console.log(`  - User: ${ranking.user_id} (${rankingsCount} rankings)`);
    });
  }

  // Teste 4: Verificar auth.users (se possível)
  console.log('\n📊 Teste 4: Verificando autenticação...');
  try {
    // Tentar fazer login com um usuário existente
    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      console.log(`Tentando login com: ${testUser.email}`);
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: '123456789'
      });
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError.message);
        console.log('   Isso indica que o usuário não tem conta de autenticação');
      } else {
        console.log('✅ Login bem-sucedido!');
        console.log('   User ID:', loginData.user?.id);
      }
    }
  } catch (err) {
    console.log('❌ Erro geral no teste de login:', err.message);
  }

  // Teste 5: Verificar estrutura de um concurso
  if (concursos && concursos.length > 0) {
    console.log('\n📊 Teste 5: Verificando estrutura do concurso...');
    const concurso = concursos[0];
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('disciplines, has_cota, subjects')
      .eq('id', concurso.id)
      .single();
    
    if (concursoError) {
      console.log('❌ Erro ao buscar detalhes do concurso:', concursoError.message);
    } else {
      console.log('✅ Estrutura do concurso:');
      console.log('   Disciplines:', concursoData.disciplines ? 'Presente' : 'Ausente');
      console.log('   Has Cota:', concursoData.has_cota ? 'Presente' : 'Ausente');
      console.log('   Subjects:', concursoData.subjects ? 'Presente' : 'Ausente');
    }
  }

  console.log('\n🎯 Resumo da conexão com convoca-ai:');
  console.log(`   Concursos: ${concursos?.length || 0}`);
  console.log(`   User Profiles: ${profiles?.length || 0}`);
  console.log(`   User Rankings: ${rankings?.length || 0}`);
  console.log(`   Status: ${concursos?.length > 0 ? '✅ Conectado' : '❌ Problema de conexão'}`);
}

testConvocaAi().catch(console.error);
