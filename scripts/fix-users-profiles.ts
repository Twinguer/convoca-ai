import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function fixUsersProfiles() {
  console.log('🔧 Verificando e corrigindo tabela users_profiles...');
  
  try {
    // 1. Verificar se a tabela existe
    console.log('📊 Verificando se users_profiles existe...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users_profiles');
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Tabela users_profiles existe');
      
      // Verificar estrutura da tabela
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'users_profiles')
        .order('ordinal_position');
      
      if (columnsError) {
        console.error('❌ Erro ao verificar colunas:', columnsError.message);
        return;
      }
      
      console.log('📋 Estrutura da tabela users_profiles:');
      columns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } else {
      console.log('❌ Tabela users_profiles não existe. Criando...');
      
      // Criar tabela users_profiles
      const createTableSQL = `
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
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela users_profiles:', createError.message);
        return;
      }
      
      console.log('✅ Tabela users_profiles criada com sucesso');
    }
    
    // 2. Testar inserção de dados de teste
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
    
    // 4. Verificar contagem final
    const { count, error: countError } = await supabase
      .from('users_profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao verificar contagem:', countError.message);
      return;
    }
    
    console.log(`✅ Tabela users_profiles funcionando (${count} registros)`);
    console.log('🎉 Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar correção
fixUsersProfiles().catch(console.error);



