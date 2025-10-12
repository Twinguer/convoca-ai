import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function testParticipation() {
  console.log('🧪 Testando funcionalidade de participação...');
  
  try {
    // 1. Verificar se existe um ranking ativo
    console.log('\n📊 1. Verificando rankings disponíveis...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, status')
      .eq('status', 'Ativo')
      .limit(5);
    
    if (rankingsError) {
      console.log('❌ Erro ao buscar rankings:', rankingsError.message);
      return;
    }
    
    console.log('✅ Rankings ativos encontrados:', rankings?.length || 0);
    if (rankings && rankings.length > 0) {
      rankings.forEach(ranking => {
        console.log(`  - ${ranking.titulo} (${ranking.id})`);
      });
    }
    
    // 2. Verificar usuários disponíveis para teste
    console.log('\n👥 2. Verificando usuários disponíveis...');
    
    const { data: users, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .limit(3);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log('✅ Usuários encontrados:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
      });
    }
    
    // 3. Testar inserção de participação
    console.log('\n🎯 3. Testando inserção de participação...');
    
    if (rankings && rankings.length > 0 && users && users.length > 0) {
      const testRanking = rankings[0];
      const testUser = users[0];
      
      console.log(`📝 Testando participação: ${testUser.name} no ranking ${testRanking.titulo}`);
      
      // Verificar se o usuário já participa
      const { data: existingParticipation, error: checkError } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('ranking_id', testRanking.id)
        .eq('user_id', testUser.id)
        .maybeSingle();
      
      if (checkError) {
        console.log('❌ Erro ao verificar participação existente:', checkError.message);
        return;
      }
      
      if (existingParticipation) {
        console.log('⚠️ Usuário já participa deste ranking');
      } else {
        // Tentar inserir participação
        const { data: participationData, error: participationError } = await supabase
          .from('user_rankings')
          .insert({
            user_id: testUser.id,
            ranking_id: testRanking.id,
            score: 0,
            position: 0,
            reservation_type: 'Ampla Concorrência'
          })
          .select('id')
          .single();
        
        if (participationError) {
          console.log('❌ Erro ao inserir participação:', participationError.message);
          console.log('🔍 Detalhes do erro:', JSON.stringify(participationError, null, 2));
        } else {
          console.log('✅ Participação inserida com sucesso!');
          console.log('📊 ID da participação:', participationData.id);
        }
      }
    }
    
    // 4. Verificar participações existentes
    console.log('\n📊 4. Verificando participações existentes...');
    
    const { data: participations, error: participationsError } = await supabase
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
          name
        ),
        rankings!fk_user_rankings_ranking(
          id,
          titulo
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (participationsError) {
      console.log('❌ Erro ao buscar participações:', participationsError.message);
    } else {
      console.log('✅ Participações encontradas:', participations?.length || 0);
      if (participations && participations.length > 0) {
        participations.forEach(part => {
          console.log(`  - ${part.users_profiles?.name || 'Usuário sem nome'} no ranking ${part.rankings?.titulo || 'Ranking sem nome'}: ${part.score} pontos`);
        });
      }
    }
    
    console.log('\n🎉 Teste de participação concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testParticipation().catch(console.error);
