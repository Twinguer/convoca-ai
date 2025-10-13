import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function fixMissingColumns() {
  console.log('🔧 Corrigindo referências de colunas que não existem na tabela rankings...');

  const filesToUpdate = [
    'src/hooks/useRankingsData.tsx',
    'src/services/concursoService.ts',
    'src/pages/ConcursoDetails.tsx',
    'src/integrations/supabase/rankings/rankingQueries.ts',
    'src/integrations/supabase/rankings/concursoManager.ts',
    'src/types/rankingV2.ts',
    'src/types/concursos.ts',
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

      // Substituições específicas para colunas que não existem
      const replacements = [
        // etapa_atual -> status
        { from: /etapa_atual,/g, to: 'status,' },
        { from: /etapa_atual\s*$/gm, to: 'status' },
        { from: /\.etapa_atual/g, to: '.status' },
        { from: /concurso\.etapa_atual/g, to: 'concurso.status' },
        { from: /rankingData\.etapa_atual/g, to: 'rankingData.status' },
        { from: /etapa_atual:/g, to: 'status:' },
        { from: /etapa_atual\?/g, to: 'status?' },
        
        // disciplines -> remover ou usar estrutura correta
        { from: /disciplines,/g, to: '' },
        { from: /disciplines\s*$/gm, to: '' },
        { from: /\.disciplines/g, to: '' },
        { from: /concurso\.disciplines/g, to: 'concurso.disciplines' }, // Manter se for JSONB
        { from: /rankingData\.disciplines/g, to: 'rankingData.disciplines' }, // Manter se for JSONB
        
        // Em queries SELECT - remover colunas que não existem
        { from: /,\s*etapa_atual/g, to: '' },
        { from: /,\s*discipines/g, to: '' },
        
        // Em comentários
        { from: /\/\/.*etapa_atual.*\n/g, to: '// status\n' },
        { from: /\/\*.*etapa_atual.*\*\//g, to: '/* status */' }
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

  console.log(`\n📋 Colunas que existem na tabela rankings:`);
  console.log(`✅ id, titulo, orgao, banca, exam_type`);
  console.log(`✅ has_minimum_score, total_minimum_score, wrong_answer_penalty`);
  console.log(`✅ total_participants, status, created_at, updated_at`);
  console.log(`✅ created_by, descricao`);

  console.log(`\n❌ Colunas que NÃO existem:`);
  console.log(`❌ etapa_atual (usar status)`);
  console.log(`❌ disciplines (está em JSONB)`);
  console.log(`❌ data_publicacao (usar created_at)`);

  console.log(`\n🔧 Próximos passos:`);
  console.log(`1. Testar criação de rankings`);
  console.log(`2. Verificar se os erros 400/404 foram resolvidos`);
  console.log(`3. Verificar se a listagem funciona corretamente`);
}

// Executar correção
fixMissingColumns();



