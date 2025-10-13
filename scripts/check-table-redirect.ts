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

async function checkTableRedirect() {
  console.log('🔍 VERIFICANDO REDIRECIONAMENTO DE TABELAS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se concursos existe como tabela
    console.log('1️⃣ Verificando se concursos existe como tabela...');
    const { data: concursosTable, error: concursosError } = await supabase
      .from('concursos')
      .select('id')
      .limit(1);

    if (concursosError) {
      console.log('❌ Erro ao acessar concursos:', concursosError);
    } else {
      console.log('✅ Concursos acessível como tabela');
    }

    // 2. Verificar se rankings existe como tabela
    console.log('\n2️⃣ Verificando se rankings existe como tabela...');
    const { data: rankingsTable, error: rankingsError } = await supabase
      .from('rankings')
      .select('id')
      .limit(1);

    if (rankingsError) {
      console.log('❌ Erro ao acessar rankings:', rankingsError);
    } else {
      console.log('✅ Rankings acessível como tabela');
    }

    // 3. Tentar inserção em concursos com status válido para rankings
    console.log('\n3️⃣ Tentando inserção em concursos com status válido...');
    const { data: insertData, error: insertError } = await supabase
      .from('concursos')
      .insert({
        titulo: 'TESTE REDIRECT',
        orgao: 'TESTE ORGÃO',
        banca: 'TESTE BANCA',
        status: 'Ativo'  // Status válido para rankings
      })
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Dados inseridos:', insertData);
    }

    // 4. Verificar se a inserção foi para rankings ou concursos
    console.log('\n4️⃣ Verificando onde foi inserido...');
    const { data: checkData, error: checkError } = await supabase
      .from('rankings')
      .select('*')
      .eq('titulo', 'TESTE REDIRECT');

    if (checkError) {
      console.log('❌ Erro ao verificar em rankings:', checkError);
    } else {
      console.log('📊 Encontrado em rankings:', checkData);
    }

    const { data: checkData2, error: checkError2 } = await supabase
      .from('concursos')
      .select('*')
      .eq('titulo', 'TESTE REDIRECT');

    if (checkError2) {
      console.log('❌ Erro ao verificar em concursos:', checkError2);
    } else {
      console.log('📊 Encontrado em concursos:', checkData2);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTableRedirect();



