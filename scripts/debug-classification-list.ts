import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function debugClassificationList() {
  console.log('🔍 Investigando problema de classificação...');
  
  try {
    // 1. Verificar rankings existentes
    console.log('\n📊 1. Verificando rankings existentes...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, status, total_participants')
      .order('created_at', { ascending: false });
    
    if (rankingsError) {
      console.log('❌ Erro ao buscar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings encontrados:', rankings?.length || 0);
      if (rankings && rankings.length > 0) {
        rankings.forEach(ranking => {
          console.log(`  - ${ranking.titulo} (${ranking.status}): ${ranking.total_participants} participantes`);
        });
      }
    }
    
    // 2. Verificar participações de usuários
    console.log('\n📊 2. Verificando participações de usuários...');
    
    const { data: participations, error: participationsError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        ranking_id,
        user_id,
        score,
        position,
        reservation_type,
        created_at
      `)
      .order('score', { ascending: false });
    
    if (participationsError) {
      console.log('❌ Erro ao buscar participações:', participationsError.message);
    } else {
      console.log('✅ Participações encontradas:', participations?.length || 0);
      if (participations && participations.length > 0) {
        participations.forEach(part => {
          console.log(`  - Usuário ${part.user_id}: ${part.score} pontos (posição ${part.position})`);
        });
      }
    }
    
    // 3. Verificar usuários
    console.log('\n📊 3. Verificando usuários...');
    
    const { data: users, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email})`);
        });
      }
    }
    
    // 4. Testar query de classificação
    console.log('\n📊 4. Testando query de classificação...');
    
    try {
      const { data: classificationData, error: classificationError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          ranking_id,
          user_id,
          score,
          position,
          reservation_type,
          users_profiles!fk_user_rankings_user_profile(
            id,
            name,
            email
          ),
          rankings!fk_user_rankings_ranking(
            id,
            titulo,
            status
          )
        `)
        .order('score', { ascending: false })
        .limit(10);
      
      if (classificationError) {
        console.log('❌ Erro na query de classificação:', classificationError.message);
      } else {
        console.log('✅ Query de classificação funcionou');
        console.log('📊 Registros retornados:', classificationData?.length || 0);
        if (classificationData && classificationData.length > 0) {
          console.log('📋 Classificação:');
          classificationData.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.users_profiles?.name || 'Usuário sem nome'}: ${item.score} pontos`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erro na query de classificação:', error);
    }
    
    // 5. Verificar se há dados de teste
    console.log('\n📊 5. Verificando dados de teste...');
    
    const { data: testRanking, error: testError } = await supabase
      .from('rankings')
      .select('*')
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .single();
    
    if (testError) {
      console.log('❌ Ranking de teste não encontrado:', testError.message);
    } else {
      console.log('✅ Ranking de teste encontrado:', testRanking.titulo);
      
      // Verificar participações no ranking de teste
      const { data: testParticipations, error: testPartError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          user_id,
          score,
          position,
          users_profiles!fk_user_rankings_user_profile(
            id,
            name
          )
        `)
        .eq('ranking_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .order('score', { ascending: false });
      
      if (testPartError) {
        console.log('❌ Erro ao buscar participações do teste:', testPartError.message);
      } else {
        console.log('✅ Participações no ranking de teste:', testParticipations?.length || 0);
        if (testParticipations && testParticipations.length > 0) {
          testParticipations.forEach((part, index) => {
            console.log(`  ${index + 1}. ${part.users_profiles?.name || 'Usuário sem nome'}: ${part.score} pontos`);
          });
        }
      }
    }
    
    // 6. Verificar estrutura das tabelas
    console.log('\n📊 6. Verificando estrutura das tabelas...');
    
    const tables = ['rankings', 'user_rankings', 'users_profiles'];
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log(`❌ Erro na tabela ${table}:`, tableError.message);
        } else {
          console.log(`✅ Tabela ${table} acessível (${tableData?.length || 0} registros de exemplo)`);
        }
      } catch (error) {
        console.log(`❌ Erro na tabela ${table}:`, error);
      }
    }
    
    console.log('\n🎉 Investigação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  }
}

// Executar investigação
debugClassificationList().catch(console.error);



