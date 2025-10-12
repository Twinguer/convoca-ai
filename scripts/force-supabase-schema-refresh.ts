import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceSupabaseSchemaRefresh() {
  console.log('🔄 FORÇANDO REFRESH DO SCHEMA CACHE DO SUPABASE');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se as colunas existem no banco
    console.log('1️⃣ Verificando colunas no banco de dados...');
    
    // 2. Tentar forçar refresh do cache com diferentes métodos
    console.log('\n2️⃣ Tentando forçar refresh do schema cache...');
    
    // Método 1: Fazer uma query simples para forçar refresh
    const { data: testData, error: testError } = await supabase
      .from('concursos')
      .select('id, titulo')
      .limit(1);
      
    if (testError) {
      console.log('❌ Erro na query de teste:', testError);
    } else {
      console.log('✅ Query de teste funcionou');
    }
    
    // Método 2: Tentar acessar uma coluna JSONB específica
    console.log('\n3️⃣ Tentando acessar coluna disciplines...');
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('concursos')
      .select('disciplines')
      .limit(1);
      
    if (disciplinesError) {
      console.log('❌ Erro ao acessar disciplines:', disciplinesError);
    } else {
      console.log('✅ Coluna disciplines acessível:', disciplinesData);
    }
    
    // Método 3: Tentar inserir dados mínimos com JSONB
    console.log('\n4️⃣ Tentando inserção mínima com JSONB...');
    const { data: insertData, error: insertError } = await supabase
      .from('concursos')
      .insert({
        titulo: 'TESTE SCHEMA REFRESH',
        orgao: 'TESTE ORGÃO',
        banca: 'TESTE BANCA',
        status: 'Ativo',
        disciplines: []
      })
      .select();
      
    if (insertError) {
      console.log('❌ Erro na inserção com JSONB:', insertError);
    } else {
      console.log('✅ Inserção com JSONB funcionou!');
      console.log('📊 Dados inseridos:', insertData);
    }
    
    // Método 4: Verificar estrutura da tabela
    console.log('\n5️⃣ Verificando estrutura da tabela...');
    const { data: structureData, error: structureError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'concursos' AND column_name LIKE '%disciplines%'` 
      });
      
    if (structureError) {
      console.log('❌ Erro ao verificar estrutura:', structureError);
    } else {
      console.log('📊 Estrutura encontrada:', structureData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

forceSupabaseSchemaRefresh();

