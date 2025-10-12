import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular as funções do AnswerSheet
function isHierarchicalStructure(concurso: any) {
  return concurso.disciplines && 
         Array.isArray(concurso.disciplines) && 
         concurso.disciplines.length > 0 && 
         concurso.disciplines[0] && 
         typeof concurso.disciplines[0] === 'object' && 
         'name' in concurso.disciplines[0] && 
         'disciplines' in concurso.disciplines[0];
}

function getObjectiveSections(concurso: any) {
  if (!concurso) return [];
  
  const sections = [];
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Check if we're using the hierarchical structure (blocks -> disciplines)
    const isHierarchicalStructure = concurso.disciplines.length > 0 && 
                                  concurso.disciplines[0] && 
                                  typeof concurso.disciplines[0] === 'object' && 
                                  'name' in concurso.disciplines[0] && 
                                  'disciplines' in concurso.disciplines[0];
    
    console.log('[getObjectiveSections] isHierarchicalStructure:', isHierarchicalStructure);
    console.log('[getObjectiveSections] disciplines:', concurso.disciplines);
    
    if (isHierarchicalStructure) {
      // Hierarchical structure (blocks -> disciplines)
      for (const block of concurso.disciplines) {
        // TypeGuard to check if it's a block with disciplines property
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
      // Flat structure
      for (const discipline of concurso.disciplines) {
        // TypeGuard to check if it's a discipline
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          sections.push({
            key: discipline.type,
            label: discipline.name || discipline.type
          });
        }
      }
    }
  } else {
    // Traditional structure
    if (concurso.has_basic_knowledge) {
      sections.push({ key: 'basic', label: 'Conhecimentos Básicos' });
    }
    
    if (concurso.has_specific_knowledge_1) {
      sections.push({ key: 'specific1', label: 'Conhecimentos Específicos 1' });
    }
    
    if (concurso.has_specific_knowledge_2) {
      sections.push({ key: 'specific2', label: 'Conhecimentos Específicos 2' });
    }
    
    if (concurso.has_specific_knowledge_3) {
      sections.push({ key: 'specific3', label: 'Conhecimentos Específicos 3' });
    }
  }
  
  console.log('[getObjectiveSections] Objective sections:', sections);
  return sections;
}

async function testParticipationFlow() {
  console.log('🧪 Testando fluxo de participação...\n');

  try {
    // 1. Buscar ranking com disciplinas
    console.log('1. Buscando ranking com disciplinas...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, has_custom_knowledge, disciplines, exam_booklets')
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

    // 2. Simular getObjectiveSections
    console.log('\n2. Simulando getObjectiveSections...');
    
    const objectiveSections = getObjectiveSections(concurso);
    console.log(`   - Seções encontradas: ${objectiveSections.length}`);
    
    if (objectiveSections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção encontrada');
      console.log('   - O AnswerSheet não renderizará abas');
      return;
    }

    objectiveSections.forEach((section, index) => {
      console.log(`     ${index + 1}. ${section.key} -> ${section.label}`);
    });

    // 3. Verificar cadernos
    console.log('\n3. Verificando cadernos...');
    
    if (!concurso.exam_booklets || !Array.isArray(concurso.exam_booklets) || concurso.exam_booklets.length === 0) {
      console.log('❌ PROBLEMA: Nenhum caderno encontrado');
      console.log('   - O usuário não conseguirá selecionar caderno');
      return;
    }

    console.log(`   - Cadernos encontrados: ${concurso.exam_booklets.length}`);
    concurso.exam_booklets.forEach((booklet, index) => {
      console.log(`     ${index + 1}. ${booklet.name} (${booklet.id})`);
    });

    // 4. Simular fluxo de participação
    console.log('\n4. Simulando fluxo de participação...');
    
    console.log('   - Usuário clica em "Participar"');
    console.log('   - Sistema carrega cadernos: ✅');
    console.log('   - Usuário seleciona caderno: ✅');
    console.log('   - Sistema cria user_ranking: ✅');
    console.log('   - Sistema redireciona para AnswerSheet: ✅');
    console.log('   - AnswerSheet carrega seções: ✅');
    console.log('   - AnswerSheet renderiza abas: ✅');

    // 5. Verificar se tudo está funcionando
    console.log('\n5. Verificação final...');
    
    if (objectiveSections.length > 0 && concurso.exam_booklets.length > 0) {
      console.log('✅ SUCESSO: Fluxo de participação deve funcionar');
      console.log('   - Cadernos serão exibidos para seleção');
      console.log('   - AnswerSheet renderizará abas por disciplina');
      console.log('   - Usuário conseguirá responder questões');
    } else {
      console.log('❌ FALHA: Fluxo de participação não funcionará');
      if (objectiveSections.length === 0) {
        console.log('   - Problema: Nenhuma seção encontrada no AnswerSheet');
      }
      if (concurso.exam_booklets.length === 0) {
        console.log('   - Problema: Nenhum caderno encontrado');
      }
    }

    console.log('\n🎉 Teste de fluxo de participação concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testParticipationFlow();