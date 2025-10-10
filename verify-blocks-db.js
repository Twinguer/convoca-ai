// Script para verificar se os blocos estão sendo salvos no banco
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyBlocksInDatabase() {
  try {
    console.log('🔍 Verificando blocos salvos no banco de dados...');
    
    // Buscar dados do usuário
    const { data: userStudyData, error } = await supabase
      .from('user_study')
      .select('user_id, study_cycles, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }

    if (!userStudyData || userStudyData.length === 0) {
      console.log('⚠️ Nenhum dado encontrado na tabela user_study');
      return;
    }

    console.log(`📊 Encontrados ${userStudyData.length} registros:`);
    
    userStudyData.forEach((record, index) => {
      console.log(`\n--- Registro ${index + 1} ---`);
      console.log(`👤 User ID: ${record.user_id}`);
      console.log(`🕒 Atualizado em: ${record.updated_at}`);
      
      if (record.study_cycles && record.study_cycles.length > 0) {
        record.study_cycles.forEach((cycle, cycleIndex) => {
          console.log(`\n📚 Ciclo ${cycleIndex + 1}: ${cycle.cycle_name}`);
          
          if (cycle.schedule_data) {
            const { available_blocks, available_disciplines } = cycle.schedule_data;
            
            console.log(`📦 Blocos disponíveis: ${available_blocks ? available_blocks.length : 0}`);
            if (available_blocks && available_blocks.length > 0) {
              available_blocks.forEach(block => {
                console.log(`  - ${block.name} (${block.disciplines ? block.disciplines.length : 0} disciplinas)`);
                if (block.disciplines) {
                  block.disciplines.forEach(discipline => {
                    console.log(`    * ${discipline.name}`);
                  });
                }
              });
            }
            
            console.log(`📖 Disciplinas disponíveis: ${available_disciplines ? available_disciplines.length : 0}`);
            if (available_disciplines && available_disciplines.length > 0) {
              available_disciplines.forEach(discipline => {
                console.log(`  - ${discipline.name} (Bloco: ${discipline.block_name})`);
              });
            }
          } else {
            console.log('⚠️ schedule_data não encontrado');
          }
        });
      } else {
        console.log('⚠️ Nenhum ciclo encontrado');
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
verifyBlocksInDatabase();
