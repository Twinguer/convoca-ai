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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    source: { [key: string]: number };
    target: { [key: string]: number };
  };
}

async function validateMigration(): Promise<ValidationResult> {
  console.log('🔍 Validando migração de dados...');
  
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      source: {},
      target: {}
    }
  };

  try {
    // 1. VALIDAR USERS_PROFILES
    console.log('\n📊 Validando users_profiles...');
    const [sourceUsers, targetUsers] = await Promise.all([
      sourceSupabase.from('users_profiles').select('count', { count: 'exact', head: true }),
      targetSupabase.from('users_profiles').select('count', { count: 'exact', head: true })
    ]);

    const sourceUsersCount = sourceUsers.data || 0;
    const targetUsersCount = targetUsers.data || 0;
    result.stats.source.users_profiles = sourceUsersCount;
    result.stats.target.users_profiles = targetUsersCount;

    if (sourceUsersCount !== targetUsersCount) {
      result.errors.push(`users_profiles: Contagem diferente (origem: ${sourceUsersCount}, destino: ${targetUsersCount})`);
      result.isValid = false;
    } else {
      console.log(`✅ users_profiles: ${targetUsersCount} registros (OK)`);
    }

    // 2. VALIDAR CONCURSOS → RANKINGS
    console.log('\n📊 Validando concursos → rankings...');
    const [sourceConcursos, targetRankings] = await Promise.all([
      sourceSupabase.from('concursos').select('count', { count: 'exact', head: true }),
      targetSupabase.from('rankings').select('count', { count: 'exact', head: true })
    ]);

    const sourceConcursosCount = sourceConcursos.data || 0;
    const targetRankingsCount = targetRankings.data || 0;
    result.stats.source.concursos = sourceConcursosCount;
    result.stats.target.rankings = targetRankingsCount;

    if (sourceConcursosCount !== targetRankingsCount) {
      result.errors.push(`concursos→rankings: Contagem diferente (origem: ${sourceConcursosCount}, destino: ${targetRankingsCount})`);
      result.isValid = false;
    } else {
      console.log(`✅ concursos→rankings: ${targetRankingsCount} registros (OK)`);
    }

    // 3. VALIDAR USER_RANKINGS
    console.log('\n📊 Validando user_rankings...');
    const [sourceUserRankings, targetUserRankings] = await Promise.all([
      sourceSupabase.from('user_rankings').select('count', { count: 'exact', head: true }),
      targetSupabase.from('user_rankings').select('count', { count: 'exact', head: true })
    ]);

    const sourceUserRankingsCount = sourceUserRankings.data || 0;
    const targetUserRankingsCount = targetUserRankings.data || 0;
    result.stats.source.user_rankings = sourceUserRankingsCount;
    result.stats.target.user_rankings = targetUserRankingsCount;

    if (sourceUserRankingsCount !== targetUserRankingsCount) {
      result.errors.push(`user_rankings: Contagem diferente (origem: ${sourceUserRankingsCount}, destino: ${targetUserRankingsCount})`);
      result.isValid = false;
    } else {
      console.log(`✅ user_rankings: ${targetUserRankingsCount} registros (OK)`);
    }

    // 4. VALIDAR USER_ANSWERS
    console.log('\n📊 Validando user_answers...');
    const [sourceUserAnswers, targetUserAnswers] = await Promise.all([
      sourceSupabase.from('user_answers').select('count', { count: 'exact', head: true }),
      targetSupabase.from('user_answers').select('count', { count: 'exact', head: true })
    ]);

    const sourceUserAnswersCount = sourceUserAnswers.data || 0;
    const targetUserAnswersCount = targetUserAnswers.data || 0;
    result.stats.source.user_answers = sourceUserAnswersCount;
    result.stats.target.user_answers = targetUserAnswersCount;

    if (sourceUserAnswersCount !== targetUserAnswersCount) {
      result.errors.push(`user_answers: Contagem diferente (origem: ${sourceUserAnswersCount}, destino: ${targetUserAnswersCount})`);
      result.isValid = false;
    } else {
      console.log(`✅ user_answers: ${targetUserAnswersCount} registros (OK)`);
    }

    // 5. VALIDAR RANKING_ANSWERS (transformado de official_answer_weights)
    console.log('\n📊 Validando ranking_answers...');
    const [sourceAnswerWeights, targetRankingAnswers] = await Promise.all([
      sourceSupabase.from('official_answer_weights').select('count', { count: 'exact', head: true }),
      targetSupabase.from('ranking_answers').select('count', { count: 'exact', head: true })
    ]);

    const sourceAnswerWeightsCount = sourceAnswerWeights.data || 0;
    const targetRankingAnswersCount = targetRankingAnswers.data || 0;
    result.stats.source.official_answer_weights = sourceAnswerWeightsCount;
    result.stats.target.ranking_answers = targetRankingAnswersCount;

    // Para ranking_answers, não esperamos a mesma contagem pois é uma transformação
    if (targetRankingAnswersCount === 0 && sourceAnswerWeightsCount > 0) {
      result.warnings.push(`ranking_answers: Nenhum registro migrado de ${sourceAnswerWeightsCount} official_answer_weights`);
    } else {
      console.log(`✅ ranking_answers: ${targetRankingAnswersCount} registros migrados`);
    }

    // 6. VALIDAR RANKING_DISCIPLINES
    console.log('\n📊 Validando ranking_disciplines...');
    const targetRankingDisciplines = await targetSupabase
      .from('ranking_disciplines')
      .select('count', { count: 'exact', head: true });

    const targetRankingDisciplinesCount = targetRankingDisciplines.data || 0;
    result.stats.target.ranking_disciplines = targetRankingDisciplinesCount;

    console.log(`✅ ranking_disciplines: ${targetRankingDisciplinesCount} registros migrados`);

    // 7. VALIDAR INTEGRIDADE REFERENCIAL
    console.log('\n📊 Validando integridade referencial...');
    
    // Verificar se user_rankings referenciam rankings válidos
    const { data: orphanUserRankings } = await targetSupabase
      .from('user_rankings')
      .select('id, ranking_id')
      .not('ranking_id', 'in', `(SELECT id FROM rankings)`);

    if (orphanUserRankings && orphanUserRankings.length > 0) {
      result.errors.push(`user_rankings: ${orphanUserRankings.length} registros órfãos (referenciam rankings inexistentes)`);
      result.isValid = false;
    }

    // Verificar se user_answers referenciam rankings válidos
    const { data: orphanUserAnswers } = await targetSupabase
      .from('user_answers')
      .select('id, ranking_id')
      .not('ranking_id', 'in', `(SELECT id FROM rankings)`);

    if (orphanUserAnswers && orphanUserAnswers.length > 0) {
      result.errors.push(`user_answers: ${orphanUserAnswers.length} registros órfãos (referenciam rankings inexistentes)`);
      result.isValid = false;
    }

    // 8. TESTAR QUERIES PRINCIPAIS
    console.log('\n📊 Testando queries principais...');
    
    // Teste 1: Buscar rankings com participantes
    const { data: rankingsWithParticipants, error: rankingsError } = await targetSupabase
      .from('rankings')
      .select(`
        id,
        titulo,
        total_participants,
        user_rankings(count)
      `)
      .limit(5);

    if (rankingsError) {
      result.warnings.push(`Query de rankings com participantes falhou: ${rankingsError.message}`);
    } else {
      console.log(`✅ Query de rankings com participantes: OK (${rankingsWithParticipants?.length || 0} resultados)`);
    }

    // Teste 2: Buscar ranking por ID
    if (rankingsWithParticipants && rankingsWithParticipants.length > 0) {
      const firstRankingId = rankingsWithParticipants[0].id;
      const { data: rankingDetails, error: rankingDetailsError } = await targetSupabase
        .from('rankings')
        .select(`
          *,
          user_rankings(*),
          ranking_answers(*),
          ranking_disciplines(*)
        `)
        .eq('id', firstRankingId)
        .single();

      if (rankingDetailsError) {
        result.warnings.push(`Query de detalhes do ranking falhou: ${rankingDetailsError.message}`);
      } else {
        console.log(`✅ Query de detalhes do ranking: OK`);
      }
    }

    // RESUMO FINAL
    console.log('\n🎉 Validação concluída!');
    console.log('='.repeat(60));
    console.log(`✅ Status: ${result.isValid ? 'VÁLIDA' : 'INVÁLIDA'}`);
    console.log(`❌ Erros: ${result.errors.length}`);
    console.log(`⚠️ Avisos: ${result.warnings.length}`);
    console.log('='.repeat(60));

    if (result.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ AVISOS:');
      result.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    // Estatísticas detalhadas
    console.log('\n📊 ESTATÍSTICAS DETALHADAS:');
    console.log('Origem (banco original):');
    Object.entries(result.stats.source).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} registros`);
    });
    
    console.log('\nDestino (banco nomeia-ai):');
    Object.entries(result.stats.target).forEach(([table, count]) => {
      console.log(`  ${table}: ${count} registros`);
    });

    return result;

  } catch (error) {
    console.error('❌ Erro inesperado durante validação:', error);
    result.isValid = false;
    result.errors.push(`Erro inesperado: ${error}`);
    return result;
  }
}

// Executar validação
validateMigration().catch(console.error);

