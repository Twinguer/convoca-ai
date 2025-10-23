/**
 * Script para corrigir pontuações em todos os rankings existentes
 * 
 * Este script aplica a correção de duplicação de pontuação subjetiva
 * em todos os rankings que apresentam discrepâncias.
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

async function fixAllScores() {
  try {
    console.log('🔧 Iniciando correção de pontuações em todos os rankings...');
    
    // Buscar todos os rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .not('consolidated_data', 'is', null);
    
    if (rankingsError || !rankings) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return { success: false, error: rankingsError?.message };
    }
    
    console.log(`👥 Encontrados ${rankings.length} usuários com rankings`);
    
    let totalUsers = 0;
    let usersWithDiscrepancies = 0;
    let totalCorrections = 0;
    let totalDiscrepancy = 0;
    
    for (const ranking of rankings) {
      const consolidatedData = ranking.consolidated_data;
      if (!consolidatedData?.rankings) continue;
      
      let hasChanges = false;
      const updatedRankings = { ...consolidatedData.rankings };
      
      // Verificar todos os rankings do usuário
      for (const [rankingId, rankingData] of Object.entries(updatedRankings)) {
        const userData = rankingData.user_data;
        if (!userData) continue;
        
        const objectiveTotal = userData.subject_scores_tot || 0;
        const subjectiveTotal = userData.subjective_scores || 0;
        const expectedTotal = objectiveTotal + subjectiveTotal;
        const actualScore = userData.score || 0;
        const difference = Math.abs(actualScore - expectedTotal);
        
        if (difference > 0.01) {
          usersWithDiscrepancies++;
          totalDiscrepancy += difference;
          
          console.log(`⚠️ Usuário ${ranking.user_id} (${rankingId}): discrepância de ${difference.toFixed(2)} pontos`);
          console.log(`   - Objetivas: ${objectiveTotal}`);
          console.log(`   - Subjetivas: ${subjectiveTotal}`);
          console.log(`   - Esperado: ${expectedTotal}`);
          console.log(`   - Atual: ${actualScore}`);
          
          // Aplicar correção
          const correctedScore = expectedTotal;
          
          updatedRankings[rankingId] = {
            ...rankingData,
            user_data: {
              ...userData,
              score: correctedScore,
              last_calculated: new Date().toISOString()
            }
          };
          
          hasChanges = true;
          totalCorrections++;
          
          console.log(`✅ Corrigido para: ${correctedScore}`);
        }
      }
      
      // Atualizar se houve mudanças
      if (hasChanges) {
        const updatedConsolidatedData = {
          ...consolidatedData,
          rankings: updatedRankings
        };
        
        const { error: updateError } = await supabase
          .from('user_rankings')
          .update({ consolidated_data: updatedConsolidatedData })
          .eq('user_id', ranking.user_id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar usuário ${ranking.user_id}:`, updateError);
        } else {
          console.log(`✅ Usuário ${ranking.user_id} atualizado com sucesso`);
        }
      }
      
      totalUsers++;
    }
    
    console.log(`\n🎉 Correção concluída!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Usuários processados: ${totalUsers}`);
    console.log(`   - Usuários com discrepâncias: ${usersWithDiscrepancies}`);
    console.log(`   - Correções aplicadas: ${totalCorrections}`);
    console.log(`   - Total de discrepância corrigida: ${totalDiscrepancy.toFixed(2)} pontos`);
    
    return { 
      success: true, 
      totalUsers,
      usersWithDiscrepancies,
      totalCorrections,
      totalDiscrepancy
    };
    
  } catch (error) {
    console.error('❌ Erro na correção:', error);
    return { success: false, error: error.message };
  }
}

async function fixSpecificConcurso(concursoId) {
  try {
    console.log(`🔧 Corrigindo pontuações para concurso ${concursoId}...`);
    
    // Buscar todos os rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .not('consolidated_data', 'is', null);
    
    if (rankingsError || !rankings) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return { success: false, error: rankingsError?.message };
    }
    
    let totalUsers = 0;
    let usersWithDiscrepancies = 0;
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
      
      let hasChanges = false;
      const updatedRankings = { ...consolidatedData.rankings };
      
      for (const [rankingId, rankingData] of userRankings) {
        const userData = rankingData.user_data;
        if (!userData) continue;
        
        const objectiveTotal = userData.subject_scores_tot || 0;
        const subjectiveTotal = userData.subjective_scores || 0;
        const expectedTotal = objectiveTotal + subjectiveTotal;
        const actualScore = userData.score || 0;
        const difference = Math.abs(actualScore - expectedTotal);
        
        if (difference > 0.01) {
          usersWithDiscrepancies++;
          totalDiscrepancy += difference;
          
          console.log(`⚠️ Usuário ${ranking.user_id} (${rankingId}): discrepância de ${difference.toFixed(2)} pontos`);
          
          // Aplicar correção
          const correctedScore = expectedTotal;
          
          updatedRankings[rankingId] = {
            ...rankingData,
            user_data: {
              ...userData,
              score: correctedScore,
              last_calculated: new Date().toISOString()
            }
          };
          
          hasChanges = true;
          totalCorrections++;
          
          console.log(`✅ Corrigido de ${actualScore} para ${correctedScore}`);
        }
      }
      
      // Atualizar se houve mudanças
      if (hasChanges) {
        const updatedConsolidatedData = {
          ...consolidatedData,
          rankings: updatedRankings
        };
        
        const { error: updateError } = await supabase
          .from('user_rankings')
          .update({ consolidated_data: updatedConsolidatedData })
          .eq('user_id', ranking.user_id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar usuário ${ranking.user_id}:`, updateError);
        } else {
          console.log(`✅ Usuário ${ranking.user_id} atualizado com sucesso`);
        }
      }
      
      totalUsers++;
    }
    
    console.log(`\n🎉 Correção concluída para concurso ${concursoId}!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Usuários processados: ${totalUsers}`);
    console.log(`   - Usuários com discrepâncias: ${usersWithDiscrepancies}`);
    console.log(`   - Correções aplicadas: ${totalCorrections}`);
    console.log(`   - Total de discrepância corrigida: ${totalDiscrepancy.toFixed(2)} pontos`);
    
    return { 
      success: true, 
      totalUsers,
      usersWithDiscrepancies,
      totalCorrections,
      totalDiscrepancy
    };
    
  } catch (error) {
    console.error('❌ Erro na correção do concurso:', error);
    return { success: false, error: error.message };
  }
}

// Executar script
async function main() {
  const concursoId = process.argv[2];
  
  console.log('🚀 Iniciando correção de pontuações...');
  
  if (concursoId) {
    console.log(`🎯 Concurso específico: ${concursoId}`);
    const result = await fixSpecificConcurso(concursoId);
    
    if (result.success) {
      console.log('✅ Correção do concurso concluída com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Falha na correção do concurso:', result.error);
      process.exit(1);
    }
  } else {
    console.log('🌍 Todos os concursos');
    const result = await fixAllScores();
    
    if (result.success) {
      console.log('✅ Correção geral concluída com sucesso!');
      process.exit(0);
    } else {
      console.error('❌ Falha na correção geral:', result.error);
      process.exit(1);
    }
  }
}

main().catch(console.error);
