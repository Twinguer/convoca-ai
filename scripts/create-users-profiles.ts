import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function createUsersProfiles() {
  console.log('🔧 Criando tabela users_profiles...');
  
  try {
    // 1. Tentar acessar a tabela para ver se existe
    console.log('📊 Verificando se users_profiles existe...');
    const { data, error } = await supabase
      .from('users_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Tabela users_profiles não existe ou não está acessível');
      console.log('🔧 Criando tabela users_profiles...');
      
      // Criar tabela usando SQL direto
      const createTableSQL = `
        -- Criar tabela users_profiles
        CREATE TABLE IF NOT EXISTS users_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Políticas de segurança
        CREATE POLICY "users_profiles_public_read" ON users_profiles 
          FOR SELECT USING (true);
        
        CREATE POLICY "users_profiles_own_data" ON users_profiles 
          FOR ALL USING (auth.uid() = id);
        
        -- Trigger para updated_at
        CREATE TRIGGER update_users_profiles_updated_at
          BEFORE UPDATE ON users_profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;
      
      console.log('📝 SQL para criar tabela:');
      console.log(createTableSQL);
      console.log('\n⚠️ Execute este SQL no Supabase SQL Editor do projeto nomeia-ai');
      console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
      
    } else {
      console.log('✅ Tabela users_profiles já existe');
      console.log(`📊 Registros na tabela: ${data || 0}`);
    }
    
    // 2. Testar inserção após criação
    console.log('\n🧪 Testando inserção de dados...');
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Usuário Teste',
      avatar_url: null
    };
    
    const { error: insertError } = await supabase
      .from('users_profiles')
      .upsert(testUser, { onConflict: 'id' });
    
    if (insertError) {
      console.error('❌ Erro ao inserir usuário de teste:', insertError.message);
      console.log('💡 Execute o SQL acima primeiro no Supabase SQL Editor');
      return;
    }
    
    console.log('✅ Inserção de teste funcionou');
    
    // 3. Limpar dados de teste
    const { error: deleteError } = await supabase
      .from('users_profiles')
      .delete()
      .eq('id', testUser.id);
    
    if (deleteError) {
      console.error('❌ Erro ao limpar dados de teste:', deleteError.message);
      return;
    }
    
    console.log('✅ Dados de teste removidos');
    console.log('🎉 Tabela users_profiles está funcionando!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar criação
createUsersProfiles().catch(console.error);

