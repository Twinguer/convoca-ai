import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnswerKeyForm() {
  console.log('🧪 Testando AnswerKeyForm...\n');

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

    // 2. Simular getAnswerKeyForBooklet
    console.log('\n2. Simulando getAnswerKeyForBooklet...');
    
    // Simular getConsolidatedAnswerKey
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
    if (!bookletData.questions) {
      console.log('❌ Estrutura incorreta: campo "questions" não encontrado');
      console.log('   - Campos disponíveis:', Object.keys(bookletData));
      return;
    }

    const questionCount = Object.keys(bookletData.questions).length;
    console.log(`   ✅ Estrutura correta: ${questionCount} questões encontradas`);

    // 3. Simular a lógica do AnswerKeyForm
    console.log('\n3. Simulando lógica do AnswerKeyForm...');
    
    // Simular a função getAnswerKeyForBooklet
    const answers = Object.entries(bookletData.questions).map(([questionNum, answerData]: [string, any]) => ({
      question_number: parseInt(questionNum),
      correct_answer: answerData.correct_answer,
      weight: answerData.weight || 1.0,
      section_type: answerData.section_type,
      is_nullified: answerData.is_nullified || false,
      answer_format: answerData.answer_format || 'OBJECTIVE',
      question_type: answerData.question_type || 'MULTIPLE_CHOICE'
    }));

    console.log(`✅ getAnswerKeyForBooklet retornaria ${answers.length} respostas`);
    
    if (answers.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma resposta encontrada');
      return;
    }

    // 4. Verificar se as respostas têm a estrutura esperada pelo AnswerKeyForm
    console.log('\n4. Verificando estrutura das respostas...');
    
    const firstAnswer = answers[0];
    console.log('   - Primeira resposta:', firstAnswer);
    
    const requiredFields = ['question_number', 'correct_answer', 'weight', 'section_type'];
    const missingFields = requiredFields.filter(field => !(field in firstAnswer));
    
    if (missingFields.length > 0) {
      console.log(`❌ Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
      return;
    }

    console.log('✅ Estrutura das respostas está correta');

    // 5. Simular o useEffect do AnswerKeyForm
    console.log('\n5. Simulando useEffect do AnswerKeyForm...');
    
    // Simular o que o AnswerKeyForm faria com as respostas
    const answersState: { [key: number]: string } = {};
    answers.forEach(answer => {
      answersState[answer.question_number] = answer.correct_answer;
    });

    console.log(`✅ Estado de respostas criado: ${Object.keys(answersState).length} questões`);
    console.log('   - Primeiras 3 respostas:');
    Object.entries(answersState).slice(0, 3).forEach(([questionNum, answer]) => {
      console.log(`     Questão ${questionNum}: ${answer}`);
    });

    // 6. Verificar se há problemas de renderização
    console.log('\n6. Verificando possíveis problemas de renderização...');
    
    // Verificar se há questões com respostas válidas
    const validAnswers = Object.values(answersState).filter(answer => answer && answer.trim() !== '');
    console.log(`   - Respostas válidas: ${validAnswers.length}/${Object.keys(answersState).length}`);
    
    if (validAnswers.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma resposta válida encontrada');
      return;
    }

    // Verificar se há questões com seções válidas
    const validSections = answers.filter(answer => answer.section_type && answer.section_type.trim() !== '');
    console.log(`   - Questões com seções válidas: ${validSections.length}/${answers.length}`);
    
    if (validSections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma questão com seção válida');
      return;
    }

    console.log('\n🎉 Teste do AnswerKeyForm concluído!');
    console.log('✅ Gabarito oficial deve estar funcionando no AnswerKeyForm');
    console.log('✅ Estrutura de dados está correta');
    console.log('✅ Respostas estão sendo processadas corretamente');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testAnswerKeyForm();

