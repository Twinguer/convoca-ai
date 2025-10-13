import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteRanking() {
  console.log('🧪 Testando exclusão de ranking...\n');

  try {
    // 1. Criar um ranking de teste
    console.log('1. Criando ranking de teste...');
    
    const testRanking = {
      titulo: 'Teste Exclusão',
      orgao: 'Teste',
      banca: 'Teste',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 4,
      created_by_user_id: null,
      has_basic_knowledge: true,
      basic_knowledge_questions: 10,
      basic_knowledge_weight: 1
    };

    const { data: newRanking, error: createError } = await supabase
      .from('concursos')
      .insert(testRanking)
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ranking:', createError);
      return;
    }

    console.log(`✅ Ranking criado: ${newRanking.id}`);

    // 2. Verificar se o ranking foi criado
    console.log('\n2. Verificando se ranking foi criado...');
    
    const { data: verifyRanking, error: verifyError } = await supabase
      .from('concursos')
      .select('id, titulo')
      .eq('id', newRanking.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar ranking:', verifyError);
      return;
    }

    console.log(`✅ Ranking encontrado: ${verifyRanking.titulo}`);

    // 3. Simular exclusão usando a mesma lógica do useDeleteRanking
    console.log('\n3. Simulando exclusão...');
    
    const concursoId = newRanking.id;
    
    // Buscar user_rankings
    const { data: userRankings, error: fetchError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('concurso_id', concursoId);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar user_rankings:', fetchError);
      return;
    }

    console.log(`   - user_rankings encontrados: ${userRankings?.length || 0}`);

    // Deletar dependências se existirem
    if (userRankings && userRankings.length > 0) {
      const userRankingIds = userRankings.map(ur => ur.id);
      
      // Deletar score_calculation_logs
      const { error: logsError } = await supabase
        .from('score_calculation_logs')
        .delete()
        .in('user_ranking_id', userRankingIds);
      
      if (logsError) {
        console.error('❌ Erro ao deletar score_calculation_logs:', logsError);
      } else {
        console.log('   ✅ score_calculation_logs deletados');
      }

      // Deletar user_answers
      const { error: answersError } = await supabase
        .from('user_answers')
        .delete()
        .in('user_ranking_id', userRankingIds);
      
      if (answersError) {
        console.error('❌ Erro ao deletar user_answers:', answersError);
      } else {
        console.log('   ✅ user_answers deletados');
      }
    }

    // Deletar user_rankings
    const { error: rankingsError } = await supabase
      .from('user_rankings')
      .delete()
      .eq('concurso_id', concursoId);
    
    if (rankingsError) {
      console.error('❌ Erro ao deletar user_rankings:', rankingsError);
    } else {
      console.log('   ✅ user_rankings deletados');
    }

    // Deletar concurso
    const { error: concursoError } = await supabase
      .from('concursos')
      .delete()
      .eq('id', concursoId);
    
    if (concursoError) {
      console.error('❌ Erro ao deletar concurso:', concursoError);
      return;
    }

    console.log('   ✅ concurso deletado');

    // 4. Verificar se foi realmente deletado
    console.log('\n4. Verificando se ranking foi deletado...');
    
    const { data: deletedRanking, error: checkError } = await supabase
      .from('concursos')
      .select('id')
      .eq('id', concursoId)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Ranking foi deletado com sucesso (não encontrado)');
    } else if (deletedRanking) {
      console.log('❌ Ranking ainda existe - exclusão falhou');
    } else {
      console.log('✅ Ranking foi deletado com sucesso');
    }

    console.log('\n🎉 Teste de exclusão concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDeleteRanking();



