import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOfficialAnswersLoading() {
  console.log('🧪 Testando carregamento do gabarito oficial...\n');

  try {
    // 1. Buscar ranking com gabarito oficial
    console.log('1. Buscando ranking com gabarito oficial...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, official_answers, exam_booklets')
      .not('official_answers', 'is', null)
      .limit(1);

    if (concursosError || !concursos || concursos.length === 0) {
      console.log('❌ Nenhum ranking com gabarito oficial encontrado');
      
      // Tentar buscar qualquer ranking para ver a estrutura
      const { data: anyConcurso, error: anyError } = await supabase
        .from('concursos')
        .select('id, titulo, official_answers, exam_booklets')
        .limit(1);
        
      if (anyError || !anyConcurso || anyConcurso.length === 0) {
        console.log('❌ Nenhum ranking encontrado');
        return;
      }
      
      const concurso = anyConcurso[0];
      console.log(`📋 Ranking encontrado: ${concurso.titulo} (${concurso.id})`);
      console.log(`   - official_answers: ${concurso.official_answers ? 'Presente' : 'Ausente'}`);
      console.log(`   - exam_booklets: ${concurso.exam_booklets ? 'Presente' : 'Ausente'}`);
      
      if (concurso.official_answers) {
        console.log(`   - Estrutura official_answers:`, JSON.stringify(concurso.official_answers, null, 2));
      }
      
      if (concurso.exam_booklets) {
        console.log(`   - Estrutura exam_booklets:`, JSON.stringify(concurso.exam_booklets, null, 2));
      }
      
      return;
    }

    const concurso = concursos[0];
    console.log(`✅ Ranking com gabarito encontrado: ${concurso.titulo} (${concurso.id})`);

    // 2. Verificar estrutura do gabarito oficial
    console.log('\n2. Verificando estrutura do gabarito oficial...');
    
    if (!concurso.official_answers) {
      console.log('❌ PROBLEMA: official_answers está vazio ou null');
      return;
    }

    console.log('✅ official_answers presente');
    console.log('   - Estrutura:', JSON.stringify(concurso.official_answers, null, 2));

    // 3. Verificar cadernos disponíveis
    console.log('\n3. Verificando cadernos disponíveis...');
    
    if (!concurso.exam_booklets || !Array.isArray(concurso.exam_booklets)) {
      console.log('❌ PROBLEMA: exam_booklets não está presente ou não é array');
      return;
    }

    console.log(`✅ ${concurso.exam_booklets.length} cadernos encontrados:`);
    concurso.exam_booklets.forEach((booklet, index) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
    });

    // 4. Verificar se há gabarito para cada caderno
    console.log('\n4. Verificando gabarito para cada caderno...');
    
    let hasValidBooklet = false;
    
    for (const booklet of concurso.exam_booklets) {
      const bookletId = booklet.id;
      const bookletData = concurso.official_answers[bookletId];
      
      console.log(`\n   Caderno: ${booklet.name} (${bookletId})`);
      
      if (!bookletData) {
        console.log('   ❌ Nenhum gabarito encontrado para este caderno');
        continue;
      }
      
      console.log('   ✅ Gabarito encontrado');
      console.log(`   - Estrutura:`, JSON.stringify(bookletData, null, 2));
      
      if (bookletData.questions) {
        const questionCount = Object.keys(bookletData.questions).length;
        console.log(`   - Questões: ${questionCount}`);
        
        if (questionCount > 0) {
          hasValidBooklet = true;
          console.log('   ✅ Caderno tem questões válidas');
          
          // Mostrar algumas questões como exemplo
          const questionNumbers = Object.keys(bookletData.questions).slice(0, 3);
          questionNumbers.forEach(qNum => {
            const question = bookletData.questions[qNum];
            console.log(`     Questão ${qNum}: ${question.correct_answer} (peso: ${question.weight})`);
          });
        } else {
          console.log('   ❌ Caderno não tem questões');
        }
      } else {
        console.log('   ❌ Estrutura de questões não encontrada');
      }
    }

    // 5. Verificar se há pelo menos um caderno válido
    console.log('\n5. Verificando se há cadernos válidos...');
    
    if (!hasValidBooklet) {
      console.log('❌ PROBLEMA: Nenhum caderno tem gabarito válido');
      console.log('   - O sistema não conseguirá renderizar as questões');
      return;
    }

    console.log('✅ Pelo menos um caderno tem gabarito válido');

    // 6. Simular carregamento de respostas do usuário
    console.log('\n6. Simulando carregamento de respostas do usuário...');
    
    // Buscar um user_ranking para testar
    const { data: userRankings, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, concurso_id, selected_booklet')
      .eq('concurso_id', concurso.id)
      .limit(1);

    if (userRankingsError || !userRankings || userRankings.length === 0) {
      console.log('⚠️  Nenhum usuário participando deste ranking');
      console.log('   - Não é possível testar carregamento de respostas');
    } else {
      const userRanking = userRankings[0];
      console.log(`✅ Usuário encontrado: ${userRanking.user_id} (ranking: ${userRanking.id})`);
      console.log(`   - Caderno selecionado: ${userRanking.selected_booklet || 'Nenhum'}`);
      
      // Buscar respostas do usuário
      const { data: userAnswers, error: userAnswersError } = await supabase
        .from('user_answers')
        .select('question_number, user_answer, booklet_id')
        .eq('concurso_id', concurso.id)
        .eq('user_id', userRanking.user_id);

      if (userAnswersError) {
        console.log('❌ Erro ao buscar respostas do usuário:', userAnswersError.message);
      } else if (!userAnswers || userAnswers.length === 0) {
        console.log('⚠️  Usuário não tem respostas salvas');
      } else {
        console.log(`✅ ${userAnswers.length} respostas encontradas para o usuário`);
        console.log('   - Respostas:', userAnswers.slice(0, 3).map(a => `Q${a.question_number}: ${a.user_answer}`).join(', '));
      }
    }

    console.log('\n🎉 Teste de carregamento do gabarito oficial concluído!');
    console.log('✅ O sistema deve conseguir carregar e renderizar as questões');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testOfficialAnswersLoading();



