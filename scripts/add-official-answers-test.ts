import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addOfficialAnswersTest() {
  console.log('🧪 Adicionando gabarito oficial para teste...\n');

  try {
    // 1. Buscar um ranking existente
    console.log('1. Buscando ranking existente...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .not('exam_booklets', 'is', null)
      .not('exam_booklets', 'eq', '{}')
      .limit(1);

    if (rankingsError || !rankings.length) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }

    const ranking = rankings[0];
    console.log(`✅ Ranking encontrado: ${ranking.titulo} (${ranking.id})`);
    
    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      console.log('❌ Ranking não tem cadernos');
      return;
    }

    const bookletId = ranking.exam_booklets[0].id;
    console.log(`   - Usando caderno: ${bookletId}`);

    // 2. Criar gabarito oficial de teste
    console.log('\n2. Criando gabarito oficial de teste...');
    
    const testAnswers = {
      '1': {
        correct_answer: 'A',
        weight: 1.0,
        section_type: 'basic_knowledge',
        is_nullified: false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      },
      '2': {
        correct_answer: 'B',
        weight: 1.0,
        section_type: 'basic_knowledge',
        is_nullified: false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      },
      '3': {
        correct_answer: 'C',
        weight: 1.0,
        section_type: 'basic_knowledge',
        is_nullified: false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      },
      '4': {
        correct_answer: 'D',
        weight: 1.0,
        section_type: 'basic_knowledge',
        is_nullified: false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      },
      '5': {
        correct_answer: 'A',
        weight: 1.0,
        section_type: 'basic_knowledge',
        is_nullified: false,
        answer_format: 'OBJECTIVE',
        question_type: 'MULTIPLE_CHOICE'
      }
    };

    // 3. Usar a função RPC para salvar o gabarito
    console.log('\n3. Salvando gabarito oficial...');
    
    const { data: saveResult, error: saveError } = await supabase.rpc('save_consolidated_answer_key', {
      p_concurso_id: ranking.id,
      p_booklet_id: bookletId,
      p_answers: testAnswers
    });

    if (saveError) {
      console.error('❌ Erro ao salvar gabarito:', saveError);
      return;
    }

    console.log('✅ Gabarito oficial salvo:', saveResult);

    // 4. Verificar se foi salvo corretamente
    console.log('\n4. Verificando se foi salvo corretamente...');
    
    const { data: updatedRanking, error: fetchError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', ranking.id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao verificar gabarito:', fetchError);
      return;
    }

    if (!updatedRanking?.official_answers?.[bookletId]) {
      console.log('❌ Gabarito não foi salvo corretamente');
      return;
    }

    const savedAnswers = updatedRanking.official_answers[bookletId];
    console.log('✅ Gabarito salvo com sucesso!');
    console.log(`   - Estrutura: ${Object.keys(savedAnswers)}`);
    console.log(`   - Questões: ${Object.keys(savedAnswers.questions || {}).length}`);
    
    if (savedAnswers.questions) {
      console.log('   - Primeira questão:', savedAnswers.questions['1']);
    }

    console.log('\n🎉 Teste concluído!');
    console.log(`✅ Ranking ${ranking.id} agora tem gabarito oficial`);
    console.log('✅ Pode testar a renderização no frontend');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

addOfficialAnswersTest();

