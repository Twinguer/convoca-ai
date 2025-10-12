import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConcursosStructure() {
  console.log('🔍 Verificando estrutura da tabela concursos...\n');

  try {
    // 1. Verificar se a tabela existe e suas colunas
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'concursos' });

    if (tableError) {
      console.log('❌ Erro ao obter informações da tabela:', tableError);
      
      // Tentar uma consulta simples para ver se a tabela existe
      const { data: simpleData, error: simpleError } = await supabase
        .from('concursos')
        .select('*')
        .limit(1);

      if (simpleError) {
        console.log('❌ Tabela concursos não existe ou não é acessível:', simpleError);
        return;
      } else {
        console.log('✅ Tabela concursos existe, mas não conseguimos obter estrutura detalhada');
        console.log('Colunas disponíveis:', Object.keys(simpleData[0] || {}));
      }
    } else {
      console.log('✅ Estrutura da tabela concursos:');
      tableInfo.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 2. Tentar buscar dados específicos
    console.log('\n2. Testando busca de dados específicos...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo')
      .limit(3);

    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError);
    } else {
      console.log(`✅ Encontrados ${concursos?.length || 0} concursos`);
      concursos?.forEach(concurso => {
        console.log(`   - ${concurso.titulo} (${concurso.id})`);
      });
    }

    // 3. Testar busca de colunas JSONB específicas
    console.log('\n3. Testando colunas JSONB...');
    
    const { data: jsonbData, error: jsonbError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets, official_answers, disciplines')
      .limit(1);

    if (jsonbError) {
      console.error('❌ Erro ao buscar colunas JSONB:', jsonbError);
    } else {
      console.log('✅ Colunas JSONB acessíveis:');
      const sample = jsonbData?.[0];
      if (sample) {
        console.log(`   - exam_booklets: ${sample.exam_booklets ? 'presente' : 'ausente'}`);
        console.log(`   - official_answers: ${sample.official_answers ? 'presente' : 'ausente'}`);
        console.log(`   - disciplines: ${sample.disciplines ? 'presente' : 'ausente'}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

checkConcursosStructure();