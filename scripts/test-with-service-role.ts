import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Criar cliente com service role key para bypass de RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Criar cliente normal com anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithServiceRole() {
  console.log('🔍 Testando com service role key...\n');

  try {
    const rankingId = '79a941aa-3354-4522-9e90-96f40e377fe0';
    
    console.log('1. Testando com anon key (deve falhar)...');
    const { data: anonData, error: anonError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .maybeSingle();

    console.log('   Anon data:', anonData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    console.log('   Anon error:', anonError);

    console.log('\n2. Testando com service role key (deve funcionar)...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .maybeSingle();

    console.log('   Admin data:', adminData ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
    console.log('   Admin error:', adminError);

    if (adminData?.consolidated_data) {
      console.log('\n3. Dados consolidados encontrados!');
      const consolidated = adminData.consolidated_data;
      console.log('   - Total users:', Object.keys(consolidated.users || {}).length);
      console.log('   - Metadata:', consolidated.metadata);
    }

    console.log('\n4. Testando fetchExistingAnswers com service role...');
    const { data: rankingData, error: rankingError } = await supabaseAdmin
      .from('user_rankings')
      .select('selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('id', rankingId)
      .maybeSingle();

    if (rankingError || !rankingData) {
      console.error('❌ Erro ao buscar dados do ranking');
      return;
    }

    const { data: consolidatedData, error: consolidatedError } = await supabaseAdmin
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .maybeSingle();

    if (consolidatedError) {
      console.error('❌ Erro na busca consolidada:', consolidatedError);
      return;
    }

    if (!consolidatedData?.consolidated_data) {
      console.log('⚠️ Nenhum dado consolidado encontrado');
      return;
    }

    console.log('✅ Dados consolidados encontrados com service role!');
    
    // Processar dados como a função fetchExistingAnswers faria
    const consolidated = consolidatedData.consolidated_data;
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

    console.log('✅ Respostas processadas:', Object.keys(answers).length);
    console.log('✅ Primeiras 5 respostas:', Object.entries(answers).slice(0, 5));

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testWithServiceRole();

