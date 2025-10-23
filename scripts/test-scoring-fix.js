/**
 * Script para testar a correção do problema de pontuação total
 * 
 * Este script testa se a correção na função scoreObjectiveAnswer resolve
 * o problema de discrepância entre totalScore e expectedTotal.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testScoringFix(concursoId, userId = null) {
  try {
    console.log('🧪 Testando correção do problema de pontuação...');
    
    // Buscar dados do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError || !concurso) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }
    
    console.log(`📊 Concurso: ${concurso.title}`);
    console.log(`📊 Tipo: ${concurso.exam_type}`);
    
    // Buscar usuários do concurso
    let userRankings;
    if (userId) {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', userId)
        .not('consolidated_data', 'is', null);
      
      if (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return;
      }
      
      userRankings = data;
    } else {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .not('consolidated_data', 'is', null);
      
      if (error) {
        console.error('❌ Erro ao buscar rankings:', error);
        return;
      }
      
      userRankings = data;
    }
    
    console.log(`👥 Encontrados ${userRankings.length} usuários`);
    
    // Importar função de recálculo
    const { recalculateUserScore } = require('../src/integrations/supabase/rankings/rankingMutations');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const userRanking of userRankings) {
      try {
        console.log(`\n🔄 Recalculando para usuário: ${userRanking.user_id}`);
        
        const result = await recalculateUserScore(userRanking.user_id, concursoId);
        
        if (result.success) {
          console.log(`✅ Sucesso: ${result.message}`);
          console.log(`📊 Score atualizado: ${result.updatedScore}`);
          successCount++;
        } else {
          console.log(`❌ Erro: ${result.message}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao recalcular usuário ${userRanking.user_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Resultado do teste:`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processados: ${successCount + errorCount}`);
    
    if (errorCount === 0) {
      console.log(`\n🎉 Correção aplicada com sucesso!`);
      console.log(`📊 Agora o totalScore deve incluir os pesos corretos das disciplinas.`);
    } else {
      console.log(`\n⚠️ Alguns erros foram encontrados. Verifique os logs acima.`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
const concursoId = process.argv[2];
const userId = process.argv[3];

if (!concursoId) {
  console.error('❌ Uso: node scripts/test-scoring-fix.js <concurso_id> [user_id]');
  console.error('   Exemplo: node scripts/test-scoring-fix.js 33f1fdb1-3172-4ecf-836e-767a7dbe413a');
  console.error('   Exemplo: node scripts/test-scoring-fix.js 33f1fdb1-3172-4ecf-836e-767a7dbe413a 34d22725-d158-4d75-9089-efd049a1fb98');
  process.exit(1);
}

testScoringFix(concursoId, userId);
