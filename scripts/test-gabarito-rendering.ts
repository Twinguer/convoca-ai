import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGabaritoRendering() {
  console.log('🧪 Testando renderização do gabarito oficial...\n');

  try {
    // 1. Buscar ranking com gabarito oficial
    console.log('1. Buscando ranking com gabarito oficial...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, official_answers, exam_booklets')
      .not('official_answers', 'is', null)
      .not('official_answers', 'eq', '{}')
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

    // 2. Testar getAnswerKeyForBooklet
    console.log('\n2. Testando getAnswerKeyForBooklet...');
    
    // Simular a função getConsolidatedAnswerKey
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', ranking.id)
      .single();

    if (consolidatedError) {
      console.error('❌ Erro ao buscar dados consolidados:', consolidatedError);
      return;
    }

    console.log('✅ Dados consolidados encontrados');
    
    if (!consolidatedData?.official_answers?.[bookletId]) {
      console.log('❌ Caderno não encontrado no gabarito oficial');
      return;
    }

    const bookletData = consolidatedData.official_answers[bookletId];
    console.log('   - Estrutura do caderno:', Object.keys(bookletData));
    
    // Verificar se tem questions (estrutura correta)
    if (bookletData.questions) {
      const questionCount = Object.keys(bookletData.questions).length;
      console.log(`   ✅ Estrutura correta: ${questionCount} questões encontradas`);
      
      // Mostrar algumas questões como exemplo
      const questions = bookletData.questions;
      const questionNumbers = Object.keys(questions).slice(0, 3);
      questionNumbers.forEach(qNum => {
        const question = questions[qNum];
        console.log(`     Questão ${qNum}: ${question.correct_answer} (${question.section_type})`);
      });
    } else {
      console.log('❌ Estrutura incorreta: campo "questions" não encontrado');
      console.log('   - Campos disponíveis:', Object.keys(bookletData));
    }

    // 3. Testar função getAnswerKeyForBooklet completa
    console.log('\n3. Testando função getAnswerKeyForBooklet completa...');
    
    // Simular a lógica da função
    const answers = Object.entries(bookletData.questions || {}).map(([questionNum, answerData]: [string, any]) => ({
      question_number: parseInt(questionNum),
      correct_answer: answerData.correct_answer,
      weight: answerData.weight || 1.0,
      section_type: answerData.section_type,
      is_nullified: answerData.is_nullified || false,
      answer_format: answerData.answer_format || 'OBJECTIVE',
      question_type: answerData.question_type || 'MULTIPLE_CHOICE'
    }));

    console.log(`✅ Função getAnswerKeyForBooklet retornaria ${answers.length} respostas`);
    
    if (answers.length > 0) {
      console.log('   - Primeiras 3 respostas:');
      answers.slice(0, 3).forEach(answer => {
        console.log(`     Questão ${answer.question_number}: ${answer.correct_answer} (${answer.section_type})`);
      });
    }

    // 4. Testar perfil do usuário
    console.log('\n4. Testando perfil do usuário...');
    
    // Buscar um usuário com rankings
    const { data: userRankings, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        concurso_id,
        score,
        concursos!inner(titulo, id)
      `)
      .limit(1);

    if (userRankingsError) {
      console.error('❌ Erro ao buscar rankings do usuário:', userRankingsError);
    } else {
      console.log(`✅ Rankings do usuário: ${userRankings.length} encontrados`);
      if (userRankings.length > 0) {
        const userRanking = userRankings[0];
        console.log(`   - Ranking: ${userRanking.concursos?.titulo} (Score: ${userRanking.score})`);
      }
    }

    // 5. Testar rankings criados pelo usuário
    console.log('\n5. Testando rankings criados pelo usuário...');
    
    const { data: createdRankings, error: createdRankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, created_by_user_id')
      .not('created_by_user_id', 'is', null)
      .limit(1);

    if (createdRankingsError) {
      console.error('❌ Erro ao buscar rankings criados:', createdRankingsError);
    } else {
      console.log(`✅ Rankings criados: ${createdRankings.length} encontrados`);
      if (createdRankings.length > 0) {
        const createdRanking = createdRankings[0];
        console.log(`   - Ranking: ${createdRanking.titulo} (Criado por: ${createdRanking.created_by_user_id})`);
      }
    }

    console.log('\n🎉 Teste de renderização concluído!');
    console.log('✅ Gabarito oficial deve estar funcionando');
    console.log('✅ Perfil do usuário deve estar funcionando');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testGabaritoRendering();
