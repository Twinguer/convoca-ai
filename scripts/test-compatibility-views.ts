import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompatibilityViews() {
  console.log('🧪 Testando VIEWs de compatibilidade...');

  try {
    // 1. Testar VIEW public_profiles
    console.log('\n📋 TESTANDO VIEW public_profiles:');
    console.log('=' .repeat(50));

    const { data: publicProfilesData, error: publicProfilesError } = await supabase
      .from('public_profiles')
      .select('id, name, avatar_url, bio, estado')
      .limit(3);

    if (publicProfilesError) {
      console.log('❌ Erro na VIEW public_profiles:', publicProfilesError.message);
    } else {
      console.log('✅ VIEW public_profiles funcionando');
      console.log(`   Registros encontrados: ${publicProfilesData?.length || 0}`);
      if (publicProfilesData && publicProfilesData.length > 0) {
        console.log('   Exemplo:', publicProfilesData[0].name);
      }
    }

    // 2. Testar VIEW concursos
    console.log('\n📋 TESTANDO VIEW concursos:');
    console.log('=' .repeat(50));

    const { data: concursosData, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, orgao, banca, data_publicacao, created_by_user_id')
      .limit(3);

    if (concursosError) {
      console.log('❌ Erro na VIEW concursos:', concursosError.message);
    } else {
      console.log('✅ VIEW concursos funcionando');
      console.log(`   Registros encontrados: ${concursosData?.length || 0}`);
      if (concursosData && concursosData.length > 0) {
        console.log('   Exemplo:', concursosData[0].titulo);
      }
    }

    // 3. Testar VIEW official_answer_weights
    console.log('\n📋 TESTANDO VIEW official_answer_weights:');
    console.log('=' .repeat(50));

    const { data: answerWeightsData, error: answerWeightsError } = await supabase
      .from('official_answer_weights')
      .select('id, concurso_id, question_number, correct_answer, weight')
      .limit(3);

    if (answerWeightsError) {
      console.log('❌ Erro na VIEW official_answer_weights:', answerWeightsError.message);
    } else {
      console.log('✅ VIEW official_answer_weights funcionando');
      console.log(`   Registros encontrados: ${answerWeightsData?.length || 0}`);
    }

    // 4. Testar VIEW consolidated_answers_by_concurso
    console.log('\n📋 TESTANDO VIEW consolidated_answers_by_concurso:');
    console.log('=' .repeat(50));

    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('concurso_id, answers_data')
      .limit(3);

    if (consolidatedError) {
      console.log('❌ Erro na VIEW consolidated_answers_by_concurso:', consolidatedError.message);
    } else {
      console.log('✅ VIEW consolidated_answers_by_concurso funcionando');
      console.log(`   Registros encontrados: ${consolidatedData?.length || 0}`);
    }

    // 5. Testar VIEW exam_booklets
    console.log('\n📋 TESTANDO VIEW exam_booklets:');
    console.log('=' .repeat(50));

    const { data: examBookletsData, error: examBookletsError } = await supabase
      .from('exam_booklets')
      .select('id, concurso_id, booklet_name, total_questions')
      .limit(3);

    if (examBookletsError) {
      console.log('❌ Erro na VIEW exam_booklets:', examBookletsError.message);
    } else {
      console.log('✅ VIEW exam_booklets funcionando');
      console.log(`   Registros encontrados: ${examBookletsData?.length || 0}`);
      if (examBookletsData && examBookletsData.length > 0) {
        console.log('   Exemplo:', examBookletsData[0].booklet_name);
      }
    }

    // 6. Testar queries que o frontend usa
    console.log('\n🔗 TESTANDO QUERIES DO FRONTEND:');
    console.log('=' .repeat(50));

    // Query que o PublicUserProfile.tsx usa
    console.log('\n6.1. Testando query de perfil público...');
    const { data: profileQueryData, error: profileQueryError } = await supabase
      .from('public_profiles')
      .select('id, name, avatar_url')
      .eq('id', 'f3373425-09b7-4503-853b-7040e7d48c95')
      .single();

    if (profileQueryError) {
      console.log('❌ Erro na query de perfil:', profileQueryError.message);
    } else {
      console.log('✅ Query de perfil funcionando');
      console.log('   Perfil encontrado:', profileQueryData?.name);
    }

    // Query que o PublicUserProfile.tsx usa para rankings
    console.log('\n6.2. Testando query de rankings do usuário...');
    const { data: userRankingsData, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        ranking_id,
        score,
        rankings(titulo, id)
      `)
      .eq('user_id', 'f3373425-09b7-4503-853b-7040e7d48c95');

    if (userRankingsError) {
      console.log('❌ Erro na query de rankings do usuário:', userRankingsError.message);
    } else {
      console.log('✅ Query de rankings do usuário funcionando');
      console.log(`   Participações encontradas: ${userRankingsData?.length || 0}`);
    }

    // 7. Resumo final
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('=' .repeat(50));

    const tests = [
      { name: 'public_profiles VIEW', passed: !publicProfilesError },
      { name: 'concursos VIEW', passed: !concursosError },
      { name: 'official_answer_weights VIEW', passed: !answerWeightsError },
      { name: 'consolidated_answers_by_concurso VIEW', passed: !consolidatedError },
      { name: 'exam_booklets VIEW', passed: !examBookletsError },
      { name: 'Query de perfil público', passed: !profileQueryError },
      { name: 'Query de rankings do usuário', passed: !userRankingsError }
    ];

    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;

    console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 TODAS AS VIEWs DE COMPATIBILIDADE FUNCIONANDO!');
      console.log('✅ Sistema pronto para carregar perfis sem erros 404');
    } else {
      console.log('⚠️  Algumas VIEWs podem ter problemas');
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(50));
    console.log('1. Teste o frontend para verificar se os erros 404 foram resolvidos');
    console.log('2. Verifique se os perfis de usuários carregam corretamente');
    console.log('3. Confirme que os rankings são exibidos nos perfis');
    console.log('4. Teste todas as funcionalidades relacionadas a perfis');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }
}

testCompatibilityViews();



