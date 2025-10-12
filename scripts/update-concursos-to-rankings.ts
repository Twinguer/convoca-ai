import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function updateConcursosToRankings() {
  console.log('🔄 Atualizando referências de concursos para rankings...');

  const filesToUpdate = [
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

      // Substituições específicas
      const replacements = [
        // Tabela concursos -> rankings
        { from: /\.from\(['"]concursos['"]\)/g, to: '.from(\'rankings\')' },
        { from: /from\(['"]concursos['"]\)/g, to: 'from(\'rankings\')' },
        
        // Campos específicos
        { from: /created_by_user_id/g, to: 'created_by' },
        { from: /data_publicacao/g, to: 'created_at' }, // Para ordenação
        
        // Comentários
        { from: /\/\/.*concursos.*\n/g, to: '// rankings\n' },
        { from: /\/\*.*concursos.*\*\//g, to: '/* rankings */' }
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
  console.log(`1. Verificar se o sistema está funcionando`);
  console.log(`2. Testar criação de rankings`);
  console.log(`3. Verificar listagem de rankings`);
}

// Executar atualização
updateConcursosToRankings();

