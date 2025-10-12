import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDisciplinesFlow() {
  console.log('🔍 Debugando fluxo de disciplinas...\n');

  try {
    // 1. Verificar ranking criado
    const { data: rankingData, error: rankingError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', 'e2d7fa3e-0cbf-4c65-a171-a89cf64ac7ca')
      .single();

    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }

    console.log('✅ Ranking encontrado:');
    console.log(`   - ID: ${rankingData.id}`);
    console.log(`   - Título: ${rankingData.titulo}`);

    // 2. Verificar dados de disciplinas
    console.log('\n📚 Dados de disciplinas:');
    console.log(`   - Disciplines: ${JSON.stringify(rankingData.disciplines, null, 2)}`);
    console.log(`   - Subjects: ${JSON.stringify(rankingData.subjects, null, 2)}`);

    // 3. Verificar se há dados de estrutura de prova
    console.log('\n🔧 Dados de estrutura de prova:');
    console.log(`   - has_basic_knowledge: ${rankingData.has_basic_knowledge}`);
    console.log(`   - basic_knowledge_questions: ${rankingData.basic_knowledge_questions}`);
    console.log(`   - basic_knowledge_weight: ${rankingData.basic_knowledge_weight}`);
    console.log(`   - has_specific_knowledge_1: ${rankingData.has_specific_knowledge_1}`);
    console.log(`   - specific_knowledge_1_questions: ${rankingData.specific_knowledge_1_questions}`);
    console.log(`   - has_custom_knowledge: ${rankingData.has_custom_knowledge}`);
    console.log(`   - custom_knowledge_questions: ${rankingData.custom_knowledge_questions}`);

    // 4. Verificar se há dados de gabarito
    console.log('\n📝 Dados de gabarito:');
    console.log(`   - official_answers: ${JSON.stringify(rankingData.official_answers, null, 2)}`);

    // 5. Verificar se há cadernos
    console.log('\n📚 Dados de cadernos:');
    console.log(`   - exam_booklets: ${JSON.stringify(rankingData.exam_booklets, null, 2)}`);

    // 6. Simular estrutura de disciplinas que deveria ser salva
    console.log('\n🧪 Estrutura de disciplinas esperada:');
    const expectedDisciplines = [
      {
        id: 'basic-knowledge',
        name: 'Conhecimentos Básicos',
        questionCount: 20,
        weight: 1,
        isEnabled: true,
        type: 'basic_knowledge'
      },
      {
        id: 'specific-knowledge-1',
        name: 'Conhecimentos Específicos 1',
        questionCount: 15,
        weight: 1,
        isEnabled: true,
        type: 'specific_knowledge_1'
      }
    ];
    console.log(JSON.stringify(expectedDisciplines, null, 2));

    // 7. Verificar se o problema é na estrutura dos dados
    console.log('\n🔍 Análise do problema:');
    if (!rankingData.disciplines || rankingData.disciplines.length === 0) {
      console.log('❌ PROBLEMA: Disciplinas estão vazias');
      console.log('   - O formulário não está salvando as disciplinas');
      console.log('   - ExamStructureSection não está populando o campo disciplines');
    } else {
      console.log('✅ Disciplinas encontradas');
    }

    if (!rankingData.official_answers || Object.keys(rankingData.official_answers).length === 0) {
      console.log('❌ PROBLEMA: Gabarito oficial está vazio');
      console.log('   - Sem disciplinas, não há como criar gabarito');
      console.log('   - AnswerKeySection precisa das disciplinas para funcionar');
    } else {
      console.log('✅ Gabarito oficial encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugDisciplinesFlow();

