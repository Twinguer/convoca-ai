import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function fixDataPublicacaoReferences() {
  console.log('🔧 Corrigindo referências de data_publicacao para created_at...');

  const filesToUpdate = [
    'src/hooks/useRankingsData.tsx',
    'src/services/concursoService.ts',
    'src/modules/rankings/pages/RankingsPage.tsx',
    'src/pages/CriarRanking.tsx',
    'src/pages/Admin/ListarConcursos.tsx',
    'src/components/profile/CreatedRankingsTab.tsx',
    'src/components/Admin/AnswerKeyForm.tsx',
    'src/pages/Admin/Dashboard.tsx',
    'RankingNew/services/concursoService.ts',
    'RankingNew/hooks/useRankingsData.tsx'
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
        
        // Em comentários
        { from: /\/\/.*data_publicacao.*\n/g, to: '// created_at\n' },
        { from: /\/\*.*data_publicacao.*\*\//g, to: '/* created_at */' }
      ];

      replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
          content = content.replace(from, to);
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
  console.log(`2. Verificar listagem de rankings`);
  console.log(`3. Verificar se os erros 404 foram resolvidos`);
}

// Executar correção
fixDataPublicacaoReferences();



