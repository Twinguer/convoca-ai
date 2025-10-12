import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDisciplinesStructure() {
  console.log('🧪 Testando estrutura de disciplinas e blocos...\n');

  try {
    // 1. Buscar ranking com gabarito oficial
    console.log('1. Buscando ranking com gabarito oficial...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, has_custom_knowledge, disciplines, official_answers, exam_booklets')
      .not('official_answers', 'is', null)
      .not('official_answers', 'eq', '{}')
      .limit(1);

    if (rankingsError || !rankings.length) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }

    const ranking = rankings[0];
    console.log(`✅ Ranking encontrado: ${ranking.titulo} (${ranking.id})`);
    console.log(`   - has_custom_knowledge: ${ranking.has_custom_knowledge}`);
    console.log(`   - disciplines: ${JSON.stringify(ranking.disciplines, null, 2)}`);
    
    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      console.log('❌ Ranking não tem cadernos');
      return;
    }

    const bookletId = ranking.exam_booklets[0].id;
    console.log(`   - Usando caderno: ${bookletId}`);

    // 2. Verificar estrutura de disciplinas
    console.log('\n2. Verificando estrutura de disciplinas...');
    
    if (!ranking.disciplines || !Array.isArray(ranking.disciplines)) {
      console.log('❌ Campo disciplines não existe ou não é array');
      return;
    }

    console.log(`   - Número de itens em disciplines: ${ranking.disciplines.length}`);
    
    // Verificar se é estrutura hierárquica
    const isHierarchical = ranking.disciplines.length > 0 && 
                          ranking.disciplines[0] && 
                          typeof ranking.disciplines[0] === 'object' && 
                          'name' in ranking.disciplines[0] && 
                          'disciplines' in ranking.disciplines[0];
    
    console.log(`   - É estrutura hierárquica: ${isHierarchical}`);
    
    if (isHierarchical) {
      console.log('   - Estrutura hierárquica (blocos -> disciplinas):');
      ranking.disciplines.forEach((block: any, blockIndex: number) => {
        console.log(`     Bloco ${blockIndex + 1}: ${block.name}`);
        if (block.disciplines && Array.isArray(block.disciplines)) {
          block.disciplines.forEach((discipline: any, disciplineIndex: number) => {
            console.log(`       Disciplina ${disciplineIndex + 1}: ${discipline.name} (${discipline.type}) - ${discipline.questionCount} questões`);
          });
        }
      });
    } else {
      console.log('   - Estrutura plana (disciplinas diretas):');
      ranking.disciplines.forEach((discipline: any, index: number) => {
        console.log(`     Disciplina ${index + 1}: ${discipline.name} (${discipline.type}) - ${discipline.questionCount} questões`);
      });
    }

    // 3. Verificar gabarito oficial
    console.log('\n3. Verificando gabarito oficial...');
    
    if (!ranking.official_answers || !ranking.official_answers[bookletId]) {
      console.log('❌ Gabarito oficial não encontrado para este caderno');
      return;
    }

    const bookletData = ranking.official_answers[bookletId];
    console.log(`   - Estrutura do gabarito: ${Object.keys(bookletData)}`);
    
    if (bookletData.questions) {
      const questionCount = Object.keys(bookletData.questions).length;
      console.log(`   - Número de questões no gabarito: ${questionCount}`);
      
      // Mostrar algumas questões
      const questionNumbers = Object.keys(bookletData.questions).slice(0, 3);
      console.log('   - Primeiras questões:');
      questionNumbers.forEach(qNum => {
        const question = bookletData.questions[qNum];
        console.log(`     Questão ${qNum}: ${question.correct_answer} (${question.section_type})`);
      });
    }

    // 4. Simular função getObjectiveSectionList
    console.log('\n4. Simulando função getObjectiveSectionList...');
    
    const sections = [];
    
    if (ranking.has_custom_knowledge && ranking.disciplines && Array.isArray(ranking.disciplines)) {
      if (isHierarchical) {
        // Estrutura hierárquica
        for (const block of ranking.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                sections.push({
                  key: discipline.type,
                  label: `${block.name} - ${discipline.name}`
                });
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const discipline of ranking.disciplines) {
          if (discipline.isEnabled) {
            sections.push({
              key: discipline.type,
              label: discipline.name
            });
          }
        }
      }
    } else {
      // Estrutura tradicional
      console.log('   - Usando estrutura tradicional (não customizada)');
    }

    console.log(`   - Seções encontradas: ${sections.length}`);
    sections.forEach((section, index) => {
      console.log(`     ${index + 1}. ${section.key} -> ${section.label}`);
    });

    // 5. Simular função getAllQuestionsFromAllSections
    console.log('\n5. Simulando função getAllQuestionsFromAllSections...');
    
    const allQuestions = [];
    let currentQuestionNumber = 1;

    if (ranking.has_custom_knowledge && ranking.disciplines && Array.isArray(ranking.disciplines)) {
      if (isHierarchical) {
        // Estrutura hierárquica
        for (const block of ranking.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                const questionCount = parseInt(discipline.questionCount) || 0;
                for (let i = 0; i < questionCount; i++) {
                  allQuestions.push(currentQuestionNumber++);
                }
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const discipline of ranking.disciplines) {
          if (discipline.isEnabled && discipline.questionCount) {
            const questionCount = parseInt(discipline.questionCount) || 0;
            for (let i = 0; i < questionCount; i++) {
              allQuestions.push(currentQuestionNumber++);
            }
          }
        }
      }
    }

    console.log(`   - Total de questões esperadas: ${allQuestions.length}`);
    if (allQuestions.length > 0) {
      console.log(`   - Primeiras 5 questões: ${allQuestions.slice(0, 5).join(', ')}`);
      console.log(`   - Últimas 5 questões: ${allQuestions.slice(-5).join(', ')}`);
    }

    // 6. Verificar se há problemas
    console.log('\n6. Verificando problemas...');
    
    if (sections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção encontrada para renderizar');
      console.log('   - Isso significa que o gabarito oficial não terá abas');
    } else {
      console.log('✅ Seções encontradas - gabarito deve renderizar corretamente');
    }

    if (allQuestions.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma questão encontrada');
      console.log('   - Isso significa que o gabarito oficial estará vazio');
    } else {
      console.log('✅ Questões encontradas - gabarito deve ter conteúdo');
    }

    // 7. Verificar se as questões do gabarito batem com as esperadas
    if (bookletData.questions && allQuestions.length > 0) {
      const gabaritoQuestions = Object.keys(bookletData.questions).map(q => parseInt(q)).sort((a, b) => a - b);
      const expectedQuestions = allQuestions.sort((a, b) => a - b);
      
      console.log('\n7. Comparando questões esperadas vs gabarito...');
      console.log(`   - Questões esperadas: ${expectedQuestions.length}`);
      console.log(`   - Questões no gabarito: ${gabaritoQuestions.length}`);
      
      if (gabaritoQuestions.length !== expectedQuestions.length) {
        console.log('❌ PROBLEMA: Número de questões não bate');
        console.log(`   - Esperado: ${expectedQuestions.length}, Encontrado: ${gabaritoQuestions.length}`);
      } else {
        console.log('✅ Número de questões está correto');
      }
    }

    console.log('\n🎉 Teste de estrutura concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDisciplinesStructure();

