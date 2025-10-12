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

async function testFetchExistingAnswersDetailed() {
  console.log('🔍 Teste detalhado do fetchExistingAnswers...\n');

  try {
    const rankingId = '79a941aa-3354-4522-9e90-96f40e377fe0';
    
    console.log('1. Testando query do user_rankings...');
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    console.log('✅ Ranking data encontrado:', rankingData);
    console.log('✅ Ranking error:', rankingError);

    if (rankingError || !rankingData) {
      console.error('❌ Erro ao buscar dados do ranking');
      return;
    }

    console.log('\n2. Testando query dos dados consolidados...');
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    console.log('✅ Consolidated data encontrado:', consolidatedData ? 'SIM' : 'NÃO');
    console.log('✅ Consolidated error:', consolidatedError);

    if (consolidatedError) {
      console.error('❌ Erro na busca consolidada:', consolidatedError);
      return;
    }

    if (!consolidatedData?.consolidated_data) {
      console.log('⚠️ Nenhum dado consolidado encontrado');
      return;
    }

    console.log('\n3. Processando dados consolidados...');
    const consolidated = consolidatedData.consolidated_data;
    
    // Verificar se há dados do usuário
    if (consolidated.users && consolidated.users[rankingData.user_id]) {
      const userData = consolidated.users[rankingData.user_id];
      console.log('✅ Dados do usuário encontrados!');
      console.log('   - User name:', userData.user_name);
      console.log('   - Selected booklet:', userData.selected_booklet);
      console.log('   - Edit count:', userData.edit_count);
      
      // Verificar caderno selecionado
      const selectedBooklet = userData.selected_booklet || rankingData.selected_booklet;
      console.log('📚 Caderno selecionado:', selectedBooklet);
      
      // Verificar respostas
      if (userData.booklets && userData.booklets[selectedBooklet]) {
        const bookletData = userData.booklets[selectedBooklet];
        console.log('📝 Respostas do caderno encontradas!');
        console.log('   - Total de respostas:', Object.keys(bookletData.answers || {}).length);
        console.log('   - Primeiras 5 respostas:', Object.entries(bookletData.answers || {}).slice(0, 5));
      } else {
        console.log('⚠️ Nenhuma resposta encontrada para o caderno selecionado');
        console.log('   - Cadernos disponíveis:', Object.keys(userData.booklets || {}));
      }
      
      // Verificar notas subjetivas
      if (userData.subjective_scores) {
        console.log('📊 Notas subjetivas:', userData.subjective_scores);
      }
      
    } else {
      console.log('⚠️ Dados do usuário não encontrados nos dados consolidados');
      console.log('   - User ID procurado:', rankingData.user_id);
      console.log('   - Users disponíveis:', Object.keys(consolidated.users || {}));
    }

    console.log('\n4. Simulando retorno da função fetchExistingAnswers...');
    
    // Simular o que a função deveria retornar
    let answers: { [key: number]: string } = {};
    
    if (consolidated.users && consolidated.users[rankingData.user_id]) {
      const userData = consolidated.users[rankingData.user_id];
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
      consolidatedData: consolidated
    };
    
    console.log('✅ Resultado final:', {
      totalAnswers: Object.keys(answers).length,
      selectedBooklet: result.selectedBooklet,
      discursiveScore: result.discursiveScore,
      hasConsolidatedData: !!result.consolidatedData
    });

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFetchExistingAnswersDetailed();

