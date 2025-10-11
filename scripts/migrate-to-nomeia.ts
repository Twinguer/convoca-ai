import { createClient } from '@supabase/supabase-js';
import { databaseConfig } from '../src/config/database';

// Clientes para ambos os bancos
const sourceSupabase = createClient(
  databaseConfig.production.url,
  databaseConfig.production.serviceRoleKey
);

const targetSupabase = createClient(
  databaseConfig.development.url,
  databaseConfig.development.serviceRoleKey
);

async function migrateData() {
  console.log('🚀 Iniciando migração para banco nomeia-ai...');
  
  try {
    // 1. Migrar usuários
    console.log('📊 Migrando usuários...');
    const { data: users, error: usersError } = await sourceSupabase
      .from('users_profiles')
      .select('*');
    
    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      const { error: insertUsersError } = await targetSupabase
        .from('users_profiles')
        .upsert(users, { onConflict: 'id' });
      
      if (insertUsersError) throw insertUsersError;
      console.log(`✅ ${users.length} usuários migrados`);
    }

    // 2. Migrar concursos
    console.log('📊 Migrando concursos...');
    const { data: concursos, error: concursosError } = await sourceSupabase
      .from('concursos')
      .select('*');
    
    if (concursosError) throw concursosError;
    
    if (concursos && concursos.length > 0) {
      const { error: insertConcursosError } = await targetSupabase
        .from('concursos')
        .upsert(concursos, { onConflict: 'id' });
      
      if (insertConcursosError) throw insertConcursosError;
      console.log(`✅ ${concursos.length} concursos migrados`);
    }

    // 3. Migrar rankings
    console.log('📊 Migrando rankings...');
    const { data: rankings, error: rankingsError } = await sourceSupabase
      .from('user_rankings')
      .select('*');
    
    if (rankingsError) throw rankingsError;
    
    if (rankings && rankings.length > 0) {
      const { error: insertRankingsError } = await targetSupabase
        .from('user_rankings')
        .upsert(rankings, { onConflict: 'id' });
      
      if (insertRankingsError) throw insertRankingsError;
      console.log(`✅ ${rankings.length} rankings migrados`);
    }

    // 4. Migrar respostas
    console.log('📊 Migrando respostas...');
    const { data: answers, error: answersError } = await sourceSupabase
      .from('user_answers')
      .select('*');
    
    if (answersError) throw answersError;
    
    if (answers && answers.length > 0) {
      const { error: insertAnswersError } = await targetSupabase
        .from('user_answers')
        .upsert(answers, { onConflict: 'id' });
      
      if (insertAnswersError) throw insertAnswersError;
      console.log(`✅ ${answers.length} respostas migradas`);
    }

    // 5. Migrar gabaritos oficiais
    console.log('📊 Migrando gabaritos oficiais...');
    const { data: answerKeys, error: answerKeysError } = await sourceSupabase
      .from('official_answer_weights')
      .select('*');
    
    if (answerKeysError) throw answerKeysError;
    
    if (answerKeys && answerKeys.length > 0) {
      const { error: insertAnswerKeysError } = await targetSupabase
        .from('official_answer_weights')
        .upsert(answerKeys, { onConflict: 'id' });
      
      if (insertAnswerKeysError) throw insertAnswerKeysError;
      console.log(`✅ ${answerKeys.length} gabaritos migrados`);
    }

    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  }
}

// Executar migração
if (import.meta.main) {
  migrateData().catch(console.error);
}

export { migrateData };
