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

async function debugFetchExistingAnswers() {
  console.log('🔍 Debugando fetchExistingAnswers...\n');

  try {
    // Simular o que a função fetchExistingAnswers faz
    const rankingId = '79a941aa-3354-4522-9e90-96f40e377fe0'; // ID do user_ranking
    
    console.log('1. Buscando dados do user_ranking...');
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    console.log('Ranking data:', rankingData);
    console.log('Ranking error:', rankingError);

    if (rankingError || !rankingData) {
      console.error('❌ Erro ao buscar dados do ranking');
      return;
    }

    console.log('\n2. Buscando dados consolidados...');
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    console.log('Consolidated data:', consolidatedData);
    console.log('Consolidated error:', consolidatedError);

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
      console.log('✅ Dados do usuário encontrados:', userData);
      
      // Verificar caderno selecionado
      const selectedBooklet = userData.selected_booklet || rankingData.selected_booklet;
      console.log('📚 Caderno selecionado:', selectedBooklet);
      
      // Verificar respostas
      if (userData.booklets && userData.booklets[selectedBooklet]) {
        const bookletData = userData.booklets[selectedBooklet];
        console.log('📝 Respostas do caderno:', bookletData.answers);
        console.log('📊 Total de respostas:', Object.keys(bookletData.answers || {}).length);
      } else {
        console.log('⚠️ Nenhuma resposta encontrada para o caderno selecionado');
      }
    } else {
      console.log('⚠️ Dados do usuário não encontrados nos dados consolidados');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugFetchExistingAnswers();
