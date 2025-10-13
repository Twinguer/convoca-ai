import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDiscursiveQuestions() {
  console.log('🔍 Verificando questões discursivas na classificação...\n');

  try {
    // 1. Buscar concursos que têm questões discursivas
    console.log('1️⃣ Buscando concursos com questões discursivas...');
    
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, has_discursive, has_case_study_1, has_case_study_2, has_case_study_3, discursive_weight, case_study_1_weight, case_study_2_weight, case_study_3_weight, disciplines')
      .or('has_discursive.eq.true,has_case_study_1.eq.true,has_case_study_2.eq.true,has_case_study_3.eq.true');

    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError.message);
      return;
    }

    console.log(`📊 Encontrados ${concursos?.length || 0} concursos com questões subjetivas:`);
    concursos?.forEach(concurso => {
      console.log(`   - ${concurso.titulo} (${concurso.id})`);
      console.log(`     - Discursiva: ${concurso.has_discursive} (peso: ${concurso.discursive_weight})`);
      console.log(`     - Estudo de Caso 1: ${concurso.has_case_study_1} (peso: ${concurso.case_study_1_weight})`);
      console.log(`     - Estudo de Caso 2: ${concurso.has_case_study_2} (peso: ${concurso.case_study_2_weight})`);
      console.log(`     - Estudo de Caso 3: ${concurso.has_case_study_3} (peso: ${concurso.case_study_3_weight})`);
      console.log(`     - Disciplinas JSONB:`, concurso.disciplines);
      console.log('');
    });

    if (!concursos || concursos.length === 0) {
      console.log('❌ Nenhum concurso com questões subjetivas encontrado');
      return;
    }

    // 2. Para cada concurso, verificar participações com pontuações subjetivas
    for (const concurso of concursos) {
      console.log(`\n2️⃣ Verificando participações do concurso: ${concurso.titulo}`);
      
      const { data: participations, error: participationsError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          user_id,
          score,
          discursive_score,
          case_study_1_score,
          case_study_2_score,
          case_study_3_score,
          weighted_discursive_score,
          weighted_case_study_1_score,
          weighted_case_study_2_score,
          weighted_case_study_3_score,
          users_profiles(name)
        `)
        .eq('concurso_id', concurso.id)
        .limit(5);

      if (participationsError) {
        console.log(`❌ Erro ao buscar participações:`, participationsError.message);
        continue;
      }

      console.log(`📊 Encontradas ${participations?.length || 0} participações:`);
      participations?.forEach(participation => {
        const userName = participation.users_profiles?.name || 'Usuário Anônimo';
        console.log(`   - ${userName} (${participation.user_id})`);
        console.log(`     - Score total: ${participation.score}`);
        console.log(`     - Discursiva: ${participation.discursive_score} (ponderada: ${participation.weighted_discursive_score})`);
        console.log(`     - Estudo de Caso 1: ${participation.case_study_1_score} (ponderada: ${participation.weighted_case_study_1_score})`);
        console.log(`     - Estudo de Caso 2: ${participation.case_study_2_score} (ponderada: ${participation.weighted_case_study_2_score})`);
        console.log(`     - Estudo de Caso 3: ${participation.case_study_3_score} (ponderada: ${participation.weighted_case_study_3_score})`);
        console.log('');
      });

      // 3. Verificar se as pontuações subjetivas estão sendo incluídas no score total
      console.log(`3️⃣ Verificando se pontuações subjetivas estão no score total...`);
      
      const participationsWithSubjective = participations?.filter(p => 
        (p.discursive_score && p.discursive_score > 0) ||
        (p.case_study_1_score && p.case_study_1_score > 0) ||
        (p.case_study_2_score && p.case_study_2_score > 0) ||
        (p.case_study_3_score && p.case_study_3_score > 0)
      );

      if (participationsWithSubjective && participationsWithSubjective.length > 0) {
        console.log(`✅ Encontradas ${participationsWithSubjective.length} participações com pontuações subjetivas`);
        
        participationsWithSubjective.forEach(participation => {
          const subjectiveTotal = (participation.weighted_discursive_score || 0) + 
                                 (participation.weighted_case_study_1_score || 0) + 
                                 (participation.weighted_case_study_2_score || 0) + 
                                 (participation.weighted_case_study_3_score || 0);
          
          console.log(`   - Score total: ${participation.score}`);
          console.log(`   - Pontuações subjetivas ponderadas: ${subjectiveTotal}`);
          console.log(`   - Diferença: ${participation.score - subjectiveTotal}`);
        });
      } else {
        console.log(`❌ Nenhuma participação com pontuações subjetivas encontrada`);
      }
    }

    // 4. Verificar estrutura JSONB disciplines
    console.log(`\n4️⃣ Verificando estrutura JSONB disciplines...`);
    
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines')
      .not('disciplines', 'is', null)
      .limit(3);

    if (disciplinesError) {
      console.log('❌ Erro ao buscar disciplinas:', disciplinesError.message);
    } else {
      console.log(`📊 Estrutura de disciplinas encontrada:`);
      disciplinesData?.forEach(concurso => {
        console.log(`   - ${concurso.titulo}:`);
        console.log(`     - Disciplinas:`, JSON.stringify(concurso.disciplines, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugDiscursiveQuestions();
