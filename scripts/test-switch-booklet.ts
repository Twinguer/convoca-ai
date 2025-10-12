import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSwitchBooklet() {
  console.log('🧪 Testando função switch_user_booklet...\n');

  try {
    // 1. Buscar um user_ranking existente
    console.log('1. Buscando user_ranking existente...');
    
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, concurso_id, selected_booklet')
      .limit(1);

    if (rankingsError || !userRankings || userRankings.length === 0) {
      console.log('❌ Nenhum user_ranking encontrado');
      return;
    }

    const userRanking = userRankings[0];
    console.log(`✅ User ranking encontrado: ${userRanking.id}`);
    console.log(`   - User ID: ${userRanking.user_id}`);
    console.log(`   - Concurso ID: ${userRanking.concurso_id}`);
    console.log(`   - Selected booklet: ${userRanking.selected_booklet}`);

    // 2. Buscar cadernos disponíveis para o concurso
    console.log('\n2. Buscando cadernos disponíveis...');
    
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', userRanking.concurso_id)
      .single();

    if (concursoError || !concurso || !concurso.exam_booklets) {
      console.log('❌ Concurso ou cadernos não encontrados');
      return;
    }

    const booklets = concurso.exam_booklets;
    console.log(`✅ Cadernos encontrados: ${booklets.length}`);
    booklets.forEach((booklet, index) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
    });

    if (booklets.length < 2) {
      console.log('⚠️  Precisa de pelo menos 2 cadernos para testar a troca');
      return;
    }

    // 3. Testar a função switch_user_booklet
    console.log('\n3. Testando função switch_user_booklet...');
    
    const newBookletId = booklets[1].id; // Usar o segundo caderno
    console.log(`   - Trocando para caderno: ${newBookletId}`);

    const { data, error } = await supabase.rpc('switch_user_booklet', {
      p_ranking_id: userRanking.id,
      p_booklet_id: newBookletId
    });

    if (error) {
      console.error('❌ Erro na função switch_user_booklet:', error);
      return;
    }

    console.log('✅ Função executada com sucesso!');
    console.log('   - Resultado:', data);

    // 4. Verificar se o caderno foi alterado
    console.log('\n4. Verificando se o caderno foi alterado...');
    
    const { data: updatedRanking, error: updateError } = await supabase
      .from('user_rankings')
      .select('selected_booklet')
      .eq('id', userRanking.id)
      .single();

    if (updateError) {
      console.error('❌ Erro ao verificar atualização:', updateError);
      return;
    }

    console.log(`   - Caderno anterior: ${userRanking.selected_booklet}`);
    console.log(`   - Caderno atual: ${updatedRanking.selected_booklet}`);
    
    if (updatedRanking.selected_booklet === newBookletId) {
      console.log('✅ Caderno alterado com sucesso!');
    } else {
      console.log('❌ Caderno não foi alterado');
    }

    console.log('\n🎉 Teste de switch_user_booklet concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testSwitchBooklet();

