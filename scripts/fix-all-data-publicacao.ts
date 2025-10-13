import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function fixAllDataPublicacao() {
  console.log('🔧 Corrigindo todas as referências de data_publicacao...');

  const filesToUpdate = [
    'src/hooks/useRankingsData.tsx',
    'src/services/concursoService.ts',
    'src/pages/ConcursoDetails.tsx',
    'src/integrations/supabase/rankings/rankingQueries.ts',
    'src/integrations/supabase/rankings/concursoManager.ts',
    'src/types/rankingV2.ts',
    'src/components/Admin/CreateRanking/BasicInfoSection.tsx',
    'src/types/concursos.ts',
    'src/pages/Home.tsx',
    'src/integrations/supabase/types.ts',
    'src/components/resultados/ConcursoInfoCard.tsx',
    'src/components/Admin/FormSections/GeneralInfoSection.tsx'
  ];

  let updatedFiles = 0;
  let totalReplacements = 0;

  filesToUpdate.forEach(filePath => {
    try {
      const fullPath = join(process.cwd(), filePath);
      let content = readFileSync(fullPath, 'utf8');
      let fileReplacements = 0;

      // Substituições específicas para data_publicacao
      const replacements = [
        // Em queries SELECT
        { from: /data_publicacao,/g, to: 'created_at,' },
        { from: /data_publicacao\s*$/gm, to: 'created_at' },
        
        // Em ordenação
        { from: /\.order\(['"]data_publicacao['"]/g, to: '.order(\'created_at\'' },
        { from: /order\(['"]data_publicacao['"]/g, to: 'order(\'created_at\'' },
        
        // Em filtros
        { from: /\.eq\(['"]data_publicacao['"]/g, to: '.eq(\'created_at\'' },
        { from: /eq\(['"]data_publicacao['"]/g, to: 'eq(\'created_at\'' },
        
        // Em propriedades de objetos
        { from: /data_publicacao:/g, to: 'created_at:' },
        { from: /data_publicacao\?/g, to: 'created_at?' },
        
        // Em acessos de propriedade
        { from: /\.data_publicacao/g, to: '.created_at' },
        { from: /concurso\.data_publicacao/g, to: 'concurso.created_at' },
        { from: /rankingData\.data_publicacao/g, to: 'rankingData.created_at' },
        
        // Em formatação de data
        { from: /new Date\(concurso\.data_publicacao\)/g, to: 'new Date(concurso.created_at)' },
        { from: /format\(new Date\(concurso\.data_publicacao\)/g, to: 'format(new Date(concurso.created_at)' },
        
        // Em comentários
        { from: /\/\/.*data_publicacao.*\n/g, to: '// created_at\n' },
        { from: /\/\*.*data_publicacao.*\*\//g, to: '/* created_at */' },
        
        // Em strings de template
        { from: /`.*data_publicacao.*`/g, to: (match) => match.replace(/data_publicacao/g, 'created_at') },
        
        // Em campos de formulário
        { from: /name="data_publicacao"/g, to: 'name="created_at"' },
        { from: /field.*data_publicacao/g, to: (match) => match.replace(/data_publicacao/g, 'created_at') }
      ];

      replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
          if (typeof to === 'function') {
            content = content.replace(from, to);
          } else {
            content = content.replace(from, to);
          }
          fileReplacements += matches.length;
        }
      });

      if (fileReplacements > 0) {
        writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${filePath}: ${fileReplacements} substituições`);
        updatedFiles++;
        totalReplacements += fileReplacements;
      } else {
        console.log(`⏭️  ${filePath}: Nenhuma substituição necessária`);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar ${filePath}:`, error);
    }
  });

  console.log(`\n📊 Resumo:`);
  console.log(`✅ Arquivos atualizados: ${updatedFiles}`);
  console.log(`🔄 Total de substituições: ${totalReplacements}`);

  console.log(`\n🔧 Próximos passos:`);
  console.log(`1. Testar criação de rankings`);
  console.log(`2. Verificar se os erros 400 foram resolvidos`);
  console.log(`3. Verificar se a listagem funciona corretamente`);
}

// Executar correção
fixAllDataPublicacao();



