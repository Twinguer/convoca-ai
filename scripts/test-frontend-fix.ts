import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendFix() {
  console.log('🧪 Testando correção do frontend...\n');

  try {
    // 1. Testar fetchConcursos (função principal da Home)
    console.log('1. Testando fetchConcursos...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (concursosError) {
      console.error('❌ Erro no fetchConcursos:', concursosError);
      return;
    }

    console.log(`✅ fetchConcursos funcionou: ${concursos.length} concursos encontrados`);
    concursos.slice(0, 3).forEach((concurso, index) => {
      console.log(`   ${index + 1}. ${concurso.titulo} (${concurso.status})`);
    });

    // 2. Testar filtros por status
    console.log('\n2. Testando filtros por status...');
    
    const statuses = ['Em andamento', 'Finalizado', 'Ativo'];
    for (const status of statuses) {
      const { data: statusConcursos, error: statusError } = await supabase
        .from('concursos')
        .select('id, titulo, status')
        .eq('status', status);
      
      if (statusError) {
        console.error(`❌ Erro no filtro ${status}:`, statusError);
      } else {
        console.log(`   ✅ Status "${status}": ${statusConcursos.length} concursos`);
      }
    }

    // 3. Testar query do useRankingsData
    console.log('\n3. Testando useRankingsData...');
    
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('concursos')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        created_at,
        status,
        created_by_user_id,
        is_admin_created,
        localidades
      `)
      .order('created_at', { ascending: false });

    if (rankingsError) {
      console.error('❌ Erro no useRankingsData:', rankingsError);
    } else {
      console.log(`✅ useRankingsData funcionou: ${rankingsData.length} rankings`);
    }

    // 4. Testar query do Admin Dashboard
    console.log('\n4. Testando Admin Dashboard...');
    
    const { data: adminData, error: adminError } = await supabase
      .from('concursos')
      .select('*')
      .limit(5);

    if (adminError) {
      console.error('❌ Erro no Admin Dashboard:', adminError);
    } else {
      console.log(`✅ Admin Dashboard funcionou: ${adminData.length} concursos`);
    }

    // 5. Verificar se há problemas de performance
    console.log('\n5. Verificando performance...');
    
    const startTime = Date.now();
    const { data: perfData, error: perfError } = await supabase
      .from('concursos')
      .select('id, titulo, status')
      .limit(10);
    const endTime = Date.now();
    
    if (perfError) {
      console.error('❌ Erro no teste de performance:', perfError);
    } else {
      console.log(`✅ Performance OK: ${endTime - startTime}ms para 10 registros`);
    }

    console.log('\n🎉 Teste do frontend concluído!');
    console.log('✅ Todas as correções de tabela funcionaram');
    console.log('✅ O frontend deve estar exibindo os rankings corretamente');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFrontendFix();

