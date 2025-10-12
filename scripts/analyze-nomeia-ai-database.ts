import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeNomeiaAiDatabase() {
  console.log('🔍 ANÁLISE REAL DO BANCO NOMEIA-AI');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar tabelas que existem realmente
    console.log('\n📋 TABELAS EXISTENTES NO BANCO NOMEIA-AI:');
    console.log('=' .repeat(60));

    const tablesToCheck = [
      // Tabelas do plano original (6 tabelas)
      'rankings',
      'user_rankings', 
      'user_answers',
      'ranking_answers',
      'ranking_disciplines',
      'users_profiles',
      
      // Tabelas híbridas (não deveriam existir)
      'create_ranking_new',
      'user_ranking_new',
      
      // Tabelas antigas (deveriam ter sido removidas)
      'concursos',
      'official_answer_weights',
      'consolidated_answers_by_concurso',
      'exam_booklets',
      
      // Tabelas particionadas (não eram necessárias)
      'user_rankings_partitioned',
      'user_answers_partitioned',
      
      // Tabelas auxiliares (não planejadas)
      'ranking_statistics',
      'performance_metrics'
    ];

    const existingTables = [];
    const nonExistingTables = [];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          nonExistingTables.push(table);
        } else {
          existingTables.push({
            name: table,
            recordCount: data?.length || 0,
            columns: data && data.length > 0 ? Object.keys(data[0]) : []
          });
        }
      } catch (err) {
        nonExistingTables.push(table);
      }
    }

    // Mostrar tabelas existentes
    console.log('\n✅ TABELAS EXISTENTES:');
    existingTables.forEach(table => {
      console.log(`  📊 ${table.name}: ${table.recordCount} registros`);
      if (table.columns.length > 0) {
        console.log(`     Colunas: ${table.columns.join(', ')}`);
      }
    });

    // Mostrar tabelas não existentes
    console.log('\n❌ TABELAS NÃO EXISTENTES:');
    nonExistingTables.forEach(table => {
      console.log(`  ❌ ${table.name}`);
    });

    // 2. Análise crítica por categoria
    console.log('\n🔍 ANÁLISE CRÍTICA POR CATEGORIA:');
    console.log('=' .repeat(60));

    // Tabelas do plano original
    const plannedTables = ['rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines', 'users_profiles'];
    const existingPlannedTables = existingTables.filter(t => plannedTables.includes(t.name));
    
    console.log('\n📋 TABELAS DO PLANO ORIGINAL (6 tabelas):');
    if (existingPlannedTables.length === 6) {
      console.log('✅ TODAS as 6 tabelas planejadas existem');
    } else {
      console.log(`⚠️  Apenas ${existingPlannedTables.length}/6 tabelas planejadas existem`);
      const missing = plannedTables.filter(t => !existingPlannedTables.some(et => et.name === t));
      console.log(`❌ Faltam: ${missing.join(', ')}`);
    }

    // Tabelas híbridas (não deveriam existir)
    const hybridTables = ['create_ranking_new', 'user_ranking_new'];
    const existingHybridTables = existingTables.filter(t => hybridTables.includes(t.name));
    
    console.log('\n🔀 TABELAS HÍBRIDAS (não deveriam existir):');
    if (existingHybridTables.length === 0) {
      console.log('✅ Nenhuma tabela híbrida encontrada (correto)');
    } else {
      console.log(`❌ ${existingHybridTables.length} tabelas híbridas encontradas:`);
      existingHybridTables.forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.recordCount} registros`);
      });
    }

    // Tabelas antigas (deveriam ter sido removidas)
    const oldTables = ['concursos', 'official_answer_weights', 'consolidated_answers_by_concurso', 'exam_booklets'];
    const existingOldTables = existingTables.filter(t => oldTables.includes(t.name));
    
    console.log('\n🗑️  TABELAS ANTIGAS (deveriam ter sido removidas):');
    if (existingOldTables.length === 0) {
      console.log('✅ Nenhuma tabela antiga encontrada (correto)');
    } else {
      console.log(`❌ ${existingOldTables.length} tabelas antigas encontradas:`);
      existingOldTables.forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.recordCount} registros`);
      });
    }

    // Tabelas particionadas (não eram necessárias)
    const partitionedTables = ['user_rankings_partitioned', 'user_answers_partitioned'];
    const existingPartitionedTables = existingTables.filter(t => partitionedTables.includes(t.name));
    
    console.log('\n📊 TABELAS PARTICIONADAS (não eram necessárias):');
    if (existingPartitionedTables.length === 0) {
      console.log('✅ Nenhuma tabela particionada encontrada (correto)');
    } else {
      console.log(`❌ ${existingPartitionedTables.length} tabelas particionadas encontradas:`);
      existingPartitionedTables.forEach(t => {
        console.log(`  ❌ ${t.name}: ${t.recordCount} registros`);
      });
    }

    // Tabelas auxiliares (não planejadas)
    const auxiliaryTables = ['ranking_statistics', 'performance_metrics'];
    const existingAuxiliaryTables = existingTables.filter(t => auxiliaryTables.includes(t.name));
    
    console.log('\n🔧 TABELAS AUXILIARES (não planejadas):');
    if (existingAuxiliaryTables.length === 0) {
      console.log('✅ Nenhuma tabela auxiliar encontrada (correto)');
    } else {
      console.log(`⚠️  ${existingAuxiliaryTables.length} tabelas auxiliares encontradas:`);
      existingAuxiliaryTables.forEach(t => {
        console.log(`  ⚠️  ${t.name}: ${t.recordCount} registros`);
      });
    }

    // 3. Análise detalhada das tabelas principais
    console.log('\n🔍 ANÁLISE DETALHADA DAS TABELAS PRINCIPAIS:');
    console.log('=' .repeat(60));

    for (const table of existingPlannedTables) {
      console.log(`\n📊 TABELA: ${table.name.toUpperCase()}`);
      console.log(`   Registros: ${table.recordCount}`);
      console.log(`   Colunas: ${table.columns.join(', ')}`);
      
      // Verificar se tem dados
      if (table.recordCount > 0) {
        console.log(`   Status: ✅ Com dados`);
      } else {
        console.log(`   Status: ⚠️  Vazia`);
      }
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('=' .repeat(60));
    console.log(`✅ Tabelas corretas: ${existingPlannedTables.length}/6`);
    console.log(`❌ Tabelas híbridas: ${existingHybridTables.length}`);
    console.log(`❌ Tabelas antigas: ${existingOldTables.length}`);
    console.log(`❌ Tabelas particionadas: ${existingPartitionedTables.length}`);
    console.log(`⚠️  Tabelas auxiliares: ${existingAuxiliaryTables.length}`);

    const totalProblems = existingHybridTables.length + existingOldTables.length + existingPartitionedTables.length;
    if (totalProblems === 0) {
      console.log('\n🎉 BANCO ESTÁ CORRETO! Apenas as 6 tabelas planejadas existem.');
    } else {
      console.log(`\n⚠️  BANCO TEM ${totalProblems} PROBLEMAS que precisam ser corrigidos.`);
    }

    // 5. Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('=' .repeat(60));
    
    if (existingHybridTables.length > 0) {
      console.log('🔧 Remover tabelas híbridas desnecessárias');
    }
    
    if (existingOldTables.length > 0) {
      console.log('🗑️  Remover tabelas antigas não migradas');
    }
    
    if (existingPartitionedTables.length > 0) {
      console.log('📊 Remover tabelas particionadas desnecessárias');
    }
    
    if (existingAuxiliaryTables.length > 0) {
      console.log('🔧 Avaliar necessidade das tabelas auxiliares');
    }

    if (totalProblems === 0) {
      console.log('✅ Banco está limpo e seguindo o plano original!');
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeNomeiaAiDatabase();

