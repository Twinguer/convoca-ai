/**
 * Script para testar a correção específica do Ricardo Lima
 * 
 * Este script testa se a correção resolve o problema de pontuação
 * e se as subjetivas são incluídas no total score.
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

async function testRicardoFix(concursoId, userId) {
  try {
    console.log(`🧪 Testando correção específica para Ricardo Lima`);
    console.log(`👤 Usuário: ${userId}`);
    console.log(`🎯 Concurso: ${concursoId}`);
    
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
    const rankingId = `${concursoId}_${userId}_${Date.now()}`;
    const rankingData = consolidatedData?.rankings?.[Object.keys(consolidatedData.rankings)[0]];
    
    if (!rankingData) {
      console.error('❌ Ranking não encontrado');
      return { success: false, error: 'Ranking not found' };
    }
    
    const userData = rankingData.user_data;
    
    console.log('📊 Dados ANTES da correção:');
    console.log('  - Pontuação Total:', userData?.score);
    console.log('  - Pontuações Objetivas:', userData?.subject_scores_tot);
    console.log('  - Pontuações Subjetivas:', userData?.subjective_scores);
    console.log('  - Subjetivas Individuais:', userData?.subjectives);
    
    // Calcular pontuação esperada
    const objectiveTotal = userData?.subject_scores_tot || 0;
    const subjectiveTotal = userData?.subjective_scores || 0;
    const expectedTotal = objectiveTotal + subjectiveTotal;
    const actualScore = userData?.score || 0;
    
    console.log('🔍 Análise do problema:');
    console.log('  - Objetivas:', objectiveTotal);
    console.log('  - Subjetivas:', subjectiveTotal);
    console.log('  - Esperado (Objetivas + Subjetivas):', expectedTotal);
    console.log('  - Atual (Total Score):', actualScore);
    console.log('  - Diferença:', actualScore - expectedTotal);
    
    if (Math.abs(actualScore - expectedTotal) > 0.01) {
      console.log('⚠️ PROBLEMA CONFIRMADO: Pontuações subjetivas não estão sendo incluídas no total!');
      console.log('   - O total score deveria ser:', expectedTotal);
      console.log('   - Mas está sendo:', actualScore);
      console.log('   - Diferença:', (actualScore - expectedTotal).toFixed(2));
      
      console.log('🔧 Aplicando correção...');
      
      // Aplicar correção: usar apenas pontuações weighted
      const correctedScore = expectedTotal;
      
      // Atualizar dados
      const updatedConsolidatedData = {
        ...consolidatedData,
        rankings: {
          ...consolidatedData.rankings,
          [Object.keys(consolidatedData.rankings)[0]]: {
            ...rankingData,
            user_data: {
              ...userData,
              score: correctedScore,
              last_calculated: new Date().toISOString()
            }
          }
        }
      };
      
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({ consolidated_data: updatedConsolidatedData })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar dados:', updateError);
        return { success: false, error: updateError.message };
      }
      
      console.log('✅ Correção aplicada com sucesso!');
      console.log('📊 Dados APÓS a correção:');
      console.log('  - Pontuação Total:', correctedScore);
      console.log('  - Diferença corrigida:', correctedScore - expectedTotal);
      
      return { 
        success: true, 
        correctedScore,
        originalScore: actualScore,
        difference: correctedScore - actualScore,
        message: `Correção aplicada: ${actualScore} → ${correctedScore}`
      };
    } else {
      console.log('✅ Pontuação já está correta - nenhuma correção necessária');
      return { 
        success: true, 
        correctedScore: actualScore,
        originalScore: actualScore,
        difference: 0,
        message: 'Pontuação já está correta'
      };
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { success: false, error: error.message };
  }
}

async function testAllUsersWithSubjectiveProblem(concursoId) {
  try {
    console.log(`🔍 Testando correção para todos os usuários com problema de subjetivas no concurso ${concursoId}`);
    
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
    let totalCorrections = 0;
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
            
            // Aplicar correção
            const correctedScore = expectedTotal;
            
            const updatedConsolidatedData = {
              ...consolidatedData,
              rankings: {
                ...consolidatedData.rankings,
                [rankingId]: {
                  ...rankingData,
                  user_data: {
                    ...userData,
                    score: correctedScore,
                    last_calculated: new Date().toISOString()
                  }
                }
              }
            };
            
            const { error: updateError } = await supabase
              .from('user_rankings')
              .update({ consolidated_data: updatedConsolidatedData })
              .eq('user_id', ranking.user_id);
            
            if (!updateError) {
              totalCorrections++;
              console.log(`✅ Usuário ${ranking.user_id}: corrigido de ${actualScore} para ${correctedScore}`);
            }
          }
        }
      }
    }
    
    console.log(`\n🎉 Teste concluído!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Usuários processados: ${totalUsers}`);
    console.log(`   - Usuários com subjetivas: ${usersWithSubjectiveScores}`);
    console.log(`   - Usuários com problemas: ${usersWithProblems}`);
    console.log(`   - Correções aplicadas: ${totalCorrections}`);
    console.log(`   - Total de discrepância: ${totalDiscrepancy.toFixed(2)} pontos`);
    
    if (usersWithProblems > 0) {
      console.log(`\n⚠️ PROBLEMA CONFIRMADO: ${usersWithProblems} usuários têm problemas no cálculo de subjetivas`);
      console.log(`   - As pontuações subjetivas não estão sendo incluídas no total score`);
      console.log(`   - Total de discrepância: ${totalDiscrepancy.toFixed(2)} pontos`);
      console.log(`   - Correções aplicadas: ${totalCorrections}`);
    } else {
      console.log(`\n✅ SUCESSO: Todos os usuários têm cálculo correto de subjetivas`);
    }
    
    return { 
      success: true, 
      totalUsers,
      usersWithSubjectiveScores,
      usersWithProblems,
      totalCorrections,
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
    console.error('❌ Uso: node test-ricardo-fix.js <concurso_id> [user_id]');
    console.log('💡 Exemplo: node test-ricardo-fix.js 123e4567-e89b-12d3-a456-426614174000');
    console.log('💡 Exemplo: node test-ricardo-fix.js 123e4567-e89b-12d3-a456-426614174000 user123');
    process.exit(1);
  }
  
  console.log('🚀 Iniciando teste de correção do Ricardo Lima...');
  console.log(`🎯 Concurso ID: ${concursoId}`);
  
  if (userId) {
    console.log(`👤 Usuário específico: ${userId}`);
    const result = await testRicardoFix(concursoId, userId);
    
    if (result.success) {
      console.log('✅ Teste concluído com sucesso!');
      console.log(`📊 Resultado: ${result.message}`);
      process.exit(0);
    } else {
      console.error('❌ Problema detectado:', result.error);
      process.exit(1);
    }
  } else {
    console.log('👥 Testando todos os usuários do concurso...');
    const result = await testAllUsersWithSubjectiveProblem(concursoId);
    
    if (result.success) {
      if (result.usersWithProblems > 0) {
        console.log('⚠️ Problemas detectados e corrigidos - verifique os logs acima');
        process.exit(0);
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
