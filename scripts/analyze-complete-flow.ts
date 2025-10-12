import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCompleteFlow() {
  console.log('🔍 ANÁLISE COMPLETA DO FLUXO - CAUSA RAIZ\n');
  console.log('=' .repeat(60));

  try {
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    const userId = '34d22725-d158-4d75-9089-efd049a1fb98';
    
    // ========================================
    // ETAPA 1: VERIFICAR ESTRUTURA DO CONCURSO
    // ========================================
    console.log('\n📋 ETAPA 1: ESTRUTURA DO CONCURSO');
    console.log('-'.repeat(40));
    
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets, disciplines, official_answers')
      .eq('id', concursoId)
      .single();
    
    console.log('✅ Concurso encontrado:', concurso?.titulo);
    console.log('✅ Cadernos disponíveis:', concurso?.exam_booklets?.length || 0);
    console.log('✅ Disciplinas:', concurso?.disciplines?.length || 0);
    console.log('✅ Gabarito oficial:', concurso?.official_answers ? 'SIM' : 'NÃO');
    
    if (concursoError) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }

    // ========================================
    // ETAPA 2: VERIFICAR PARTICIPAÇÕES DO USUÁRIO
    // ========================================
    console.log('\n👤 ETAPA 2: PARTICIPAÇÕES DO USUÁRIO');
    console.log('-'.repeat(40));
    
    const { data: participations, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, concurso_id, selected_booklet, score, reservation_type, created_at')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .order('created_at', { ascending: false });
    
    console.log('✅ Participações encontradas:', participations?.length || 0);
    participations?.forEach((part, index) => {
      console.log(`   ${index + 1}. ID: ${part.id}`);
      console.log(`      - Caderno selecionado: ${part.selected_booklet || 'NENHUM'}`);
      console.log(`      - Cota: ${part.reservation_type}`);
      console.log(`      - Criado em: ${part.created_at}`);
    });
    
    if (participationsError) {
      console.error('❌ Erro ao buscar participações:', participationsError);
      return;
    }

    if (!participations || participations.length === 0) {
      console.log('❌ PROBLEMA: Usuário não tem participação no concurso!');
      return;
    }

    const latestParticipation = participations[0];
    console.log(`\n🎯 Participação mais recente: ${latestParticipation.id}`);

    // ========================================
    // ETAPA 3: VERIFICAR DADOS CONSOLIDADOS
    // ========================================
    console.log('\n📊 ETAPA 3: DADOS CONSOLIDADOS');
    console.log('-'.repeat(40));
    
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('concurso_id, consolidated_data, created_at, updated_at')
      .eq('concurso_id', concursoId)
      .maybeSingle();
    
    console.log('✅ Dados consolidados encontrados:', consolidatedData ? 'SIM' : 'NÃO');
    console.log('✅ Erro na busca:', consolidatedError);
    
    if (consolidatedError) {
      console.error('❌ Erro ao buscar dados consolidados:', consolidatedError);
      return;
    }

    if (!consolidatedData) {
      console.log('❌ PROBLEMA: Nenhum dado consolidado encontrado!');
      console.log('   Isso significa que o usuário nunca respondeu as questões.');
      return;
    }

    console.log('✅ Dados consolidados criados em:', consolidatedData.created_at);
    console.log('✅ Última atualização:', consolidatedData.updated_at);

    // ========================================
    // ETAPA 4: ANALISAR ESTRUTURA DOS DADOS CONSOLIDADOS
    // ========================================
    console.log('\n🔍 ETAPA 4: ESTRUTURA DOS DADOS CONSOLIDADOS');
    console.log('-'.repeat(40));
    
    const consolidated = consolidatedData.consolidated_data;
    console.log('✅ Metadata:', consolidated.metadata);
    console.log('✅ Total de usuários:', Object.keys(consolidated.users || {}).length);
    
    // Verificar se o usuário está nos dados consolidados
    if (consolidated.users && consolidated.users[userId]) {
      const userData = consolidated.users[userId];
      console.log('✅ Usuário encontrado nos dados consolidados!');
      console.log('   - Nome:', userData.user_name);
      console.log('   - Caderno selecionado:', userData.selected_booklet);
      console.log('   - Contagem de edições:', userData.edit_count);
      console.log('   - Cadernos disponíveis:', Object.keys(userData.booklets || {}));
      
      // Verificar respostas do caderno selecionado
      const selectedBooklet = userData.selected_booklet || latestParticipation.selected_booklet;
      console.log(`\n📚 Caderno selecionado: ${selectedBooklet}`);
      
      if (userData.booklets && userData.booklets[selectedBooklet]) {
        const bookletData = userData.booklets[selectedBooklet];
        console.log('✅ Respostas encontradas para o caderno!');
        console.log('   - Total de respostas:', Object.keys(bookletData.answers || {}).length);
        console.log('   - Primeiras 5 respostas:', Object.entries(bookletData.answers || {}).slice(0, 5));
        console.log('   - Metadata do caderno:', bookletData.metadata);
      } else {
        console.log('❌ PROBLEMA: Nenhuma resposta encontrada para o caderno selecionado!');
        console.log('   - Cadernos disponíveis:', Object.keys(userData.booklets || {}));
        console.log('   - Caderno selecionado:', selectedBooklet);
      }
      
      // Verificar notas subjetivas
      if (userData.subjective_scores) {
        console.log('✅ Notas subjetivas:', userData.subjective_scores);
      } else {
        console.log('⚠️ Nenhuma nota subjetiva encontrada');
      }
      
    } else {
      console.log('❌ PROBLEMA: Usuário não encontrado nos dados consolidados!');
      console.log('   - User ID procurado:', userId);
      console.log('   - Users disponíveis:', Object.keys(consolidated.users || {}));
    }

    // ========================================
    // ETAPA 5: SIMULAR FETCH EXISTING ANSWERS
    // ========================================
    console.log('\n🔄 ETAPA 5: SIMULAÇÃO DO FETCH EXISTING ANSWERS');
    console.log('-'.repeat(40));
    
    // Simular exatamente o que a função fetchExistingAnswers faz
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', latestParticipation.id)
      .maybeSingle();

    console.log('✅ Dados do ranking (fetchExistingAnswers):', rankingData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    console.log('✅ Erro do ranking:', rankingError);

    if (rankingError || !rankingData) {
      console.log('❌ PROBLEMA: fetchExistingAnswers falha na busca do user_rankings');
      return;
    }

    const { data: consolidatedData2, error: consolidatedError2 } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    console.log('✅ Dados consolidados (fetchExistingAnswers):', consolidatedData2 ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    console.log('✅ Erro consolidado:', consolidatedError2);

    if (consolidatedError2) {
      console.log('❌ PROBLEMA: fetchExistingAnswers falha na busca dos dados consolidados');
      return;
    }

    if (!consolidatedData2?.consolidated_data) {
      console.log('❌ PROBLEMA: fetchExistingAnswers não encontra dados consolidados');
      return;
    }

    // ========================================
    // ETAPA 6: DIAGNÓSTICO FINAL
    // ========================================
    console.log('\n🎯 DIAGNÓSTICO FINAL');
    console.log('=' .repeat(60));
    
    const consolidated2 = consolidatedData2.consolidated_data;
    let answers: { [key: number]: string } = {};

    if (consolidated2.users && consolidated2.users[rankingData.user_id]) {
      const userData = consolidated2.users[rankingData.user_id];
      const selectedBooklet = userData.selected_booklet || rankingData.selected_booklet;
      
      if (userData.booklets && userData.booklets[selectedBooklet]) {
        const bookletData = userData.booklets[selectedBooklet];
        Object.entries(bookletData.answers || {}).forEach(([questionNum, answer]) => {
          const num = parseInt(questionNum);
          if (!isNaN(num) && typeof answer === 'string') {
            answers[num] = answer;
          }
        });
      }
    }

    const result = {
      answers,
      discursiveScore: rankingData.discursive_score,
      caseStudy1Score: rankingData.case_study_1_score,
      caseStudy2Score: rankingData.case_study_2_score,
      caseStudy3Score: rankingData.case_study_3_score,
      selectedBooklet: rankingData.selected_booklet,
      editCount: 0,
      consolidatedData: consolidated2
    };

    console.log('✅ RESULTADO FINAL:');
    console.log(`   - Total de respostas: ${Object.keys(answers).length}`);
    console.log(`   - Caderno selecionado: ${result.selectedBooklet}`);
    console.log(`   - Nota discursiva: ${result.discursiveScore}`);
    console.log(`   - Dados consolidados: ${result.consolidatedData ? 'SIM' : 'NÃO'}`);

    if (Object.keys(answers).length === 0) {
      console.log('\n❌ CAUSA RAIZ IDENTIFICADA:');
      console.log('   O usuário não tem respostas salvas nos dados consolidados!');
      console.log('   Isso pode acontecer se:');
      console.log('   1. O usuário nunca respondeu as questões');
      console.log('   2. As respostas não foram salvas corretamente');
      console.log('   3. Há problema na sincronização entre user_rankings e dados consolidados');
    } else {
      console.log('\n✅ SISTEMA FUNCIONANDO:');
      console.log('   O fetchExistingAnswers deve funcionar corretamente!');
    }

  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

analyzeCompleteFlow();
