/**
 * Script para limpar pontuações de subjetivas removidas em rankings existentes
 * 
 * Este script deve ser executado após a correção para limpar dados antigos
 * que podem estar causando problemas de pontuação.
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

async function cleanupConcursoSubjectives(concursoId) {
  try {
    console.log(`🧹 Iniciando limpeza para concurso: ${concursoId}`);
    
    // Buscar dados do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, titulo, subjects')
      .eq('id', concursoId)
      .single();
    
    if (concursoError || !concurso) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return { success: false, error: concursoError?.message };
    }
    
    console.log(`📋 Concurso: ${concurso.titulo}`);
    console.log('🔍 Subjetivas ativas:', {
      discursive: concurso.subjects?.discr === true,
      case_study_1: concurso.subjects?.case1 === true,
      case_study_2: concurso.subjects?.case2 === true,
      case_study_3: concurso.subjects?.case3 === true,
      other_subjective: concurso.subjects?.other === true
    });
    
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
    
    const activeSubjectives = {
      discursive: concurso.subjects?.discr === true,
      case_study_1: concurso.subjects?.case1 === true,
      case_study_2: concurso.subjects?.case2 === true,
      case_study_3: concurso.subjects?.case3 === true,
      other_subjective: concurso.subjects?.other === true
    };
    
    let totalCleaned = 0;
    let totalUsers = 0;
    
    for (const ranking of rankings) {
      const consolidatedData = ranking.consolidated_data;
      if (!consolidatedData?.rankings) continue;
      
      let hasChanges = false;
      const updatedRankings = { ...consolidatedData.rankings };
      
      // Verificar se o usuário tem rankings deste concurso
      const userRankings = Object.entries(updatedRankings).filter(
        ([rankingId, rankingData]) => rankingId.includes(concursoId)
      );
      
      if (userRankings.length === 0) continue;
      
      totalUsers++;
      
      for (const [rankingId, rankingData] of userRankings) {
        if (rankingData.user_data?.subjectives) {
          const currentSubjectives = rankingData.user_data.subjectives;
          const cleanedSubjectives = {
            discursive: activeSubjectives.discursive ? (currentSubjectives.discursive || 0) : 0,
            case_study_1: activeSubjectives.case_study_1 ? (currentSubjectives.case_study_1 || 0) : 0,
            case_study_2: activeSubjectives.case_study_2 ? (currentSubjectives.case_study_2 || 0) : 0,
            case_study_3: activeSubjectives.case_study_3 ? (currentSubjectives.case_study_3 || 0) : 0,
            other_subjective: activeSubjectives.other_subjective ? (currentSubjectives.other_subjective || 0) : 0
          };
          
          // Verificar se houve mudanças
          const hasChangesInRanking = Object.keys(cleanedSubjectives).some(
            key => cleanedSubjectives[key] !== (currentSubjectives[key] || 0)
          );
          
          if (hasChangesInRanking) {
            console.log(`🔧 Limpando ranking ${rankingId}:`, {
              antes: currentSubjectives,
              depois: cleanedSubjectives
            });
            
            updatedRankings[rankingId] = {
              ...rankingData,
              user_data: {
                ...rankingData.user_data,
                subjectives: cleanedSubjectives
              }
            };
            hasChanges = true;
            totalCleaned++;
          }
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
          console.log(`✅ Usuário ${ranking.user_id} atualizado`);
        }
      }
    }
    
    console.log(`\n🎉 Limpeza concluída!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Usuários processados: ${totalUsers}`);
    console.log(`   - Rankings limpos: ${totalCleaned}`);
    
    return { 
      success: true, 
      cleanedRankings: totalCleaned,
      processedUsers: totalUsers
    };
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return { success: false, error: error.message };
  }
}

// Executar script
async function main() {
  const concursoId = process.argv[2];
  
  if (!concursoId) {
    console.error('❌ Uso: node cleanup-removed-subjectives.js <concurso_id>');
    console.log('💡 Exemplo: node cleanup-removed-subjectives.js 123e4567-e89b-12d3-a456-426614174000');
    process.exit(1);
  }
  
  console.log('🚀 Iniciando limpeza de subjetivas removidas...');
  console.log(`🎯 Concurso ID: ${concursoId}`);
  
  const result = await cleanupConcursoSubjectives(concursoId);
  
  if (result.success) {
    console.log('✅ Limpeza executada com sucesso!');
    process.exit(0);
  } else {
    console.error('❌ Falha na limpeza:', result.error);
    process.exit(1);
  }
}

main().catch(console.error);
