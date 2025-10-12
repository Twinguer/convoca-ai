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

async function testConcursosInsertV2() {
  console.log('🧪 TESTANDO INSERÇÃO EM DUAS ETAPAS NA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // Primeira etapa: inserir dados básicos
    const basicData = {
      titulo: 'TESTE RANKING V2',
      orgao: 'TESTE ORGÃO V2',
      banca: 'TESTE BANCA V2',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98'
    };

    console.log('📝 Etapa 1 - Dados básicos:', JSON.stringify(basicData, null, 2));

    const { data: insertResult, error: insertError } = await supabase
      .from('concursos')
      .insert(basicData)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção básica:', insertError);
      return;
    }

    console.log('✅ Inserção básica bem-sucedida!');
    console.log('📊 Dados inseridos:', insertResult);

    const concursoId = insertResult[0].id;

    // Segunda etapa: atualizar com disciplines
    const disciplinesData = [
      {
        id: 'test-discipline-v2-1',
        name: 'Matemática',
        type: 'basic_knowledge',
        isEnabled: true,
        questionCount: 10,
        weight: 1.0,
        minimum_score: 0
      }
    ];

    console.log('📝 Etapa 2 - Dados de disciplines:', JSON.stringify(disciplinesData, null, 2));

    const { error: updateError } = await supabase
      .from('concursos')
      .update({ 
        disciplines: disciplinesData,
        subjects: [],
        form_config: {},
        official_answers: {},
        exam_booklets: [],
        metadata: {}
      })
      .eq('id', concursoId);

    if (updateError) {
      console.error('❌ Erro na atualização com disciplines:', updateError);
    } else {
      console.log('✅ Atualização com disciplines bem-sucedida!');
    }

    // Verificar resultado final
    const { data: finalResult, error: finalError } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines')
      .eq('id', concursoId)
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
    } else {
      console.log('🎉 Resultado final:', finalResult);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosInsertV2();

