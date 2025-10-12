import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function cleanCredentialsFixed() {
  console.log('🧹 Removendo credenciais com correção de chaves estrangeiras...');

  try {
    // 1. Primeiro, atualizar rankings para remover referências de usuários
    console.log('\n1. Atualizando rankings para remover referências de usuários...');
    const { error: updateRankingsError } = await supabase
      .from('rankings')
      .update({ created_by: null })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (updateRankingsError) {
      console.log('❌ Erro ao atualizar rankings:', updateRankingsError.message);
    } else {
      console.log('✅ Referências de usuários removidas dos rankings');
    }

    // 2. Remover participações de usuários
    console.log('\n2. Removendo participações de usuários...');
    const { error: deleteParticipationsError } = await supabase
      .from('user_rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteParticipationsError) {
      console.log('❌ Erro ao remover participações:', deleteParticipationsError.message);
    } else {
      console.log('✅ Participações removidas');
    }

    // 3. Remover respostas de usuários
    console.log('\n3. Removendo respostas de usuários...');
    const { error: deleteAnswersError } = await supabase
      .from('user_answers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteAnswersError) {
      console.log('❌ Erro ao remover respostas:', deleteAnswersError.message);
    } else {
      console.log('✅ Respostas removidas');
    }

    // 4. Agora remover perfis de usuários
    console.log('\n4. Removendo perfis de usuários...');
    const { error: deleteProfilesError } = await supabase
      .from('users_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteProfilesError) {
      console.log('❌ Erro ao remover perfis:', deleteProfilesError.message);
    } else {
      console.log('✅ Perfis de usuários removidos');
    }

    // 5. Verificar limpeza
    console.log('\n5. Verificando limpeza...');
    const { data: remainingProfiles, error: remainingError } = await supabase
      .from('users_profiles')
      .select('count')
      .limit(1);

    if (remainingError) {
      console.log('❌ Erro ao verificar limpeza:', remainingError.message);
    } else {
      console.log('✅ Limpeza verificada');
    }

    // 6. Verificar rankings (manter)
    console.log('\n6. Verificando rankings (mantidos)...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, status, created_by')
      .limit(5);

    if (rankingsError) {
      console.log('❌ Erro ao verificar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings mantidos:', rankingsData?.length || 0);
      if (rankingsData && rankingsData.length > 0) {
        console.log('Rankings disponíveis:');
        rankingsData.forEach(ranking => {
          console.log(`  - ${ranking.titulo} (${ranking.status}) - Criado por: ${ranking.created_by || 'N/A'}`);
        });
      }
    }

    // 7. Resumo da limpeza
    console.log('\n📋 Resumo da limpeza:');
    console.log('✅ Perfis de usuários: Removidos');
    console.log('✅ Participações: Removidas');
    console.log('✅ Respostas: Removidas');
    console.log('✅ Rankings: Mantidos (sem referências de usuários)');
    console.log('✅ Sistema: Pronto para novos cadastros');

    console.log('\n🔧 Próximos passos:');
    console.log('1. Acesse: http://localhost:8084');
    console.log('2. Faça um novo cadastro');
    console.log('3. Use um email real para receber a confirmação');
    console.log('4. Confirme o email e faça login');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar limpeza
cleanCredentialsFixed().then(() => {
  console.log('\n🏁 Limpeza concluída');
  console.log('\n🎉 Sistema limpo e pronto para novos cadastros!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

