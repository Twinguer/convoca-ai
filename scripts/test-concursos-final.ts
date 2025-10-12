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

async function testConcursosFinal() {
  console.log('🧪 TESTANDO INSERÇÃO FINAL NA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // Dados de teste completos
    const testData = {
      titulo: 'TESTE RANKING FINAL',
      orgao: 'TESTE ORGÃO FINAL',
      banca: 'TESTE BANCA FINAL',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98',
      disciplines: [
        {
          id: 'test-discipline-final-1',
          name: 'Matemática',
          type: 'basic_knowledge',
          isEnabled: true,
          questionCount: 10,
          weight: 1.0,
          minimum_score: 0
        }
      ],
      subjects: [],
      form_config: {},
      official_answers: {},
      exam_booklets: [],
      metadata: {},
      total_participants: 0
    };

    console.log('📝 Dados de teste:', JSON.stringify(testData, null, 2));

    // Tentar inserir
    const { data, error } = await supabase
      .from('concursos')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Erro na inserção:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Dados inseridos:', data);
      
      // Testar se conseguimos buscar o registro inserido
      const { data: fetchedData, error: fetchError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', data[0].id)
        .single();
        
      if (fetchError) {
        console.error('❌ Erro ao buscar registro:', fetchError);
      } else {
        console.log('✅ Busca bem-sucedida!');
        console.log('📊 Dados buscados:', fetchedData);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosFinal();

