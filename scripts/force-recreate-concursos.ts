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

async function forceRecreateConcursos() {
  console.log('🔧 FORÇANDO RECRIAÇÃO DA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se existe view concursos
    console.log('1️⃣ Verificando se existe view concursos...');
    const { data: views, error: viewsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT schemaname, viewname FROM pg_views WHERE viewname = 'concursos'` 
      });

    if (viewsError) {
      console.log('❌ Erro ao verificar views:', viewsError);
    } else {
      console.log('📊 Views encontradas:', views);
    }

    // 2. Verificar estrutura atual da tabela
    console.log('\n2️⃣ Verificando estrutura atual da tabela...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'concursos' AND table_schema = 'public' ORDER BY ordinal_position` 
      });

    if (columnsError) {
      console.log('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📊 Colunas encontradas:', columns);
    }

    // 3. Tentar forçar refresh do schema
    console.log('\n3️⃣ Tentando forçar refresh do schema...');
    const { error: refreshError } = await supabase
      .rpc('exec_sql', { 
        sql: `NOTIFY pgrst, 'reload schema'` 
      });

    if (refreshError) {
      console.log('❌ Erro ao forçar refresh:', refreshError);
    } else {
      console.log('✅ Refresh do schema executado');
    }

    // 4. Tentar inserção simples após refresh
    console.log('\n4️⃣ Tentando inserção simples após refresh...');
    const { data, error } = await supabase
      .from('concursos')
      .insert({
        titulo: 'TESTE APÓS REFRESH',
        orgao: 'TESTE ORGÃO',
        banca: 'TESTE BANCA',
        status: 'Em andamento'
      })
      .select();

    if (error) {
      console.error('❌ Erro na inserção após refresh:', error);
    } else {
      console.log('✅ Inserção bem-sucedida após refresh!');
      console.log('📊 Dados inseridos:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

forceRecreateConcursos();



