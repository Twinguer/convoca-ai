import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testParticipationWithBooklet() {
  console.log('🧪 Testando participação com seleção de caderno...\n');

  try {
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    const userId = '34d22725-d158-4d75-9089-efd049a1fb98';
    
    // 1. Buscar cadernos disponíveis
    console.log('1. Buscando cadernos disponíveis...');
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }
    
    const booklets = concursoData?.exam_booklets || [];
    console.log(`📚 Cadernos encontrados: ${booklets.length}`);
    booklets.forEach((booklet: any, index: number) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
    });
    
    if (booklets.length === 0) {
      console.log('❌ Nenhum caderno encontrado');
      return;
    }
    
    // 2. Simular participação com caderno selecionado
    console.log('\n2. Simulando participação com caderno selecionado...');
    const selectedBooklet = booklets[0].id; // Selecionar o primeiro caderno
    const selectedQuota = 'Ampla Concorrência';
    
    console.log(`📝 Caderno selecionado: ${selectedBooklet}`);
    console.log(`📝 Cota selecionada: ${selectedQuota}`);
    
    // 3. Verificar se já existe participação
    console.log('\n3. Verificando participação existente...');
    const { data: existingParticipation, error: existingError } = await supabase
      .from('user_rankings')
      .select('id, selected_booklet, reservation_type')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .maybeSingle();
    
    if (existingError) {
      console.error('❌ Erro ao verificar participação existente:', existingError);
      return;
    }
    
    if (existingParticipation) {
      console.log('⚠️ Participação já existe:', existingParticipation);
      
      // Atualizar o selected_booklet se estiver null
      if (!existingParticipation.selected_booklet) {
        console.log('🔄 Atualizando selected_booklet...');
        const { error: updateError } = await supabase
          .from('user_rankings')
          .update({ selected_booklet: selectedBooklet })
          .eq('id', existingParticipation.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar selected_booklet:', updateError);
          return;
        }
        
        console.log('✅ selected_booklet atualizado com sucesso!');
      } else {
        console.log('✅ selected_booklet já está definido:', existingParticipation.selected_booklet);
      }
    } else {
      console.log('📝 Criando nova participação...');
      const { data: newParticipation, error: insertError } = await supabase
        .from('user_rankings')
        .insert({
          user_id: userId,
          concurso_id: concursoId,
          score: 0,
          position: 0,
          reservation_type: selectedQuota,
          selected_booklet: selectedBooklet
        })
        .select('id, selected_booklet')
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao criar participação:', insertError);
        return;
      }
      
      console.log('✅ Participação criada com sucesso:', newParticipation);
    }
    
    // 4. Verificar se fetchExistingAnswers funcionará agora
    console.log('\n4. Testando fetchExistingAnswers...');
    const { data: finalParticipation, error: finalError } = await supabase
      .from('user_rankings')
      .select('id, selected_booklet, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score, concurso_id, user_id')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .single();
    
    if (finalError) {
      console.error('❌ Erro ao buscar participação final:', finalError);
      return;
    }
    
    console.log('✅ Dados da participação:', finalParticipation);
    
    if (finalParticipation.selected_booklet) {
      console.log('✅ selected_booklet está definido!');
      console.log('✅ fetchExistingAnswers deve funcionar agora!');
    } else {
      console.log('❌ selected_booklet ainda está null');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testParticipationWithBooklet();



