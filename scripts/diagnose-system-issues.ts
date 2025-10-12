import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseSystemIssues() {
  console.log('🔍 Diagnosticando problemas no sistema...');

  try {
    // 1. Testar conectividade básica
    console.log('\n📡 TESTE DE CONECTIVIDADE:');
    console.log('=' .repeat(50));

    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Erro de conectividade:', testError.message);
      return;
    } else {
      console.log('✅ Conectividade OK');
    }

    // 2. Testar queries principais do sistema
    console.log('\n🔍 TESTANDO QUERIES PRINCIPAIS:');
    console.log('=' .repeat(50));

    // Teste 1: Listar rankings
    console.log('\n1. Testando listagem de rankings...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (rankingsError) {
      console.log('❌ Erro na listagem de rankings:', rankingsError.message);
    } else {
      console.log('✅ Listagem de rankings OK:', rankingsData?.length || 0, 'registros');
      if (rankingsData && rankingsData.length > 0) {
        console.log('   Exemplo:', rankingsData[0].titulo);
      }
    }

    // Teste 2: Buscar ranking específico
    console.log('\n2. Testando busca de ranking específico...');
    if (rankingsData && rankingsData.length > 0) {
      const rankingId = rankingsData[0].id;
      const { data: specificRanking, error: specificError } = await supabase
        .from('rankings')
        .select('*')
        .eq('id', rankingId)
        .single();

      if (specificError) {
        console.log('❌ Erro na busca específica:', specificError.message);
      } else {
        console.log('✅ Busca específica OK');
      }
    }

    // Teste 3: Participações de usuários
    console.log('\n3. Testando participações de usuários...');
    const { data: participationsData, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, ranking_id, user_id, score, position')
      .limit(10);

    if (participationsError) {
      console.log('❌ Erro nas participações:', participationsError.message);
    } else {
      console.log('✅ Participações OK:', participationsData?.length || 0, 'registros');
    }

    // Teste 4: Respostas de usuários
    console.log('\n4. Testando respostas de usuários...');
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('id, ranking_id, user_id, question_number, user_answer')
      .limit(10);

    if (answersError) {
      console.log('❌ Erro nas respostas:', answersError.message);
    } else {
      console.log('✅ Respostas OK:', answersData?.length || 0, 'registros');
    }

    // Teste 5: Gabaritos oficiais
    console.log('\n5. Testando gabaritos oficiais...');
    const { data: answerKeysData, error: answerKeysError } = await supabase
      .from('ranking_answers')
      .select('id, ranking_id, question_number, correct_answer, weight')
      .limit(10);

    if (answerKeysError) {
      console.log('❌ Erro nos gabaritos:', answerKeysError.message);
    } else {
      console.log('✅ Gabaritos OK:', answerKeysData?.length || 0, 'registros');
    }

    // Teste 6: Disciplinas
    console.log('\n6. Testando disciplinas...');
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('ranking_disciplines')
      .select('id, ranking_id, discipline_name, weight, total_questions')
      .limit(10);

    if (disciplinesError) {
      console.log('❌ Erro nas disciplinas:', disciplinesError.message);
    } else {
      console.log('✅ Disciplinas OK:', disciplinesData?.length || 0, 'registros');
    }

    // Teste 7: Perfis de usuários
    console.log('\n7. Testando perfis de usuários...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, email, created_at')
      .limit(10);

    if (profilesError) {
      console.log('❌ Erro nos perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis OK:', profilesData?.length || 0, 'registros');
    }

    // 3. Testar queries complexas (joins)
    console.log('\n🔗 TESTANDO QUERIES COMPLEXAS:');
    console.log('=' .repeat(50));

    // Teste 8: Ranking com participações
    console.log('\n8. Testando ranking com participações...');
    const { data: rankingWithParticipations, error: rankingWithParticipationsError } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        status,
        user_rankings (
          id,
          user_id,
          score,
          position
        )
      `)
      .limit(1);

    if (rankingWithParticipationsError) {
      console.log('❌ Erro no join ranking-participações:', rankingWithParticipationsError.message);
    } else {
      console.log('✅ Join ranking-participações OK');
    }

    // Teste 9: Ranking com disciplinas
    console.log('\n9. Testando ranking com disciplinas...');
    const { data: rankingWithDisciplines, error: rankingWithDisciplinesError } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        status,
        ranking_disciplines (
          id,
          discipline_name,
          weight,
          total_questions
        )
      `)
      .limit(1);

    if (rankingWithDisciplinesError) {
      console.log('❌ Erro no join ranking-disciplinas:', rankingWithDisciplinesError.message);
    } else {
      console.log('✅ Join ranking-disciplinas OK');
    }

    // 4. Verificar problemas específicos
    console.log('\n🚨 VERIFICANDO PROBLEMAS ESPECÍFICOS:');
    console.log('=' .repeat(50));

    // Verificar se há dados órfãos
    console.log('\n10. Verificando dados órfãos...');
    
    // Participações sem ranking
    const { data: orphanParticipations, error: orphanParticipationsError } = await supabase
      .from('user_rankings')
      .select('id, ranking_id')
      .is('ranking_id', null);

    if (orphanParticipationsError) {
      console.log('❌ Erro ao verificar participações órfãs:', orphanParticipationsError.message);
    } else {
      console.log('✅ Participações órfãs:', orphanParticipations?.length || 0);
    }

    // Respostas sem ranking
    const { data: orphanAnswers, error: orphanAnswersError } = await supabase
      .from('user_answers')
      .select('id, ranking_id')
      .is('ranking_id', null);

    if (orphanAnswersError) {
      console.log('❌ Erro ao verificar respostas órfãs:', orphanAnswersError.message);
    } else {
      console.log('✅ Respostas órfãs:', orphanAnswers?.length || 0);
    }

    // 5. Resumo dos problemas
    console.log('\n📊 RESUMO DOS PROBLEMAS:');
    console.log('=' .repeat(50));

    const problems = [];
    
    if (rankingsError) problems.push('Listagem de rankings');
    if (participationsError) problems.push('Participações de usuários');
    if (answersError) problems.push('Respostas de usuários');
    if (answerKeysError) problems.push('Gabaritos oficiais');
    if (disciplinesError) problems.push('Disciplinas');
    if (profilesError) problems.push('Perfis de usuários');
    if (rankingWithParticipationsError) problems.push('Join ranking-participações');
    if (rankingWithDisciplinesError) problems.push('Join ranking-disciplinas');

    if (problems.length === 0) {
      console.log('🎉 NENHUM PROBLEMA ENCONTRADO! Sistema funcionando perfeitamente.');
    } else {
      console.log(`❌ ${problems.length} problemas encontrados:`);
      problems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
    }

    // 6. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('=' .repeat(50));

    if (problems.length === 0) {
      console.log('✅ Sistema está funcionando corretamente');
      console.log('✅ Apenas execute a limpeza das tabelas desnecessárias');
    } else {
      console.log('🔧 Problemas encontrados precisam ser corrigidos');
      console.log('🔧 Verifique os logs acima para detalhes específicos');
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }
}

diagnoseSystemIssues();

