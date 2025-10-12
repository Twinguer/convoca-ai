import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do AnswerSheet
function isDisciplineBlock(block: any): boolean {
  return block && typeof block === 'object' && 'name' in block && 'disciplines' in block;
}

function getSectionQuestionsDict(concurso: any) {
  const result: { [key: string]: number[] } = {};

  if (!concurso) return result;

  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const isHierarchical = concurso.disciplines.length > 0 && isDisciplineBlock(concurso.disciplines[0]);
    let currentQuestionNumber = 1;

    if (isHierarchical) {
      for (const block of concurso.disciplines) {
        if (isDisciplineBlock(block)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              if (!result[discipline.type]) {
                result[discipline.type] = [];
              }
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
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          if (!result[discipline.type]) {
            result[discipline.type] = [];
          }
          const questionCount = parseInt(String(discipline.questionCount), 10) || 0;
          for (let i = 0; i < questionCount; i++) {
            result[discipline.type].push(currentQuestionNumber);
            currentQuestionNumber++;
          }
        }
      }
    }
  }

  return result;
}

function getObjectiveSections(concurso: any) {
  if (!concurso) return [];
  
  const sections = [];
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const isHierarchicalStructure = concurso.disciplines.length > 0 && 
                                  concurso.disciplines[0] && 
                                  typeof concurso.disciplines[0] === 'object' && 
                                  'name' in concurso.disciplines[0] && 
                                  'disciplines' in concurso.disciplines[0];
    
    if (isHierarchicalStructure) {
      for (const block of concurso.disciplines) {
        if ('disciplines' in block) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              sections.push({
                key: discipline.type,
                label: `${block.name} - ${discipline.name}`
              });
            }
          }
        }
      }
    } else {
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          sections.push({
            key: discipline.type,
            label: discipline.name || discipline.type
          });
        }
      }
    }
  }

  return sections;
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

async function testAnswerSheetRendering() {
  console.log('🧪 Testando renderização do AnswerSheet...\n');

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

    // 2. Simular getSectionQuestionsDict
    console.log('\n2. Simulando getSectionQuestionsDict...');
    
    const sectionQuestions = getSectionQuestionsDict(concurso);
    console.log(`   - Seções encontradas: ${Object.keys(sectionQuestions).length}`);
    
    Object.entries(sectionQuestions).forEach(([section, questions]) => {
      console.log(`     ${section}: ${questions.length} questões [${questions.join(', ')}]`);
    });

    // 3. Simular getObjectiveSections
    console.log('\n3. Simulando getObjectiveSections...');
    
    const objectiveSections = getObjectiveSections(concurso);
    console.log(`   - Seções objetivas: ${objectiveSections.length}`);
    
    objectiveSections.forEach((section, index) => {
      console.log(`     ${index + 1}. ${section.key} -> ${section.label}`);
    });

    // 4. Simular selectedSection e createAnswerMatrix
    console.log('\n4. Simulando selectedSection e createAnswerMatrix...');
    
    if (objectiveSections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção objetiva encontrada');
      return;
    }

    const selectedSection = objectiveSections[0].key;
    console.log(`   - Seção selecionada: ${selectedSection}`);
    
    const matrix = getQuestionMatrixForSection(concurso, selectedSection, sectionQuestions);
    console.log(`   - Matriz criada: ${matrix.length} linhas x ${matrix[0]?.length || 0} colunas`);
    
    if (matrix.length > 0 && matrix[0].length > 0) {
      console.log(`   - Primeira linha: [${matrix[0].map(q => q || 'null').join(', ')}]`);
      if (matrix.length > 1) {
        console.log(`   - Segunda linha: [${matrix[1].map(q => q || 'null').join(', ')}]`);
      }
    }

    // 5. Verificar se a matriz tem questões válidas
    console.log('\n5. Verificando se a matriz tem questões válidas...');
    
    const hasQuestions = matrix.some(row => row.some(cell => cell !== null));
    console.log(`   - Tem questões válidas: ${hasQuestions}`);
    
    if (!hasQuestions) {
      console.log('❌ PROBLEMA: Matriz não tem questões válidas');
      console.log('   - Verificar se sectionQuestions tem dados para a seção selecionada');
      console.log(`   - sectionQuestions[${selectedSection}]:`, sectionQuestions[selectedSection]);
    } else {
      console.log('✅ Matriz tem questões válidas');
    }

    // 6. Simular renderização do AnswerMatrix
    console.log('\n6. Simulando renderização do AnswerMatrix...');
    
    if (!matrix || matrix.length === 0) {
      console.log('❌ PROBLEMA: Matriz é null ou vazia');
      console.log('   - AnswerMatrix renderizará: "Nenhuma questão disponível"');
    } else if (!hasQuestions) {
      console.log('❌ PROBLEMA: Matriz não tem questões válidas');
      console.log('   - AnswerMatrix renderizará: "Nenhuma questão disponível"');
    } else {
      console.log('✅ AnswerMatrix deve renderizar as questões corretamente');
      console.log(`   - Total de questões na matriz: ${matrix.flat().filter(q => q !== null).length}`);
    }

    // 7. Verificar se há problemas de sincronização
    console.log('\n7. Verificando problemas de sincronização...');
    
    const expectedQuestions = sectionQuestions[selectedSection] || [];
    const actualQuestions = matrix.flat().filter(q => q !== null);
    
    console.log(`   - Questões esperadas: [${expectedQuestions.join(', ')}]`);
    console.log(`   - Questões na matriz: [${actualQuestions.join(', ')}]`);
    
    if (expectedQuestions.length !== actualQuestions.length) {
      console.log('❌ PROBLEMA: Número de questões não bate');
    } else if (expectedQuestions.every((q, i) => q === actualQuestions[i])) {
      console.log('✅ Questões estão sincronizadas corretamente');
    } else {
      console.log('❌ PROBLEMA: Questões não estão na ordem correta');
    }

    console.log('\n🎉 Teste de renderização do AnswerSheet concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testAnswerSheetRendering();

