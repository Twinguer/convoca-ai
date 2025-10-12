import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRankingCreation() {
  console.log('🔍 Debugando criação de ranking...\n');

  try {
    // 1. Verificar o ranking criado
    const { data: rankingData, error: rankingError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', 'e2d7fa3e-0cbf-4c65-a171-a89cf64ac7ca')
      .single();

    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }

    console.log('✅ Ranking encontrado:');
    console.log(`   - ID: ${rankingData.id}`);
    console.log(`   - Título: ${rankingData.titulo}`);
    console.log(`   - Status: ${rankingData.status}`);
    console.log(`   - Tipo: ${rankingData.exam_type}`);

    // 2. Verificar dados JSONB
    console.log('\n📊 Dados JSONB:');
    console.log(`   - Disciplinas: ${JSON.stringify(rankingData.disciplines)}`);
    console.log(`   - Cadernos: ${JSON.stringify(rankingData.exam_booklets)}`);
    console.log(`   - Gabarito: ${JSON.stringify(rankingData.official_answers)}`);
    console.log(`   - Subjects: ${JSON.stringify(rankingData.subjects)}`);
    console.log(`   - Form Config: ${JSON.stringify(rankingData.form_config)}`);
    console.log(`   - Metadata: ${JSON.stringify(rankingData.metadata)}`);

    // 3. Verificar se há cadernos
    if (rankingData.exam_booklets && Array.isArray(rankingData.exam_booklets)) {
      console.log(`\n📚 Cadernos encontrados: ${rankingData.exam_booklets.length}`);
      rankingData.exam_booklets.forEach((booklet: any, index: number) => {
        console.log(`   ${index + 1}. ${booklet.name || booklet.id} (${booklet.id})`);
      });
    } else {
      console.log('\n❌ Nenhum caderno encontrado');
    }

    // 4. Verificar se há gabarito oficial
    if (rankingData.official_answers && Object.keys(rankingData.official_answers).length > 0) {
      console.log(`\n📝 Gabarito oficial encontrado para ${Object.keys(rankingData.official_answers).length} caderno(s)`);
      Object.keys(rankingData.official_answers).forEach(bookletId => {
        const answers = rankingData.official_answers[bookletId];
        console.log(`   - Caderno ${bookletId}: ${Object.keys(answers.questions || {}).length} questões`);
      });
    } else {
      console.log('\n❌ Nenhum gabarito oficial encontrado');
    }

    // 5. Verificar se há disciplinas
    if (rankingData.disciplines && Array.isArray(rankingData.disciplines) && rankingData.disciplines.length > 0) {
      console.log(`\n📚 Disciplinas encontradas: ${rankingData.disciplines.length}`);
      rankingData.disciplines.forEach((discipline: any, index: number) => {
        console.log(`   ${index + 1}. ${discipline.name || discipline.id} (${discipline.questionCount || 0} questões)`);
      });
    } else {
      console.log('\n❌ Nenhuma disciplina encontrada');
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugRankingCreation();

