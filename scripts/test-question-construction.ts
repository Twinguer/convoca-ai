import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do useAnswerSheet
function isDisciplineBlock(block: any): boolean {
  return block && typeof block === 'object' && 'name' in block && 'disciplines' in block;
}

function getSectionQuestionsDict(concurso: any) {
  const result: { [key: string]: number[] } = {};

  if (!concurso) return result;

  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Check if hierarchical (blocks -> disciplines)
    const isHierarchical = concurso.disciplines.length > 0 && 
                           isDisciplineBlock(concurso.disciplines[0]);

    let currentQuestionNumber = 1;

    if (isHierarchical) {
      // Process hierarchical structure
      for (const block of concurso.disciplines) {
        if (isDisciplineBlock(block)) {
          // Process each discipline in the block
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Create array for this discipline if it doesn't exist
              if (!result[discipline.type]) {
                result[discipline.type] = [];
              }

              // Add question numbers for this discipline
              const questionCount = parseInt(String(discipline.questionCount), 10) || 0;
              for (let i = 0; i < questionCount; i++) {
                result[discipline.type].push(currentQuestionNumber);
                currentQuestionNumber++;
              }
            }
          }
        }
      }
    } else {
      // Process flat structure
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          // Create array for this discipline if it doesn't exist
          if (!result[discipline.type]) {
            result[discipline.type] = [];
          }

          // Add question numbers for this discipline
          const questionCount = parseInt(String(discipline.questionCount), 10) || 0;
          for (let i = 0; i < questionCount; i++) {
            result[discipline.type].push(currentQuestionNumber);
            currentQuestionNumber++;
          }
        }
      }
    }
  } else {
    // Traditional structure
    let questionNumber = 1;

    // Basic knowledge
    if (concurso.has_basic_knowledge) {
      result['basic'] = [];
      const questionCount = parseInt(String(concurso.basic_knowledge_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['basic'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 1
    if (concurso.has_specific_knowledge_1) {
      result['specific1'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_1_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific1'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 2
    if (concurso.has_specific_knowledge_2) {
      result['specific2'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_2_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific2'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 3
    if (concurso.has_specific_knowledge_3) {
      result['specific3'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_3_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific3'].push(questionNumber);
        questionNumber++;
      }
    }

    // Discursive sections (no question numbers)
    if (concurso.has_discursive) {
      result['discursive'] = [];
    }

    if (concurso.has_case_study_1) {
      result['case_study1'] = [];
    }

    if (concurso.has_case_study_2) {
      result['case_study2'] = [];
    }

    if (concurso.has_case_study_3) {
      result['case_study3'] = [];
    }
  }

  return result;
}

function createQuestionMatrix(questionNumbers: number[], columnsCount = 4): (number | null)[][] {
  if (!questionNumbers || questionNumbers.length === 0) {
    return [[null]];
  }

  const result: (number | null)[][] = [];
  let currentRow: (number | null)[] = [];

  questionNumbers.forEach((questionNumber) => {
    currentRow.push(questionNumber);

    if (currentRow.length === columnsCount) {
      result.push([...currentRow]);
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    // Pad the last row with nulls if needed
    while (currentRow.length < columnsCount) {
      currentRow.push(null);
    }
    result.push([...currentRow]);
    currentRow = [];
  }

  return result;
}

function getQuestionMatrixForSection(concurso: any, section: string, sectionQuestions: { [key: string]: number[] }): (number | null)[][] {
  if (!concurso || !section || !sectionQuestions) {
    return [[null]];
  }

  const questionNumbers = sectionQuestions[section] || [];
  
  return createQuestionMatrix(questionNumbers);
}

async function testQuestionConstruction() {
  console.log('🧪 Testando construção do caderno de questões...\n');

  try {
    // 1. Buscar ranking com disciplinas
    console.log('1. Buscando ranking com disciplinas...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, has_custom_knowledge, disciplines, exam_type')
      .eq('has_custom_knowledge', true)
      .not('disciplines', 'is', null)
      .limit(1);

    if (concursosError || !concursos || concursos.length === 0) {
      console.log('❌ Nenhum ranking com disciplinas encontrado');
      return;
    }

    const concurso = concursos[0];
    console.log(`✅ Ranking encontrado: ${concurso.titulo} (${concurso.id})`);
    console.log(`   - has_custom_knowledge: ${concurso.has_custom_knowledge}`);
    console.log(`   - exam_type: ${concurso.exam_type}`);
    console.log(`   - disciplines: ${JSON.stringify(concurso.disciplines, null, 2)}`);

    // 2. Testar getSectionQuestionsDict
    console.log('\n2. Testando getSectionQuestionsDict...');
    
    const sectionQuestions = getSectionQuestionsDict(concurso);
    console.log(`   - Seções encontradas: ${Object.keys(sectionQuestions).length}`);
    
    if (Object.keys(sectionQuestions).length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção encontrada');
      return;
    }

    Object.entries(sectionQuestions).forEach(([section, questions]) => {
      console.log(`     ${section}: ${questions.length} questões [${questions.slice(0, 5).join(', ')}${questions.length > 5 ? '...' : ''}]`);
    });

    // 3. Testar getQuestionMatrixForSection para cada seção
    console.log('\n3. Testando getQuestionMatrixForSection...');
    
    for (const [section, questions] of Object.entries(sectionQuestions)) {
      console.log(`\n   Seção: ${section}`);
      console.log(`   - Questões: [${questions.join(', ')}]`);
      
      const matrix = getQuestionMatrixForSection(concurso, section, sectionQuestions);
      console.log(`   - Matriz: ${matrix.length} linhas x ${matrix[0]?.length || 0} colunas`);
      
      if (matrix.length > 0 && matrix[0].length > 0) {
        console.log(`   - Primeira linha: [${matrix[0].map(q => q || 'null').join(', ')}]`);
        if (matrix.length > 1) {
          console.log(`   - Segunda linha: [${matrix[1].map(q => q || 'null').join(', ')}]`);
        }
      } else {
        console.log('   ❌ Matriz vazia ou inválida');
      }
    }

    // 4. Verificar se há problemas na construção
    console.log('\n4. Verificando problemas na construção...');
    
    let totalQuestions = 0;
    let sectionsWithQuestions = 0;
    
    for (const [section, questions] of Object.entries(sectionQuestions)) {
      if (questions.length > 0) {
        sectionsWithQuestions++;
        totalQuestions += questions.length;
      }
    }
    
    console.log(`   - Total de questões: ${totalQuestions}`);
    console.log(`   - Seções com questões: ${sectionsWithQuestions}`);
    
    if (totalQuestions === 0) {
      console.log('❌ PROBLEMA: Nenhuma questão foi gerada');
      console.log('   - Verificar se as disciplinas têm questionCount > 0');
      console.log('   - Verificar se as disciplinas estão habilitadas (isEnabled: true)');
    } else {
      console.log('✅ Questões foram geradas corretamente');
    }

    if (sectionsWithQuestions === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção tem questões');
      console.log('   - Verificar se as disciplinas têm type definido');
      console.log('   - Verificar se as disciplinas estão habilitadas');
    } else {
      console.log('✅ Seções com questões foram criadas');
    }

    // 5. Verificar estrutura das disciplinas
    console.log('\n5. Verificando estrutura das disciplinas...');
    
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const isHierarchical = concurso.disciplines.length > 0 && 
                            concurso.disciplines[0] && 
                            typeof concurso.disciplines[0] === 'object' && 
                            'name' in concurso.disciplines[0] && 
                            'disciplines' in concurso.disciplines[0];
      
      console.log(`   - É estrutura hierárquica: ${isHierarchical}`);
      
      if (isHierarchical) {
        for (const block of concurso.disciplines) {
          console.log(`   - Bloco: ${block.name}`);
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              console.log(`     - Disciplina: ${discipline.name} (${discipline.type})`);
              console.log(`       - isEnabled: ${discipline.isEnabled}`);
              console.log(`       - questionCount: ${discipline.questionCount}`);
            }
          }
        }
      } else {
        for (const discipline of concurso.disciplines) {
          console.log(`   - Disciplina: ${discipline.name} (${discipline.type})`);
          console.log(`     - isEnabled: ${discipline.isEnabled}`);
          console.log(`     - questionCount: ${discipline.questionCount}`);
        }
      }
    }

    console.log('\n🎉 Teste de construção de questões concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testQuestionConstruction();

