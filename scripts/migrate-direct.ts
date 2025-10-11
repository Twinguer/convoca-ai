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

async function migrateData() {
  console.log('🚀 Iniciando migração para banco nomeia-ai...');
  console.log('📊 Fonte:', originalUrl);
  console.log('📊 Destino:', nomeiaUrl);
  
  let totalMigrated = 0;
  let totalErrors = 0;
  
  try {
    // 1. Migrar usuários
    console.log('\n📊 Migrando usuários...');
    const { data: users, error: usersError } = await sourceSupabase
      .from('users_profiles')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      totalErrors++;
    } else if (users && users.length > 0) {
      const { error: insertUsersError } = await targetSupabase
        .from('users_profiles')
        .upsert(users, { onConflict: 'id' });
      
      if (insertUsersError) {
        console.error('❌ Erro ao inserir usuários:', insertUsersError.message);
        totalErrors++;
      } else {
        console.log(`✅ ${users.length} usuários migrados`);
        totalMigrated += users.length;
      }
    } else {
      console.log('ℹ️ Nenhum usuário encontrado');
    }

    // 2. Migrar concursos
    console.log('\n📊 Migrando concursos...');
    const { data: concursos, error: concursosError } = await sourceSupabase
      .from('concursos')
      .select('*');
    
    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError.message);
      totalErrors++;
    } else if (concursos && concursos.length > 0) {
      const { error: insertConcursosError } = await targetSupabase
        .from('concursos')
        .upsert(concursos, { onConflict: 'id' });
      
      if (insertConcursosError) {
        console.error('❌ Erro ao inserir concursos:', insertConcursosError.message);
        totalErrors++;
      } else {
        console.log(`✅ ${concursos.length} concursos migrados`);
        totalMigrated += concursos.length;
      }
    } else {
      console.log('ℹ️ Nenhum concurso encontrado');
    }

    // 3. Migrar rankings
    console.log('\n📊 Migrando rankings...');
    const { data: rankings, error: rankingsError } = await sourceSupabase
      .from('user_rankings')
      .select('*');
    
    if (rankingsError) {
      console.error('❌ Erro ao buscar rankings:', rankingsError.message);
      totalErrors++;
    } else if (rankings && rankings.length > 0) {
      const { error: insertRankingsError } = await targetSupabase
        .from('user_rankings')
        .upsert(rankings, { onConflict: 'id' });
      
      if (insertRankingsError) {
        console.error('❌ Erro ao inserir rankings:', insertRankingsError.message);
        totalErrors++;
      } else {
        console.log(`✅ ${rankings.length} rankings migrados`);
        totalMigrated += rankings.length;
      }
    } else {
      console.log('ℹ️ Nenhum ranking encontrado');
    }

    // 4. Migrar respostas
    console.log('\n📊 Migrando respostas...');
    const { data: answers, error: answersError } = await sourceSupabase
      .from('user_answers')
      .select('*');
    
    if (answersError) {
      console.error('❌ Erro ao buscar respostas:', answersError.message);
      totalErrors++;
    } else if (answers && answers.length > 0) {
      const { error: insertAnswersError } = await targetSupabase
        .from('user_answers')
        .upsert(answers, { onConflict: 'id' });
      
      if (insertAnswersError) {
        console.error('❌ Erro ao inserir respostas:', insertAnswersError.message);
        totalErrors++;
      } else {
        console.log(`✅ ${answers.length} respostas migradas`);
        totalMigrated += answers.length;
      }
    } else {
      console.log('ℹ️ Nenhuma resposta encontrada');
    }

    // 5. Migrar gabaritos oficiais
    console.log('\n📊 Migrando gabaritos oficiais...');
    const { data: answerKeys, error: answerKeysError } = await sourceSupabase
      .from('official_answer_weights')
      .select('*');
    
    if (answerKeysError) {
      console.error('❌ Erro ao buscar gabaritos:', answerKeysError.message);
      totalErrors++;
    } else if (answerKeys && answerKeys.length > 0) {
      const { error: insertAnswerKeysError } = await targetSupabase
        .from('official_answer_weights')
        .upsert(answerKeys, { onConflict: 'id' });
      
      if (insertAnswerKeysError) {
        console.error('❌ Erro ao inserir gabaritos:', insertAnswerKeysError.message);
        totalErrors++;
      } else {
        console.log(`✅ ${answerKeys.length} gabaritos migrados`);
        totalMigrated += answerKeys.length;
      }
    } else {
      console.log('ℹ️ Nenhum gabarito encontrado');
    }

    // Resumo final
    console.log('\n🎉 Migração concluída!');
    console.log(`📊 Total de registros migrados: ${totalMigrated}`);
    console.log(`❌ Total de erros: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('✅ Migração realizada com sucesso!');
    } else {
      console.log('⚠️ Migração concluída com alguns erros. Verifique os logs acima.');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado durante migração:', error);
    totalErrors++;
  }
}

// Executar migração
migrateData().catch(console.error);
