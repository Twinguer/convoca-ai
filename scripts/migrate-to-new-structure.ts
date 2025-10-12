import { createClient } from '@supabase/supabase-js';

// Credenciais do banco original (fonte)
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

// Credenciais do banco nomeia-ai (destino)
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

// Clientes para ambos os bancos
const sourceSupabase = createClient(originalUrl, originalAnonKey);
const targetSupabase = createClient(nomeiaUrl, nomeiaAnonKey);

interface MigrationStats {
  totalMigrated: number;
  totalErrors: number;
  tables: {
    [key: string]: {
      migrated: number;
      errors: number;
      details: string[];
    };
  };
}

async function migrateToNewStructure(): Promise<MigrationStats> {
  console.log('🚀 Iniciando migração para nova estrutura normalizada...');
  console.log('📊 Fonte:', originalUrl);
  console.log('📊 Destino:', nomeiaUrl);
  
  const stats: MigrationStats = {
    totalMigrated: 0,
    totalErrors: 0,
    tables: {}
  };

  try {
    // 1. MIGRAR USERS_PROFILES (manter estrutura)
    console.log('\n📊 Migrando users_profiles...');
    const { data: users, error: usersError } = await sourceSupabase
      .from('users_profiles')
      .select('*');
    
    stats.tables.users_profiles = { migrated: 0, errors: 0, details: [] };
    
    if (usersError) {
      console.error('❌ Erro ao buscar users_profiles:', usersError.message);
      stats.tables.users_profiles.errors++;
      stats.tables.users_profiles.details.push(`Erro ao buscar: ${usersError.message}`);
      stats.totalErrors++;
    } else if (users && users.length > 0) {
      const { error: insertUsersError } = await targetSupabase
        .from('users_profiles')
        .upsert(users, { onConflict: 'id' });
      
      if (insertUsersError) {
        console.error('❌ Erro ao inserir users_profiles:', insertUsersError.message);
        stats.tables.users_profiles.errors++;
        stats.tables.users_profiles.details.push(`Erro ao inserir: ${insertUsersError.message}`);
        stats.totalErrors++;
      } else {
        console.log(`✅ ${users.length} users_profiles migrados`);
        stats.tables.users_profiles.migrated = users.length;
        stats.totalMigrated += users.length;
      }
    } else {
      console.log('ℹ️ Nenhum users_profiles encontrado');
    }

    // 2. MIGRAR CONCURSOS → RANKINGS
    console.log('\n📊 Migrando concursos → rankings...');
    const { data: concursos, error: concursosError } = await sourceSupabase
      .from('concursos')
      .select('*');
    
    stats.tables.rankings = { migrated: 0, errors: 0, details: [] };
    
    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError.message);
      stats.tables.rankings.errors++;
      stats.tables.rankings.details.push(`Erro ao buscar: ${concursosError.message}`);
      stats.totalErrors++;
    } else if (concursos && concursos.length > 0) {
      // Transformar concursos em rankings
      const rankings = concursos.map(concurso => ({
        id: concurso.id,
        titulo: concurso.titulo || concurso.nome || 'Concurso sem título',
        orgao: concurso.orgao || 'Órgão não informado',
        banca: concurso.banca || 'Banca não informada',
        exam_type: concurso.exam_type || 'Alternativas',
        has_minimum_score: concurso.has_minimum_score || false,
        total_minimum_score: concurso.total_minimum_score || 0,
        total_participants: concurso.total_participants || 0,
        status: 'Ativo',
        created_at: concurso.created_at,
        updated_at: concurso.updated_at || concurso.created_at
      }));

      const { error: insertRankingsError } = await targetSupabase
        .from('rankings')
        .upsert(rankings, { onConflict: 'id' });
      
      if (insertRankingsError) {
        console.error('❌ Erro ao inserir rankings:', insertRankingsError.message);
        stats.tables.rankings.errors++;
        stats.tables.rankings.details.push(`Erro ao inserir: ${insertRankingsError.message}`);
        stats.totalErrors++;
      } else {
        console.log(`✅ ${rankings.length} rankings migrados`);
        stats.tables.rankings.migrated = rankings.length;
        stats.totalMigrated += rankings.length;
      }
    } else {
      console.log('ℹ️ Nenhum concurso encontrado');
    }

    // 3. MIGRAR USER_RANKINGS (manter estrutura)
    console.log('\n📊 Migrando user_rankings...');
    const { data: userRankings, error: userRankingsError } = await sourceSupabase
      .from('user_rankings')
      .select('*');
    
    stats.tables.user_rankings = { migrated: 0, errors: 0, details: [] };
    
    if (userRankingsError) {
      console.error('❌ Erro ao buscar user_rankings:', userRankingsError.message);
      stats.tables.user_rankings.errors++;
      stats.tables.user_rankings.details.push(`Erro ao buscar: ${userRankingsError.message}`);
      stats.totalErrors++;
    } else if (userRankings && userRankings.length > 0) {
      const { error: insertUserRankingsError } = await targetSupabase
        .from('user_rankings')
        .upsert(userRankings, { onConflict: 'id' });
      
      if (insertUserRankingsError) {
        console.error('❌ Erro ao inserir user_rankings:', insertUserRankingsError.message);
        stats.tables.user_rankings.errors++;
        stats.tables.user_rankings.details.push(`Erro ao inserir: ${insertUserRankingsError.message}`);
        stats.totalErrors++;
      } else {
        console.log(`✅ ${userRankings.length} user_rankings migrados`);
        stats.tables.user_rankings.migrated = userRankings.length;
        stats.totalMigrated += userRankings.length;
      }
    } else {
      console.log('ℹ️ Nenhum user_rankings encontrado');
    }

    // 4. MIGRAR USER_ANSWERS (manter estrutura)
    console.log('\n📊 Migrando user_answers...');
    const { data: userAnswers, error: userAnswersError } = await sourceSupabase
      .from('user_answers')
      .select('*');
    
    stats.tables.user_answers = { migrated: 0, errors: 0, details: [] };
    
    if (userAnswersError) {
      console.error('❌ Erro ao buscar user_answers:', userAnswersError.message);
      stats.tables.user_answers.errors++;
      stats.tables.user_answers.details.push(`Erro ao buscar: ${userAnswersError.message}`);
      stats.totalErrors++;
    } else if (userAnswers && userAnswers.length > 0) {
      const { error: insertUserAnswersError } = await targetSupabase
        .from('user_answers')
        .upsert(userAnswers, { onConflict: 'id' });
      
      if (insertUserAnswersError) {
        console.error('❌ Erro ao inserir user_answers:', insertUserAnswersError.message);
        stats.tables.user_answers.errors++;
        stats.tables.user_answers.details.push(`Erro ao inserir: ${insertUserAnswersError.message}`);
        stats.totalErrors++;
      } else {
        console.log(`✅ ${userAnswers.length} user_answers migrados`);
        stats.tables.user_answers.migrated = userAnswers.length;
        stats.totalMigrated += userAnswers.length;
      }
    } else {
      console.log('ℹ️ Nenhum user_answers encontrado');
    }

    // 5. MIGRAR OFFICIAL_ANSWER_WEIGHTS → RANKING_ANSWERS
    console.log('\n📊 Migrando official_answer_weights → ranking_answers...');
    const { data: answerWeights, error: answerWeightsError } = await sourceSupabase
      .from('official_answer_weights')
      .select('*');
    
    stats.tables.ranking_answers = { migrated: 0, errors: 0, details: [] };
    
    if (answerWeightsError) {
      console.error('❌ Erro ao buscar official_answer_weights:', answerWeightsError.message);
      stats.tables.ranking_answers.errors++;
      stats.tables.ranking_answers.details.push(`Erro ao buscar: ${answerWeightsError.message}`);
      stats.totalErrors++;
    } else if (answerWeights && answerWeights.length > 0) {
      // Transformar official_answer_weights em ranking_answers
      const rankingAnswers: any[] = [];
      
      for (const answerWeight of answerWeights) {
        if (answerWeight.consolidated_answer_data?.booklets) {
          for (const [bookletId, bookletData] of Object.entries(answerWeight.consolidated_answer_data.booklets)) {
            if (bookletData.answers) {
              for (const [questionNum, answerData] of Object.entries(bookletData.answers)) {
                rankingAnswers.push({
                  ranking_id: answerWeight.concurso_id,
                  booklet_id: bookletId,
                  question_number: parseInt(questionNum),
                  correct_answer: answerData.correct_answer || '',
                  weight: answerData.weight || 1.0,
                  is_nullified: answerData.is_nullified || false,
                  created_at: answerWeight.created_at
                });
              }
            }
          }
        }
      }

      if (rankingAnswers.length > 0) {
        const { error: insertRankingAnswersError } = await targetSupabase
          .from('ranking_answers')
          .upsert(rankingAnswers, { onConflict: 'ranking_id,booklet_id,question_number' });
        
        if (insertRankingAnswersError) {
          console.error('❌ Erro ao inserir ranking_answers:', insertRankingAnswersError.message);
          stats.tables.ranking_answers.errors++;
          stats.tables.ranking_answers.details.push(`Erro ao inserir: ${insertRankingAnswersError.message}`);
          stats.totalErrors++;
        } else {
          console.log(`✅ ${rankingAnswers.length} ranking_answers migrados`);
          stats.tables.ranking_answers.migrated = rankingAnswers.length;
          stats.totalMigrated += rankingAnswers.length;
        }
      } else {
        console.log('ℹ️ Nenhum ranking_answers encontrado para migrar');
      }
    } else {
      console.log('ℹ️ Nenhum official_answer_weights encontrado');
    }

    // 6. MIGRAR DISCIPLINAS → RANKING_DISCIPLINES
    console.log('\n📊 Migrando disciplinas → ranking_disciplines...');
    stats.tables.ranking_disciplines = { migrated: 0, errors: 0, details: [] };
    
    if (concursos && concursos.length > 0) {
      const rankingDisciplines: any[] = [];
      
      for (const concurso of concursos) {
        if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
          for (const discipline of concurso.disciplines) {
            if (discipline && typeof discipline === 'object' && discipline.type && discipline.name) {
              rankingDisciplines.push({
                ranking_id: concurso.id,
                discipline_id: discipline.type,
                discipline_name: discipline.name,
                minimum_score: discipline.minimum_score || 0,
                weight: discipline.weight || 1.0,
                created_at: concurso.created_at
              });
            }
          }
        }
      }

      if (rankingDisciplines.length > 0) {
        const { error: insertRankingDisciplinesError } = await targetSupabase
          .from('ranking_disciplines')
          .upsert(rankingDisciplines, { onConflict: 'ranking_id,discipline_id' });
        
        if (insertRankingDisciplinesError) {
          console.error('❌ Erro ao inserir ranking_disciplines:', insertRankingDisciplinesError.message);
          stats.tables.ranking_disciplines.errors++;
          stats.tables.ranking_disciplines.details.push(`Erro ao inserir: ${insertRankingDisciplinesError.message}`);
          stats.totalErrors++;
        } else {
          console.log(`✅ ${rankingDisciplines.length} ranking_disciplines migrados`);
          stats.tables.ranking_disciplines.migrated = rankingDisciplines.length;
          stats.totalMigrated += rankingDisciplines.length;
        }
      } else {
        console.log('ℹ️ Nenhum ranking_disciplines encontrado para migrar');
      }
    }

    // RESUMO FINAL
    console.log('\n🎉 Migração concluída!');
    console.log('='.repeat(60));
    console.log(`📊 Total de registros migrados: ${stats.totalMigrated}`);
    console.log(`❌ Total de erros: ${stats.totalErrors}`);
    console.log('='.repeat(60));
    
    // Detalhes por tabela
    for (const [tableName, tableStats] of Object.entries(stats.tables)) {
      console.log(`\n📋 ${tableName}:`);
      console.log(`  ✅ Migrados: ${tableStats.migrated}`);
      console.log(`  ❌ Erros: ${tableStats.errors}`);
      if (tableStats.details.length > 0) {
        console.log(`  📝 Detalhes dos erros:`);
        tableStats.details.forEach(detail => console.log(`    - ${detail}`));
      }
    }
    
    if (stats.totalErrors === 0) {
      console.log('\n🎉 Migração realizada com sucesso!');
    } else {
      console.log('\n⚠️ Migração concluída com alguns erros. Verifique os logs acima.');
    }
    
    return stats;
    
  } catch (error) {
    console.error('❌ Erro inesperado durante migração:', error);
    stats.totalErrors++;
    return stats;
  }
}

// Executar migração
migrateToNewStructure().catch(console.error);

