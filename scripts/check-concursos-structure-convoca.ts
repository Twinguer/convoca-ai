import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConcursosStructure() {
  console.log('🔍 Verificando estrutura da tabela concursos no convoca-ai...\n');

  try {
    // 1. Buscar um registro existente para ver a estrutura
    const { data: sampleData, error: sampleError } = await supabase
      .from('concursos')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Erro ao buscar dados da tabela concursos:', sampleError);
      return;
    }

    console.log('✅ Estrutura da tabela concursos:');
    const columns = Object.keys(sampleData);
    columns.forEach(column => {
      const value = sampleData[column];
      const type = typeof value;
      console.log(`   - ${column}: ${type} ${value !== null ? `(${JSON.stringify(value).substring(0, 50)}...)` : '(null)'}`);
    });

    // 2. Verificar campos específicos que podem estar causando erro
    const problematicFields = [
      'created_by',
      'subjects', 
      'form_config',
      'official_answers',
      'exam_booklets',
      'metadata',
      'total_participants'
    ];

    console.log('\n🔍 Verificando campos problemáticos:');
    problematicFields.forEach(field => {
      const exists = columns.includes(field);
      console.log(`   - ${field}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
    });

    // 3. Verificar o ranking criado
    console.log('\n🔍 Verificando ranking criado:');
    const { data: rankingData, error: rankingError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', 'e2d7fa3e-0cbf-4c65-a171-a89cf64ac7ca')
      .single();

    if (rankingError) {
      console.error('❌ Erro ao buscar ranking criado:', rankingError);
    } else {
      console.log('✅ Ranking encontrado:');
      console.log(`   - Título: ${rankingData.titulo}`);
      console.log(`   - Status: ${rankingData.status}`);
      console.log(`   - Disciplinas: ${rankingData.disciplines ? 'Presente' : 'Ausente'}`);
      console.log(`   - Cadernos: ${rankingData.exam_booklets ? 'Presente' : 'Ausente'}`);
      console.log(`   - Gabarito: ${rankingData.official_answers ? 'Presente' : 'Ausente'}`);
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

checkConcursosStructure();



