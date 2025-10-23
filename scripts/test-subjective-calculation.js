/**
 * Script para testar o cálculo de pontuações subjetivas
 * 
 * Este script verifica se as pontuações subjetivas estão sendo
 * incluídas corretamente no total score do ranking.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubjectiveCalculation(concursoId, userId) {
  try {
    console.log(`🧪 Testando cálculo de pontuações subjetivas para usuário ${userId} no concurso ${concursoId}`);
    
    // Buscar dados do usuário
    const { data: userRanking, error: userError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .eq('user_id', userId)
      .single();
    
    if (userError || !userRanking) {
      console.error('❌ Erro ao buscar dados do usuário:', userError);
      return { success: false, error: userError?.message };
    }
    
    const consolidatedData = userRanking.consolidated_data;
    const rankingData = consolidatedData?.rankings?.[`${userId}_${concursoId}`];
    
    if (!rankingData) {
      console.error('❌ Ranking não encontrado');
      return { success: false, error: 'Ranking not found' };
    }
    
    const userData = rankingData.user_data;
    
    console.log('📊 Dados do usuário:');
    console.log('  - Pontuação Total:', userData?.score);
    console.log('  - Pontuações Objetivas:', userData?.subject_scores_tot);
    console.log('  - Pontuações Subjetivas:', userData?.subjective_scores);
    console.log('  - Subjetivas Individuais:', userData?.subjectives);
    
    // Calcular pontuação esperada
    const objectiveTotal = userData?.subject_scores_tot || 0;
    const subjectiveTotal = userData?.subjective_scores || 0;
    const expectedTotal = objectiveTotal + subjectiveTotal;
    const actualScore = userData?.score || 0;
    
    console.log('🔍 Análise do cálculo:');
    console.log('  - Objetivas:', objectiveTotal);
    console.log('  - Subjetivas:', subjectiveTotal);
    console.log('  - Esperado (Objetivas + Subjetivas):', expectedTotal);
    console.log('  - Atual (Total Score):', actualScore);
    console.log('  - Diferença:', actualScore - expectedTotal);
    
    // Verificar se as subjetivas estão sendo incluídas
    if (Math.abs(actualScore - expectedTotal) > 0.01) {
      console.log('⚠️ PROBLEMA DETECTADO: Pontuações subjetivas não estão sendo incluídas no total!');
      console.log('   - O total score deveria ser:', expectedTotal);
      console.log('   - Mas está sendo:', actualScore);
      console.log('   - Diferença:', (actualScore - expectedTotal).toFixed(2));
      
      return { 
        success: false, 
        problem: 'Subjective scores not included in total',
        expectedTotal,
        actualScore,
        difference: actualScore - expectedTotal
      };
    } else {
      console.log('✅ Cálculo correto: Pontuações subjetivas estão sendo incluídas no total');
      return { 
        success: true, 
        expectedTotal,
        actualScore,
        difference: 0
      };
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error: error.message };
  }
}

async function testAllUsersSubjectiveCalculation(concursoId) {
  try {
    console.log(`🔍 Testando cálculo de subjetivas para todos os usuários do concurso ${concursoId}`);
    
    // Buscar todos os rankings do concurso
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .not('consolidated_data', 'is', null);
    
    if (rankingsError || !rankings) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return { success: false, error: rankingsError?.message };
    }
    
    let totalUsers = 0;
    let usersWithSubjectiveScores = 0;
    let usersWithProblems = 0;
    let totalDiscrepancy = 0;
    
    for (const ranking of rankings) {
      const consolidatedData = ranking.consolidated_data;
      if (!consolidatedData?.rankings) continue;
      
      // Verificar se o usuário tem rankings deste concurso
      const userRankings = Object.entries(consolidatedData.rankings).filter(
        ([rankingId, rankingData]) => rankingId.includes(concursoId)
      );
      
      if (userRankings.length === 0) continue;
      
      totalUsers++;
      
      for (const [rankingId, rankingData] of userRankings) {
        const userData = rankingData.user_data;
        if (!userData) continue;
        
        const objectiveTotal = userData.subject_scores_tot || 0;
        const subjectiveTotal = userData.subjective_scores || 0;
        const expectedTotal = objectiveTotal + subjectiveTotal;
        const actualScore = userData.score || 0;
        const difference = Math.abs(actualScore - expectedTotal);
        
        // Verificar se tem pontuações subjetivas
        if (subjectiveTotal > 0) {
          usersWithSubjectiveScores++;
          
          if (difference > 0.01) {
            usersWithProblems++;
            totalDiscrepancy += difference;
            
            console.log(`⚠️ Usuário ${ranking.user_id} (${rankingId}): problema no cálculo de subjetivas`);
            console.log(`   - Objetivas: ${objectiveTotal}`);
            console.log(`   - Subjetivas: ${subjectiveTotal}`);
            console.log(`   - Esperado: ${expectedTotal}`);
            console.log(`   - Atual: ${actualScore}`);
            console.log(`   - Diferença: ${difference.toFixed(2)}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Teste concluído!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Usuários processados: ${totalUsers}`);
    console.log(`   - Usuários com subjetivas: ${usersWithSubjectiveScores}`);
    console.log(`   - Usuários com problemas: ${usersWithProblems}`);
    console.log(`   - Total de discrepância: ${totalDiscrepancy.toFixed(2)} pontos`);
    
    if (usersWithProblems > 0) {
      console.log(`\n⚠️ PROBLEMA CONFIRMADO: ${usersWithProblems} usuários têm problemas no cálculo de subjetivas`);
      console.log(`   - As pontuações subjetivas não estão sendo incluídas no total score`);
      console.log(`   - Total de discrepância: ${totalDiscrepancy.toFixed(2)} pontos`);
    } else {
      console.log(`\n✅ SUCESSO: Todos os usuários têm cálculo correto de subjetivas`);
    }
    
    return { 
      success: true, 
      totalUsers,
      usersWithSubjectiveScores,
      usersWithProblems,
      totalDiscrepancy
    };
    
  } catch (error) {
    console.error('❌ Erro no teste geral:', error);
    return { success: false, error: error.message };
  }
}

// Executar script
async function main() {
  const concursoId = process.argv[2];
  const userId = process.argv[3];
  
  if (!concursoId) {
    console.error('❌ Uso: node test-subjective-calculation.js <concurso_id> [user_id]');
    console.log('💡 Exemplo: node test-subjective-calculation.js 123e4567-e89b-12d3-a456-426614174000');
    console.log('💡 Exemplo: node test-subjective-calculation.js 123e4567-e89b-12d3-a456-426614174000 user123');
    process.exit(1);
  }
  
  console.log('🚀 Iniciando teste de cálculo de subjetivas...');
  console.log(`🎯 Concurso ID: ${concursoId}`);
  
  if (userId) {
    console.log(`👤 Usuário específico: ${userId}`);
    const result = await testSubjectiveCalculation(concursoId, userId);
    
    if (result.success) {
      console.log('✅ Teste concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Problema detectado:', result.problem || result.error);
      process.exit(1);
    }
  } else {
    console.log('👥 Testando todos os usuários do concurso...');
    const result = await testAllUsersSubjectiveCalculation(concursoId);
    
    if (result.success) {
      if (result.usersWithProblems > 0) {
        console.log('⚠️ Problemas detectados - verifique os logs acima');
        process.exit(1);
      } else {
        console.log('✅ Teste geral concluído com sucesso!');
        process.exit(0);
      }
    } else {
      console.error('❌ Falha no teste geral:', result.error);
      process.exit(1);
    }
  }
}

main().catch(console.error);
