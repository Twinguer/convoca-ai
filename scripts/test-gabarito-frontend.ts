import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do frontend
function getObjectiveSectionList(concurso: any) {
  const sections = [];
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const isHierarchical = concurso.disciplines.length > 0 && 
                          concurso.disciplines[0] && 
                          typeof concurso.disciplines[0] === 'object' && 
                          'name' in concurso.disciplines[0] && 
                          'disciplines' in concurso.disciplines[0];
    
    if (isHierarchical) {
      // Estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines) {
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
      // Estrutura plana (disciplinas diretas)
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled) {
          sections.push({
            key: discipline.type,
            label: discipline.name
          });
        }
      }
    }
  }
  
  return sections;
}

function getAllQuestionsFromAllSections(concurso: any) {
  const allQuestions = [];
  let currentQuestionNumber = 1;

  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const isHierarchical = concurso.disciplines.length > 0 && 
                          concurso.disciplines[0] && 
                          typeof concurso.disciplines[0] === 'object' && 
                          'name' in concurso.disciplines[0] && 
                          'disciplines' in concurso.disciplines[0];
    
    if (isHierarchical) {
      // Estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.questionCount) {
              const questionCount = parseInt(discipline.questionCount) || 0;
              for (let i = 0; i < questionCount; i++) {
                allQuestions.push(currentQuestionNumber++);
              }
            }
          }
        }
      }
    } else {
      // Estrutura plana (disciplinas diretas)
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.questionCount) {
          const questionCount = parseInt(discipline.questionCount) || 0;
          for (let i = 0; i < questionCount; i++) {
            allQuestions.push(currentQuestionNumber++);
          }
        }
      }
    }
  }

  return allQuestions;
}

async function testGabaritoFrontend() {
  console.log('🧪 Testando gabarito oficial no frontend...\n');

  try {
    // 1. Buscar ranking com disciplinas
    console.log('1. Buscando ranking com disciplinas...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, has_custom_knowledge, disciplines, official_answers')
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
    console.log(`   - disciplines: ${JSON.stringify(concurso.disciplines, null, 2)}`);

    // 2. Simular getObjectiveSectionList
    console.log('\n2. Simulando getObjectiveSectionList...');
    
    const sections = getObjectiveSectionList(concurso);
    console.log(`   - Seções encontradas: ${sections.length}`);
    
    if (sections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção encontrada');
      console.log('   - O gabarito oficial não terá abas');
      return;
    }

    sections.forEach((section, index) => {
      console.log(`     ${index + 1}. ${section.key} -> ${section.label}`);
    });

    // 3. Simular getAllQuestionsFromAllSections
    console.log('\n3. Simulando getAllQuestionsFromAllSections...');
    
    const allQuestions = getAllQuestionsFromAllSections(concurso);
    console.log(`   - Total de questões esperadas: ${allQuestions.length}`);
    
    if (allQuestions.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma questão encontrada');
      console.log('   - O gabarito oficial estará vazio');
      return;
    }

    console.log(`   - Primeiras 5 questões: ${allQuestions.slice(0, 5).join(', ')}`);
    if (allQuestions.length > 5) {
      console.log(`   - Últimas 5 questões: ${allQuestions.slice(-5).join(', ')}`);
    }

    // 4. Verificar gabarito oficial
    console.log('\n4. Verificando gabarito oficial...');
    
    if (!concurso.official_answers || Object.keys(concurso.official_answers).length === 0) {
      console.log('⚠️  Gabarito oficial vazio - precisa ser preenchido');
      console.log('   - Isso é normal para rankings recém-criados');
    } else {
      console.log('✅ Gabarito oficial encontrado');
      
      // Verificar se há questões no gabarito
      let totalQuestionsInGabarito = 0;
      for (const [bookletId, bookletData] of Object.entries(concurso.official_answers)) {
        if (bookletData && typeof bookletData === 'object' && 'questions' in bookletData) {
          const questions = (bookletData as any).questions;
          if (questions && typeof questions === 'object') {
            totalQuestionsInGabarito += Object.keys(questions).length;
          }
        }
      }
      
      console.log(`   - Questões no gabarito: ${totalQuestionsInGabarito}`);
      
      if (totalQuestionsInGabarito === 0) {
        console.log('⚠️  Gabarito oficial não tem questões - precisa ser preenchido');
      } else {
        console.log('✅ Gabarito oficial tem questões');
      }
    }

    // 5. Simular renderização do AnswerKeyForm
    console.log('\n5. Simulando renderização do AnswerKeyForm...');
    
    console.log('   - Abas que seriam renderizadas:');
    sections.forEach((section, index) => {
      console.log(`     Aba ${index + 1}: ${section.label} (${section.key})`);
    });
    
    console.log('   - Questões que seriam renderizadas:');
    console.log(`     Total: ${allQuestions.length} questões`);
    console.log(`     Range: ${allQuestions[0]} a ${allQuestions[allQuestions.length - 1]}`);

    // 6. Verificar se tudo está funcionando
    console.log('\n6. Verificação final...');
    
    if (sections.length > 0 && allQuestions.length > 0) {
      console.log('✅ SUCESSO: Gabarito oficial deve renderizar corretamente');
      console.log('   - Disciplinas e blocos serão exibidos como abas');
      console.log('   - Questões serão numeradas corretamente');
      console.log('   - Estrutura hierárquica está funcionando');
    } else {
      console.log('❌ FALHA: Gabarito oficial não renderizará corretamente');
      if (sections.length === 0) {
        console.log('   - Problema: Nenhuma seção encontrada');
      }
      if (allQuestions.length === 0) {
        console.log('   - Problema: Nenhuma questão encontrada');
      }
    }

    console.log('\n🎉 Teste de gabarito frontend concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testGabaritoFrontend();



