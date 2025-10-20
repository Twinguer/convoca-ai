import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🔍 Testando sincronização de dados...');

// Ler configuração do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

if (!urlMatch || !keyMatch) {
  console.log('❌ Erro: Não foi possível ler as configurações do .env.local');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Teste 1: Verificar concursos
console.log('\n📊 Teste 1: Verificando concursos...');
supabase.from('concursos').select('id, titulo, created_at').limit(5)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao buscar concursos:', error.message);
    } else {
      console.log('✅ Concursos encontrados:', data?.length || 0);
      data?.forEach(concurso => {
        console.log(`  - ${concurso.titulo} (${concurso.id}) - ${concurso.created_at}`);
      });
    }
  });

// Teste 2: Verificar user_rankings
console.log('\n📊 Teste 2: Verificando user_rankings...');
supabase.from('user_rankings').select('user_id').limit(5)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao buscar user_rankings:', error.message);
    } else {
      console.log('✅ User rankings encontrados:', data?.length || 0);
      data?.forEach(ranking => {
        console.log(`  - User: ${ranking.user_id}`);
      });
    }
  });

// Teste 3: Verificar se há migrações aplicadas (campos de mínimo)
console.log('\n📊 Teste 3: Verificando campos de mínimo...');
supabase.from('concursos').select('id, titulo, has_minimum_score, total_minimum_score').limit(3)
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Erro ao verificar campos de mínimo:', error.message);
    } else {
      console.log('✅ Campos de mínimo verificados:');
      data?.forEach(concurso => {
        console.log(`  - ${concurso.titulo}:`);
        console.log(`    has_minimum_score: ${concurso.has_minimum_score}`);
        console.log(`    total_minimum_score: ${concurso.total_minimum_score}`);
      });
    }
  });

console.log('\n✅ Teste de sincronização concluído!');
