import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDiscursiveDisciplines() {
  console.log('🔧 Corrigindo disciplinas discursivas na estrutura JSONB...\n');

  try {
    // 1. Buscar concursos que têm questões discursivas mas não na estrutura JSONB
    console.log('1️⃣ Buscando concursos com questões discursivas...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, has_discursive, has_case_study_1, has_case_study_2, has_case_study_3, discursive_weight, case_study_1_weight, case_study_2_weight, case_study_3_weight, disciplines')
      .or('has_discursive.eq.true,has_case_study_1.eq.true,has_case_study_2.eq.true,has_case_study_3.eq.true');

    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError.message);
      return;
    }

    console.log(`📊 Encontrados ${concursos?.length || 0} concursos com questões subjetivas:`);

    for (const concurso of concursos || []) {
      console.log(`\n🔍 Processando: ${concurso.titulo} (${concurso.id})`);
      
      let needsUpdate = false;
      let updatedDisciplines = [...(concurso.disciplines || [])];

      // Verificar se já tem disciplinas discursivas na estrutura JSONB
      const hasDiscursiveInJSONB = updatedDisciplines.some(block => 
        block.disciplines?.some((discipline: any) => 
          discipline.type === 'discursive' || 
          discipline.type === 'case_study_1' || 
          discipline.type === 'case_study_2' || 
          discipline.type === 'case_study_3'
        )
      );

      console.log(`   - Discursiva: ${concurso.has_discursive} (peso: ${concurso.discursive_weight})`);
      console.log(`   - Estudo de Caso 1: ${concurso.has_case_study_1} (peso: ${concurso.case_study_1_weight})`);
      console.log(`   - Estudo de Caso 2: ${concurso.has_case_study_2} (peso: ${concurso.case_study_2_weight})`);
      console.log(`   - Estudo de Caso 3: ${concurso.has_case_study_3} (peso: ${concurso.case_study_3_weight})`);
      console.log(`   - Já tem discursivas no JSONB: ${hasDiscursiveInJSONB}`);

      // Adicionar disciplinas discursivas se necessário
      if (concurso.has_discursive && !hasDiscursiveInJSONB) {
        console.log('   ➕ Adicionando disciplina discursiva...');
        
        // Encontrar o primeiro bloco ou criar um novo
        let targetBlock = updatedDisciplines.find(block => 
          block.name === 'Subjetivas' || 
          block.name === 'Provas Subjetivas' ||
          block.name === 'Discursivas'
        );

        if (!targetBlock) {
          // Criar novo bloco para disciplinas subjetivas
          targetBlock = {
            id: `subjective-${Date.now()}`,
            name: 'Provas Subjetivas',
            disciplines: [],
            minimum_score: 0
          };
          updatedDisciplines.push(targetBlock);
        }

        // Adicionar disciplina discursiva
        targetBlock.disciplines.push({
          id: `discursive-${Date.now()}`,
          name: 'Prova Discursiva',
          type: 'discursive',
          isEnabled: true,
          questionCount: 1,
          weight: concurso.discursive_weight || 1,
          minimum_score: 0
        });

        needsUpdate = true;
      }

      // Adicionar estudos de caso se necessário
      if (concurso.has_case_study_1) {
        console.log('   ➕ Adicionando estudo de caso 1...');
        
        let targetBlock = updatedDisciplines.find(block => 
          block.name === 'Subjetivas' || 
          block.name === 'Provas Subjetivas' ||
          block.name === 'Discursivas'
        );

        if (!targetBlock) {
          targetBlock = {
            id: `subjective-${Date.now()}`,
            name: 'Provas Subjetivas',
            disciplines: [],
            minimum_score: 0
          };
          updatedDisciplines.push(targetBlock);
        }

        targetBlock.disciplines.push({
          id: `case-study-1-${Date.now()}`,
          name: 'Estudo de Caso 1',
          type: 'case_study_1',
          isEnabled: true,
          questionCount: 1,
          weight: concurso.case_study_1_weight || 1,
          minimum_score: 0
        });

        needsUpdate = true;
      }

      if (concurso.has_case_study_2) {
        console.log('   ➕ Adicionando estudo de caso 2...');
        
        let targetBlock = updatedDisciplines.find(block => 
          block.name === 'Subjetivas' || 
          block.name === 'Provas Subjetivas' ||
          block.name === 'Discursivas'
        );

        if (!targetBlock) {
          targetBlock = {
            id: `subjective-${Date.now()}`,
            name: 'Provas Subjetivas',
            disciplines: [],
            minimum_score: 0
          };
          updatedDisciplines.push(targetBlock);
        }

        targetBlock.disciplines.push({
          id: `case-study-2-${Date.now()}`,
          name: 'Estudo de Caso 2',
          type: 'case_study_2',
          isEnabled: true,
          questionCount: 1,
          weight: concurso.case_study_2_weight || 1,
          minimum_score: 0
        });

        needsUpdate = true;
      }

      if (concurso.has_case_study_3) {
        console.log('   ➕ Adicionando estudo de caso 3...');
        
        let targetBlock = updatedDisciplines.find(block => 
          block.name === 'Subjetivas' || 
          block.name === 'Provas Subjetivas' ||
          block.name === 'Discursivas'
        );

        if (!targetBlock) {
          targetBlock = {
            id: `subjective-${Date.now()}`,
            name: 'Provas Subjetivas',
            disciplines: [],
            minimum_score: 0
          };
          updatedDisciplines.push(targetBlock);
        }

        targetBlock.disciplines.push({
          id: `case-study-3-${Date.now()}`,
          name: 'Estudo de Caso 3',
          type: 'case_study_3',
          isEnabled: true,
          questionCount: 1,
          weight: concurso.case_study_3_weight || 1,
          minimum_score: 0
        });

        needsUpdate = true;
      }

      // Atualizar o concurso se necessário
      if (needsUpdate) {
        console.log('   💾 Atualizando estrutura JSONB...');
        
        const { error: updateError } = await supabase
          .from('concursos')
          .update({ disciplines: updatedDisciplines })
          .eq('id', concurso.id);

        if (updateError) {
          console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
        } else {
          console.log('   ✅ Estrutura JSONB atualizada com sucesso!');
          console.log('   📋 Nova estrutura:', JSON.stringify(updatedDisciplines, null, 2));
        }
      } else {
        console.log('   ✅ Estrutura JSONB já está correta');
      }
    }

    console.log('\n🎉 Correção concluída!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Teste o cartão de respostas - as seções discursivas devem aparecer');
    console.log('   2. Preencha as pontuações discursivas');
    console.log('   3. Verifique se aparecem na classificação pós-prova');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixDiscursiveDisciplines();
