import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar banco original (produção)
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4MDAsImV4cCI6MjA1MjE1MDgwMH0.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(originalUrl, originalAnonKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function checkOriginalDatabase() {
  console.log(`🔍 Verificando no banco original: ${RANKING_ID}`);

  try {
    // Verificar na tabela concursos (banco original)
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, titulo, status, created_at')
      .eq('id', RANKING_ID)
      .single();

    if (concursoError) {
      console.log('❌ Concurso não encontrado no banco original:', concursoError.message);
    } else {
      console.log('✅ Concurso encontrado no banco original:', concurso);
    }

    // Verificar na tabela rankings (banco original)
    const { data: ranking, error: rankingError } = await supabase
      .from('rankings')
      .select('id, titulo, status, created_at')
      .eq('id', RANKING_ID)
      .single();

    if (rankingError) {
      console.log('❌ Ranking não encontrado no banco original:', rankingError.message);
    } else {
      console.log('✅ Ranking encontrado no banco original:', ranking);
    }

    // Listar alguns concursos do banco original
    console.log('\n📋 Alguns concursos do banco original:');
    const { data: allConcursos, error: allError } = await supabase
      .from('concursos')
      .select('id, titulo, status')
      .order('created_at', { ascending: false })
      .limit(5);

    if (allError) {
      console.log('❌ Erro ao listar concursos:', allError.message);
    } else {
      allConcursos?.forEach(c => console.log(`  - ${c.id}: ${c.titulo} (${c.status})`));
    }

  } catch (error) {
    console.log('❌ Erro:', error);
  }
}

if (import.meta.main) {
  checkOriginalDatabase().catch(console.error);
}



