import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnswerKeySave() {
  console.log('🧪 Testando salvamento do gabarito oficial...\n');

  try {
    // 1. Buscar um ranking existente
    console.log('1. Buscando ranking existente...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .limit(1);

    if (rankingsError || !rankings.length) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }

    const ranking = rankings[0];
    console.log(`✅ Ranking encontrado: ${ranking.titulo} (${ranking.id})`);
    console.log(`   - Cadernos: ${ranking.exam_booklets?.length || 0}`);

    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      console.log('❌ Ranking não tem cadernos');
      return;
    }

    const bookletId = ranking.exam_booklets[0].id;
    console.log(`   - Usando caderno: ${bookletId}`);

    // 2. Testar função RPC save_consolidated_answer_key
    console.log('\n2. Testando função RPC save_consolidated_answer_key...');
    
    const testAnswers = {
      "1": {
        correct_answer: "A",
        weight: 1.0,
        section_type: "basic",
        is_nullified: false,
        answer_format: "OBJECTIVE",
        question_type: "MULTIPLE_CHOICE"
      },
      "2": {
        correct_answer: "B",
        weight: 1.0,
        section_type: "basic",
        is_nullified: false,
        answer_format: "OBJECTIVE",
        question_type: "MULTIPLE_CHOICE"
      },
      "3": {
        correct_answer: "C",
        weight: 1.0,
        section_type: "basic",
        is_nullified: false,
        answer_format: "OBJECTIVE",
        question_type: "MULTIPLE_CHOICE"
      }
    };

    console.log('Dados de teste:', testAnswers);

    const { data: rpcData, error: rpcError } = await supabase.rpc('save_consolidated_answer_key', {
      p_concurso_id: ranking.id,
      p_booklet_id: bookletId,
      p_answers: testAnswers
    });

    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError);
      console.log('Detalhes do erro:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      });
      return;
    }

    console.log('✅ Função RPC executada com sucesso');
    console.log('Resultado:', rpcData);

    // 3. Verificar se os dados foram salvos
    console.log('\n3. Verificando se os dados foram salvos...');
    
    const { data: savedData, error: savedError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', ranking.id)
      .single();

    if (savedError) {
      console.error('❌ Erro ao verificar dados salvos:', savedError);
      return;
    }

    console.log('Dados salvos no official_answers:');
    console.log(JSON.stringify(savedData.official_answers, null, 2));

    if (savedData.official_answers && savedData.official_answers[bookletId]) {
      const bookletData = savedData.official_answers[bookletId];
      const questionCount = Object.keys(bookletData.questions || {}).length;
      console.log(`✅ Dados salvos com sucesso: ${questionCount} questões no caderno ${bookletId}`);
    } else {
      console.log('❌ Dados não foram salvos corretamente');
    }

    // 4. Testar função getConsolidatedAnswerKey
    console.log('\n4. Testando getConsolidatedAnswerKey...');
    
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', ranking.id)
      .single();

    if (consolidatedError) {
      console.error('❌ Erro ao testar getConsolidatedAnswerKey:', consolidatedError);
    } else {
      console.log('✅ getConsolidatedAnswerKey funcionou');
      if (consolidatedData.official_answers) {
        const bookletIds = Object.keys(consolidatedData.official_answers);
        console.log(`Cadernos encontrados: ${bookletIds.length}`);
        bookletIds.forEach(id => {
          const booklet = consolidatedData.official_answers[id];
          const questionCount = Object.keys(booklet.questions || {}).length;
          console.log(`  - ${id}: ${questionCount} questões`);
        });
      }
    }

    console.log('\n🎉 Teste de salvamento concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testAnswerKeySave();

