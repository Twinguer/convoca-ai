import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOfficialAnswers() {
  console.log('🔍 Debugando gabarito oficial...\n');

  try {
    // 1. Verificar rankings existentes
    console.log('1. Verificando rankings existentes...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, official_answers, exam_booklets, disciplines')
      .order('created_at', { ascending: false });

    if (rankingsError) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }

    console.log(`✅ Encontrados ${rankings.length} rankings:`);
    
    rankings.forEach((ranking, index) => {
      console.log(`\n${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`   - Disciplinas: ${ranking.disciplines?.length || 0}`);
      console.log(`   - Cadernos: ${ranking.exam_booklets?.length || 0}`);
      console.log(`   - Gabarito oficial: ${Object.keys(ranking.official_answers || {}).length} cadernos`);
      
      // Verificar estrutura do gabarito oficial
      if (ranking.official_answers && Object.keys(ranking.official_answers).length > 0) {
        console.log('   - Estrutura do gabarito:');
        Object.entries(ranking.official_answers).forEach(([bookletId, bookletData]: [string, any]) => {
          console.log(`     * Caderno ${bookletId}: ${Object.keys(bookletData.questions || {}).length} questões`);
        });
      } else {
        console.log('   - ❌ Nenhum gabarito oficial encontrado');
      }
    });

    // 2. Verificar se há dados de gabarito oficial
    console.log('\n2. Verificando dados de gabarito oficial...');
    
    const rankingsWithAnswers = rankings.filter(r => r.official_answers && Object.keys(r.official_answers).length > 0);
    console.log(`✅ Rankings com gabarito oficial: ${rankingsWithAnswers.length}/${rankings.length}`);

    if (rankingsWithAnswers.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Nenhum ranking tem gabarito oficial');
      console.log('   - O sistema não está salvando o gabarito oficial');
      console.log('   - Ou o gabarito está sendo salvo em local incorreto');
    }

    // 3. Verificar estrutura esperada vs atual
    console.log('\n3. Verificando estrutura esperada...');
    
    const expectedStructure = {
      bookletId: {
        questions: {
          questionNumber: {
            correct_answer: 'A',
            weight: 1.0,
            section_type: 'basic',
            is_nullified: false,
            answer_format: 'OBJECTIVE',
            question_type: 'MULTIPLE_CHOICE'
          }
        }
      }
    };

    console.log('Estrutura esperada:');
    console.log(JSON.stringify(expectedStructure, null, 2));

    // 4. Verificar se há dados na tabela official_answer_weights (estrutura antiga)
    console.log('\n4. Verificando estrutura antiga (official_answer_weights)...');
    
    const { data: oldAnswers, error: oldError } = await supabase
      .from('official_answer_weights')
      .select('*')
      .limit(5);

    if (oldError) {
      console.log('❌ Tabela official_answer_weights não existe ou erro:', oldError.message);
    } else {
      console.log(`✅ Tabela official_answer_weights existe: ${oldAnswers.length} registros`);
    }

    // 5. Testar função getConsolidatedAnswerKey
    console.log('\n5. Testando função getConsolidatedAnswerKey...');
    
    if (rankings.length > 0) {
      const testRanking = rankings[0];
      console.log(`Testando com ranking: ${testRanking.titulo}`);
      
      const { data: testData, error: testError } = await supabase
        .from('concursos')
        .select('official_answers')
        .eq('id', testRanking.id)
        .single();

      if (testError) {
        console.error('❌ Erro ao testar getConsolidatedAnswerKey:', testError);
      } else {
        console.log('✅ getConsolidatedAnswerKey funcionou');
        console.log('Dados retornados:', testData.official_answers ? 'Presente' : 'Ausente');
        
        if (testData.official_answers) {
          const bookletIds = Object.keys(testData.official_answers);
          console.log(`Cadernos encontrados: ${bookletIds.length}`);
          bookletIds.forEach(id => {
            const booklet = testData.official_answers[id];
            const questionCount = Object.keys(booklet.questions || {}).length;
            console.log(`  - ${id}: ${questionCount} questões`);
          });
        }
      }
    }

    // 6. Análise do problema
    console.log('\n6. Análise do problema:');
    
    if (rankingsWithAnswers.length === 0) {
      console.log('❌ PROBLEMA PRINCIPAL: Nenhum gabarito oficial está sendo salvo');
      console.log('   - Possíveis causas:');
      console.log('     * useSaveRanking não está salvando official_answers');
      console.log('     * AnswerKeyForm não está funcionando');
      console.log('     * Dados estão sendo salvos em local incorreto');
      console.log('   - Solução: Verificar fluxo de salvamento do gabarito');
    } else {
      console.log('✅ Gabarito oficial está sendo salvo');
      console.log('   - Verificar se a renderização está funcionando');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugOfficialAnswers();



