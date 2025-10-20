import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

console.log('🔍 Diagnóstico completo do frontend...');

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
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  try {
    // Teste 1: Verificar concursos
    console.log('\n📊 Teste 1: Verificando concursos...');
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, created_at, disciplines, has_cota, subjects')
      .limit(5);
    
    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError);
    } else {
      console.log('✅ Concursos encontrados:', concursos?.length || 0);
      concursos?.forEach(concurso => {
        console.log(`  - ${concurso.titulo} (${concurso.id})`);
        console.log(`    Disciplines: ${concurso.disciplines?.length || 0}`);
        console.log(`    Has Cota: ${JSON.stringify(concurso.has_cota)}`);
        console.log(`    Subjects: ${JSON.stringify(concurso.subjects)}`);
      });
    }

    // Teste 2: Verificar user_rankings
    console.log('\n📊 Teste 2: Verificando user_rankings...');
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .limit(3);
    
    if (rankingsError) {
      console.log('❌ Erro ao buscar user_rankings:', rankingsError);
    } else {
      console.log('✅ User rankings encontrados:', rankings?.length || 0);
      rankings?.forEach(ranking => {
        console.log(`  - User: ${ranking.user_id}`);
        const consolidatedData = ranking.consolidated_data;
        if (consolidatedData?.rankings) {
          const rankingKeys = Object.keys(consolidatedData.rankings);
          console.log(`    Rankings: ${rankingKeys.length} (${rankingKeys.join(', ')})`);
        }
      });
    }

    // Teste 3: Verificar users_profiles
    console.log('\n📊 Teste 3: Verificando users_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Erro ao buscar users_profiles:', profilesError);
    } else {
      console.log('✅ User profiles encontrados:', profiles?.length || 0);
      profiles?.forEach(profile => {
        console.log(`  - ${profile.name} (${profile.id})`);
      });
    }

    // Teste 4: Verificar estrutura de dados de um concurso específico
    console.log('\n📊 Teste 4: Verificando estrutura de dados...');
    if (concursos && concursos.length > 0) {
      const concurso = concursos[0];
      console.log(`Concurso: ${concurso.titulo}`);
      console.log(`ID: ${concurso.id}`);
      console.log(`Disciplines:`, concurso.disciplines);
      console.log(`Has Cota:`, concurso.has_cota);
      console.log(`Subjects:`, concurso.subjects);
    }

    // Teste 5: Verificar se há dados de ranking para o concurso
    if (concursos && concursos.length > 0) {
      const concursoId = concursos[0].id;
      console.log(`\n📊 Teste 5: Verificando rankings para concurso ${concursoId}...`);
      
      const { data: rankingsForConcurso, error: rankingsForConcursoError } = await supabase
        .from('user_rankings')
        .select('user_id, consolidated_data');
      
      if (rankingsForConcursoError) {
        console.log('❌ Erro ao buscar rankings para concurso:', rankingsForConcursoError);
      } else {
        let count = 0;
        rankingsForConcurso?.forEach(ranking => {
          const consolidatedData = ranking.consolidated_data;
          if (consolidatedData?.rankings) {
            Object.keys(consolidatedData.rankings).forEach(rankingKey => {
              const rankingData = consolidatedData.rankings[rankingKey];
              if (rankingData.concurso_id === concursoId) {
                count++;
                console.log(`  - User ${ranking.user_id} participando do concurso`);
              }
            });
          }
        });
        console.log(`✅ Total de participantes: ${count}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

runDiagnostics();

