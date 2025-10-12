import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no .env');
  console.error('URL:', supabaseUrl ? 'OK' : 'FALTANDO');
  console.error('KEY:', supabaseKey ? 'OK' : 'FALTANDO');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function implementHybridStructure() {
  console.log('🚀 IMPLEMENTANDO ESTRUTURA HÍBRIDA NO BANCO NOMEIA-AI');
  console.log('=' .repeat(60));

  try {
    // FASE 1: Backup das tabelas existentes
    console.log('\n📋 FASE 1: BACKUP DAS TABELAS EXISTENTES');
    console.log('=' .repeat(40));

    // Verificar tabelas existentes usando SQL direto
    console.log('🔍 Verificando tabelas existentes...');
    
    const tableChecks = [
      { name: 'concursos', query: 'SELECT COUNT(*) as count FROM concursos' },
      { name: 'user_rankings', query: 'SELECT COUNT(*) as count FROM user_rankings' },
      { name: 'official_answer_weights', query: 'SELECT COUNT(*) as count FROM official_answer_weights' },
      { name: 'exam_booklets', query: 'SELECT COUNT(*) as count FROM exam_booklets' },
      { name: 'consolidated_answers_by_concurso', query: 'SELECT COUNT(*) as count FROM consolidated_answers_by_concurso' }
    ];

    const existingTables = [];
    for (const { name, query } of tableChecks) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (!error) {
          existingTables.push(name);
          console.log(`✅ ${name}: ${data?.[0]?.count || 0} registros`);
        }
      } catch (err) {
        console.log(`⚠️  ${name}: Tabela não existe`);
      }
    }

    console.log('✅ Tabelas encontradas:', existingTables);

    // Backup das tabelas existentes
    const backupQueries = [
      'CREATE TABLE IF NOT EXISTS concursos_backup AS SELECT * FROM concursos;',
      'CREATE TABLE IF NOT EXISTS user_rankings_backup AS SELECT * FROM user_rankings;',
      'CREATE TABLE IF NOT EXISTS official_answer_weights_backup AS SELECT * FROM official_answer_weights;',
      'CREATE TABLE IF NOT EXISTS exam_booklets_backup AS SELECT * FROM exam_booklets;',
      'CREATE TABLE IF NOT EXISTS consolidated_answers_by_concurso_backup AS SELECT * FROM consolidated_answers_by_concurso;'
    ];

    for (const query of backupQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Aviso: ${query.split(' ')[5]} - ${error.message}`);
        } else {
          console.log(`✅ Backup criado: ${query.split(' ')[5]}`);
        }
      } catch (err) {
        console.log(`⚠️  Aviso: ${query.split(' ')[5]} - Tabela pode não existir`);
      }
    }

    // Backup apenas das tabelas que existem
    console.log('\n📦 Criando backups das tabelas existentes...');
    for (const table of existingTables) {
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: `CREATE TABLE IF NOT EXISTS ${table}_backup AS SELECT * FROM ${table};` 
        });
        if (error) {
          console.log(`⚠️  Backup ${table}: ${error.message}`);
        } else {
          console.log(`✅ Backup criado: ${table}_backup`);
        }
      } catch (err) {
        console.log(`⚠️  Erro no backup ${table}: ${err}`);
      }
    }

    console.log('\n✅ FASE 1 CONCLUÍDA: Backup realizado');

  } catch (error) {
    console.error('❌ Erro na Fase 1:', error);
  }
}

implementHybridStructure();
