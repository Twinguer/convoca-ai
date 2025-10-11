import { readFileSync } from 'fs';
import { join } from 'path';

function generateMigrationSQL() {
  console.log('📄 Gerando SQL da migration...');
  
  try {
    // Ler o arquivo de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250115000012_create_normalized_ranking_structure.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('✅ SQL da migration gerado com sucesso!');
    console.log('\n' + '='.repeat(80));
    console.log('📋 COPIE E COLE O SQL ABAIXO NO SQL EDITOR DO SUPABASE:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    console.log('\n🎯 INSTRUÇÕES:');
    console.log('1. Acesse o dashboard do Supabase');
    console.log('2. Vá para o projeto "nomeia-ai"');
    console.log('3. Clique em "SQL Editor"');
    console.log('4. Cole o SQL acima');
    console.log('5. Clique em "Run"');
    console.log('6. Aguarde a execução');
    console.log('7. Verifique se as tabelas foram criadas');
    
    return migrationSQL;
    
  } catch (error) {
    console.error('❌ Erro ao gerar SQL:', error);
    return null;
  }
}

// Executar
generateMigrationSQL();
