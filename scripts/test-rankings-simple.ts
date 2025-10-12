import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRankingsSimple() {
  console.log('🧪 TESTANDO TABELA RANKINGS SIMPLES');
  console.log('=' .repeat(60));

  try {
    // 1. Tentar inserção com campos mínimos
    console.log('1️⃣ Tentando inserção com campos mínimos...');
    const { data: insertData, error: insertError } = await supabase
      .from('rankings')
      .insert({
        titulo: 'TESTE RANKINGS SIMPLES',
        orgao: 'TESTE ORGÃO SIMPLES',
        banca: 'TESTE BANCA SIMPLES',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25,
        created_by: null
      })
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção mínima:', insertError);
      return;
    }
    
    console.log('✅ Inserção mínima bem-sucedida!');
    const rankingId = insertData[0].id;
    console.log('📊 ID do ranking:', rankingId);
    
    // 2. Tentar atualizar com campos JSONB
    console.log('\n2️⃣ Tentando atualizar com campos JSONB...');
    const { error: updateError } = await supabase
      .from('rankings')
      .update({
        disciplines: [
          {
            id: 'test-simple-1',
            name: 'Matemática',
            type: 'basic_knowledge',
            isEnabled: true,
            questionCount: 10,
            weight: 1.0,
            minimum_score: 0
          }
        ],
        subjects: [{ name: 'Matemática Básica' }],
        form_config: { simple_test: true },
        official_answers: { '1': 'A', '2': 'B' },
        exam_booklets: [{ id: 'b1', name: 'Caderno A', total_questions: 10 }],
        metadata: { source: 'simple_test' },
        total_participants: 0
      })
      .eq('id', rankingId);
      
    if (updateError) {
      console.error('❌ Erro na atualização com JSONB:', updateError);
    } else {
      console.log('✅ Atualização com JSONB bem-sucedida!');
      
      // Verificar resultado final
      const { data: finalData, error: finalError } = await supabase
        .from('rankings')
        .select('*')
        .eq('id', rankingId)
        .single();
        
      if (finalError) {
        console.error('❌ Erro ao buscar resultado final:', finalError);
      } else {
        console.log('🎉 Resultado final:');
        console.log('📊 ID:', finalData.id);
        console.log('📊 Título:', finalData.titulo);
        console.log('📊 Status:', finalData.status);
        console.log('📊 Disciplines:', finalData.disciplines);
        console.log('📊 Exam Booklets:', finalData.exam_booklets);
        console.log('📊 Form Config:', finalData.form_config);
        console.log('📊 Official Answers:', finalData.official_answers);
        console.log('📊 Metadata:', finalData.metadata);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRankingsSimple();
