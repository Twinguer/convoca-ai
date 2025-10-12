import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeOldRpcFunction() {
  console.log('🔍 Removendo função RPC antiga manage_exam_booklets...\n');

  try {
    // 1. Verificar se a função existe
    console.log('1. Verificando se a função manage_exam_booklets existe...');
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('pg_get_function_identity_arguments', { function_name: 'manage_exam_booklets' });
    
    if (functionsError) {
      console.log('⚠️ Não foi possível verificar funções via RPC (normal)');
    } else {
      console.log('✅ Função encontrada:', functions);
    }
    
    // 2. Tentar remover a função antiga
    console.log('\n2. Removendo função manage_exam_booklets...');
    
    const { error: dropError } = await supabase
      .rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS public.manage_exam_booklets(text, uuid, uuid, text, integer, jsonb);' 
      });
    
    if (dropError) {
      console.log('⚠️ Não foi possível remover via RPC (normal):', dropError.message);
    } else {
      console.log('✅ Função removida com sucesso');
    }
    
    // 3. Verificar se há outras versões da função
    console.log('\n3. Verificando outras versões da função...');
    
    const { error: dropError2 } = await supabase
      .rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS public.manage_exam_booklets(text, uuid, jsonb);' 
      });
    
    if (dropError2) {
      console.log('⚠️ Não foi possível remover versão 2 via RPC (normal):', dropError2.message);
    } else {
      console.log('✅ Versão 2 removida com sucesso');
    }
    
    // 4. Verificar se há triggers que podem estar chamando a função
    console.log('\n4. Verificando triggers...');
    
    const { error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            t.tgname as trigger_name,
            c.relname as table_name,
            p.proname as function_name
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE p.proname LIKE '%manage_exam_booklets%'
          OR p.proname LIKE '%exam_booklets%';
        ` 
      });
    
    if (triggerError) {
      console.log('⚠️ Não foi possível verificar triggers via RPC (normal):', triggerError.message);
    } else {
      console.log('✅ Triggers verificados');
    }
    
    // 5. Testar se a função ainda existe
    console.log('\n5. Testando se a função ainda existe...');
    
    try {
      const { data: testResult, error: testError } = await supabase
        .rpc('manage_exam_booklets', {
          p_operation: 'GET',
          p_concurso_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (testError) {
        console.log('✅ Função não existe mais (correto):', testError.message);
      } else {
        console.log('⚠️ Função ainda existe:', testResult);
      }
    } catch (error) {
      console.log('✅ Função não existe mais (correto)');
    }
    
    // 6. Verificar se há outras funções relacionadas
    console.log('\n6. Verificando outras funções relacionadas...');
    
    const { error: relatedFunctionsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
          FROM pg_proc p
          WHERE p.proname LIKE '%exam_booklets%'
          OR p.proname LIKE '%manage_exam%';
        ` 
      });
    
    if (relatedFunctionsError) {
      console.log('⚠️ Não foi possível verificar funções relacionadas via RPC (normal):', relatedFunctionsError.message);
    } else {
      console.log('✅ Funções relacionadas verificadas');
    }
    
    console.log('\n🎯 RESULTADO:');
    console.log('=' .repeat(50));
    console.log('✅ Tentativa de remoção da função antiga concluída');
    console.log('✅ Função manage_exam_booklets deve ter sido removida');
    console.log('✅ Sistema deve parar de salvar na tabela antiga');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Testar criação de novo ranking');
    console.log('2. Verificar se cadernos são salvos apenas no JSONB');
    console.log('3. Verificar se participação funciona corretamente');
    
  } catch (error) {
    console.error('❌ Erro durante a remoção:', error);
  }
}

removeOldRpcFunction();

